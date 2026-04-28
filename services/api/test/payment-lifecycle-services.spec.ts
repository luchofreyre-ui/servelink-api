import {
  BookingDepositRefundStatus,
  BookingPublicDepositStatus,
  BookingRemainingBalancePaymentStatus,
  BookingStatus,
} from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { BookingCancellationPaymentService } from "../src/modules/bookings/payment-lifecycle/booking-cancellation-payment.service";
import { RemainingBalanceAuthorizationService } from "../src/modules/bookings/payment-lifecycle/remaining-balance-authorization.service";
import { RemainingBalanceCaptureService } from "../src/modules/bookings/payment-lifecycle/remaining-balance-capture.service";
import { StripePaymentService } from "../src/modules/bookings/stripe/stripe-payment.service";

function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listSourceFiles(fullPath);
    }
    return entry.isFile() && /\.(ts|js)$/.test(entry.name) ? [fullPath] : [];
  });
}

describe("payment lifecycle services", () => {
  const OLD_STRIPE = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = OLD_STRIPE;
  });

  it("authorization skips when outside T-24h window", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const scheduledStart = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.assigned,
          scheduledStart,
          publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
          remainingBalanceAfterDepositCents: 20_000,
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_pending_authorization,
          remainingBalancePaymentIntentId: null,
          publicDepositPaymentIntentId: "pi_dep",
          stripeCustomerId: "cus_x",
          customerId: "u1",
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: "cus_x" },
        }),
      },
    } as any;

    const stripePayments = new StripePaymentService(prisma, {} as any);

    const svc = new RemainingBalanceAuthorizationService(prisma, stripePayments);
    const r = await svc.authorizeRemainingBalanceForBooking("b1");
    expect(r.ok).toBe(false);
    expect(r.skipped).toBe("outside_authorization_window");
  });

  it("authorization marks authorization_required when no payment method", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const scheduledStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const bookingUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.assigned,
          scheduledStart,
          publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
          remainingBalanceAfterDepositCents: 20_000,
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_pending_authorization,
          remainingBalancePaymentIntentId: null,
          publicDepositPaymentIntentId: "pi_dep",
          stripeCustomerId: "cus_x",
          customerId: "u1",
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: "cus_x" },
        }),
        update: bookingUpdate,
      },
    } as any;

    const stripePayments = new StripePaymentService(prisma, {} as any);
    jest.spyOn(stripePayments, "ensureStripeCustomerForUser").mockResolvedValue("cus_x");
    jest.spyOn(stripePayments, "retrievePaymentIntentForRemainingBalanceAuth").mockResolvedValue({
      payment_method: null,
    } as any);

    const svc = new RemainingBalanceAuthorizationService(prisma, stripePayments);
    const r = await svc.authorizeRemainingBalanceForBooking("b1");
    expect(r.ok).toBe(false);
    expect(r.skipped).toBe("no_payment_method");
    expect(bookingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_authorization_required,
        }),
      }),
    );
  });

  it("remaining-balance deposit PI retrieval expands payment_method only", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const stripePayments = new StripePaymentService({} as any, {} as any);
    const retrieve = jest.fn().mockResolvedValue({
      id: "pi_dep",
      payment_method: "pm_card",
    });
    (stripePayments as any).stripeClient = {
      paymentIntents: { retrieve },
    };

    await stripePayments.retrievePaymentIntentForRemainingBalanceAuth("pi_dep");

    expect(retrieve).toHaveBeenCalledWith("pi_dep", {
      expand: ["payment_method"],
    });
    const invalidNestedExpand = ["latest_charge", "payment_method"].join(".");
    expect(retrieve).not.toHaveBeenCalledWith(
      "pi_dep",
      expect.objectContaining({
        expand: expect.arrayContaining([invalidNestedExpand]),
      }),
    );
  });

  it("authorization uses reusable deposit PaymentIntent payment_method", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const scheduledStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const bookingUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.assigned,
          scheduledStart,
          publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
          remainingBalanceAfterDepositCents: 20_000,
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_pending_authorization,
          remainingBalancePaymentIntentId: null,
          publicDepositPaymentIntentId: "pi_dep",
          stripeCustomerId: "cus_x",
          remainingBalanceAuthorizedAt: null,
          customerId: "u1",
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: "cus_x" },
        }),
        update: bookingUpdate,
      },
    } as any;

    const stripePayments = new StripePaymentService(prisma, {} as any);
    jest.spyOn(stripePayments, "ensureStripeCustomerForUser").mockResolvedValue("cus_x");
    jest
      .spyOn(stripePayments, "retrievePaymentIntentForRemainingBalanceAuth")
      .mockResolvedValue({
        payment_method: {
          id: "pm_card",
          customer: "cus_x",
        },
      } as any);
    jest
      .spyOn(stripePayments, "createRemainingBalanceAuthorizationPaymentIntent")
      .mockResolvedValue({
        id: "pi_remaining",
        status: "requires_capture",
      } as any);

    const svc = new RemainingBalanceAuthorizationService(prisma, stripePayments);
    const r = await svc.authorizeRemainingBalanceForBooking("b1");

    expect(r.ok).toBe(true);
    expect(
      stripePayments.createRemainingBalanceAuthorizationPaymentIntent,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethodId: "pm_card",
        idempotencyKey: "rb-auth:v2:b1:20000",
      }),
    );
    expect(bookingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_authorized,
        }),
      }),
    );
  });

  it("authorization skips when booking has no Stripe customer", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const scheduledStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const bookingUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.assigned,
          scheduledStart,
          publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
          remainingBalanceAfterDepositCents: 20_000,
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_pending_authorization,
          remainingBalancePaymentIntentId: null,
          publicDepositPaymentIntentId: "pi_dep",
          stripeCustomerId: null,
          customerId: "u1",
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: null },
        }),
        update: bookingUpdate,
      },
    } as any;

    const stripePayments = new StripePaymentService(prisma, {} as any);
    const retrieve = jest.spyOn(stripePayments, "retrievePaymentIntentForRemainingBalanceAuth");
    const create = jest.spyOn(
      stripePayments,
      "createRemainingBalanceAuthorizationPaymentIntent",
    );

    const svc = new RemainingBalanceAuthorizationService(prisma, stripePayments);
    const r = await svc.authorizeRemainingBalanceForBooking("b1");

    expect(r).toEqual({ ok: false, skipped: "missing_customer" });
    expect(retrieve).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(bookingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          remainingBalanceAuthorizationFailureReason: "missing_customer",
        }),
      }),
    );
  });

  it("authorization skips when deposit PaymentMethod is not attached to the customer", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const scheduledStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const bookingUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.assigned,
          scheduledStart,
          publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
          remainingBalanceAfterDepositCents: 20_000,
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_pending_authorization,
          remainingBalancePaymentIntentId: null,
          publicDepositPaymentIntentId: "pi_dep",
          stripeCustomerId: "cus_x",
          customerId: "u1",
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: "cus_x" },
        }),
        update: bookingUpdate,
      },
    } as any;

    const stripePayments = new StripePaymentService(prisma, {} as any);
    jest
      .spyOn(stripePayments, "retrievePaymentIntentForRemainingBalanceAuth")
      .mockResolvedValue({
        payment_method: {
          id: "pm_card",
          customer: "cus_other",
        },
      } as any);
    const create = jest.spyOn(
      stripePayments,
      "createRemainingBalanceAuthorizationPaymentIntent",
    );

    const svc = new RemainingBalanceAuthorizationService(prisma, stripePayments);
    const r = await svc.authorizeRemainingBalanceForBooking("b1");

    expect(r).toEqual({ ok: false, skipped: "non_reusable_payment_method" });
    expect(create).not.toHaveBeenCalled();
    expect(bookingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          remainingBalanceAuthorizationFailureReason: "non_reusable_payment_method",
        }),
      }),
    );
  });

  it("remaining-balance authorization PI creation is card-only for cron safety", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const stripePayments = new StripePaymentService({} as any, {} as any);
    const create = jest.fn().mockResolvedValue({
      id: "pi_remaining",
      status: "requires_capture",
    });
    (stripePayments as any).stripeClient = {
      paymentIntents: { create },
    };

    await stripePayments.createRemainingBalanceAuthorizationPaymentIntent({
      bookingId: "b1",
      stripeCustomerId: "cus_x",
      paymentMethodId: "pm_card",
      amountCents: 20_000,
      idempotencyKey: "idem",
    });

    const createArgs = create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(createArgs).toEqual(
      expect.objectContaining({
        payment_method: "pm_card",
        payment_method_types: ["card"],
      }),
    );
    expect(createArgs.automatic_payment_methods).toBeUndefined();
  });

  it("public deposit PI creation disables redirect-capable automatic methods", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const stripePayments = new StripePaymentService({} as any, {} as any);
    const create = jest.fn().mockResolvedValue({
      id: "pi_deposit",
      status: "requires_payment_method",
    });
    (stripePayments as any).stripeClient = {
      paymentIntents: { create },
    };

    await stripePayments.createPublicBookingDepositPaymentIntent({
      bookingId: "b1",
      stripeCustomerId: "cus_x",
      idempotencyKey: "idem",
      holdId: "h1",
      tenantId: "tenant_1",
      estimateSnapshotHash: "hash",
      estimatedTotalCents: 30_000,
    });

    const createArgs = create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(createArgs).toEqual(
      expect.objectContaining({
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        customer: "cus_x",
        setup_future_usage: "off_session",
      }),
    );
    expect(createArgs.payment_method_types).toBeUndefined();
  });

  it("public deposit PI creation rejects missing Stripe customer", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const stripePayments = new StripePaymentService({} as any, {} as any);
    const create = jest.fn();
    (stripePayments as any).stripeClient = {
      paymentIntents: { create },
    };

    await expect(
      stripePayments.createPublicBookingDepositPaymentIntent({
        bookingId: "b1",
        stripeCustomerId: " ",
        idempotencyKey: "idem",
        holdId: "h1",
        tenantId: "tenant_1",
        estimateSnapshotHash: "hash",
        estimatedTotalCents: 30_000,
      }),
    ).rejects.toThrow("Deposit PaymentIntent must be attached to a Customer for cron reuse");
    expect(create).not.toHaveBeenCalled();
  });

  it("server-confirmed public deposit PI creation is card-only", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const stripePayments = new StripePaymentService({} as any, {} as any);
    const create = jest.fn().mockResolvedValue({
      id: "pi_deposit",
      status: "succeeded",
    });
    (stripePayments as any).stripeClient = {
      paymentIntents: { create },
    };

    await stripePayments.createAndConfirmPublicDepositPaymentIntent({
      bookingId: "b1",
      stripeCustomerId: "cus_x",
      paymentMethodId: "pm_card",
      idempotencyKey: "idem",
      holdId: "h1",
      tenantId: "tenant_1",
      estimateSnapshotHash: "hash",
      estimatedTotalCents: 30_000,
    });

    const createArgs = create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(createArgs).toEqual(
      expect.objectContaining({
        customer: "cus_x",
        payment_method: "pm_card",
        payment_method_types: ["card"],
        setup_future_usage: "off_session",
      }),
    );
    expect(createArgs.automatic_payment_methods).toBeUndefined();
  });

  it("capture is idempotent when already captured", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.completed,
          completedAt: new Date(),
          remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_captured,
          remainingBalancePaymentIntentId: "pi_rb",
        }),
      },
    } as any;
    const stripePayments = new StripePaymentService(prisma, {} as any);
    const retrieve = jest.spyOn(stripePayments, "retrievePaymentIntent");

    const svc = new RemainingBalanceCaptureService(prisma, stripePayments);
    const r = await svc.captureRemainingBalanceForBooking("b1");
    expect(r.ok).toBe(true);
    expect(r.skipped).toBe("already_captured");
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("cancellation within 48h retains fee without Stripe refund", async () => {
    const scheduledStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const bookingUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.canceled,
          scheduledStart,
          publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
          publicDepositAmountCents: 10_000,
          publicDepositPaymentIntentId: "pi_dep",
          depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
          cancellationFeeRetainedAt: null,
          cancellationFeeAmountCents: null,
        }),
        update: bookingUpdate,
      },
    } as any;
    const stripePayments = new StripePaymentService(prisma, {} as any);
    const refundSpy = jest.spyOn(stripePayments, "refundPaymentIntent");

    const svc = new BookingCancellationPaymentService(prisma, stripePayments);
    const r = await svc.enforcePublicDepositOnCancellation({
      bookingId: "b1",
      now: new Date(scheduledStart.getTime() - 12 * 60 * 60 * 1000),
    });
    expect(r.ok).toBe(true);
    expect(refundSpy).not.toHaveBeenCalled();
    expect(bookingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cancellationFeeAmountCents: 10_000,
          publicDepositStatus: BookingPublicDepositStatus.cancellation_fee_retained,
        }),
      }),
    );
  });

  it("cancellation with no deposit succeeded is a no-op financially", async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.canceled,
          scheduledStart: new Date(Date.now() + 72 * 60 * 60 * 1000),
          publicDepositStatus: BookingPublicDepositStatus.deposit_required,
          publicDepositAmountCents: 10_000,
          publicDepositPaymentIntentId: null,
          depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
          cancellationFeeAmountCents: null,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as any;
    const stripePayments = new StripePaymentService(prisma, {} as any);
    const svc = new BookingCancellationPaymentService(prisma, stripePayments);
    const r = await svc.enforcePublicDepositOnCancellation({ bookingId: "b1" });
    expect(r.ok).toBe(true);
    expect(r.skipped).toBe("no_deposit_succeeded");
  });
});

describe("Stripe PaymentIntent creation source invariant", () => {
  it("does not use the old remaining-balance authorization idempotency key format", () => {
    const sourceRoot = path.resolve(__dirname, "../src/modules/bookings");
    const oldKeyPattern = ["rb-auth", ":${bookingId}"].join("");
    const offenders = listSourceFiles(sourceRoot).filter((filePath) =>
      fs.readFileSync(filePath, "utf8").includes(oldKeyPattern),
    );

    expect(offenders).toEqual([]);
  });

  it("does not leave automatic payment methods redirect-capable", () => {
    const sourceRoots = [
      path.resolve(__dirname, "../src/modules/bookings"),
      path.resolve(__dirname, "../src/modules/billing"),
    ];
    const offenders = sourceRoots
      .flatMap(listSourceFiles)
      .flatMap((filePath) => {
        const source = fs.readFileSync(filePath, "utf8");
        const matches = [...source.matchAll(/automatic_payment_methods\s*:/g)];
        return matches
          .filter((match) => {
            const block = source.slice(match.index ?? 0, (match.index ?? 0) + 180);
            return !block.includes("allow_redirects");
          })
          .map(() => filePath);
      });

    expect([...new Set(offenders)]).toEqual([]);
  });
});
