import {
  BookingDepositRefundStatus,
  BookingPublicDepositStatus,
  BookingRemainingBalancePaymentStatus,
  BookingStatus,
} from "@prisma/client";
import { BookingCancellationPaymentService } from "../src/modules/bookings/payment-lifecycle/booking-cancellation-payment.service";
import { RemainingBalanceAuthorizationService } from "../src/modules/bookings/payment-lifecycle/remaining-balance-authorization.service";
import { RemainingBalanceCaptureService } from "../src/modules/bookings/payment-lifecycle/remaining-balance-capture.service";
import { StripePaymentService } from "../src/modules/bookings/stripe/stripe-payment.service";

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
      latest_charge: null,
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
    expect(retrieve).not.toHaveBeenCalledWith(
      "pi_dep",
      expect.objectContaining({
        expand: expect.arrayContaining(["latest_charge.payment_method"]),
      }),
    );
  });

  it("authorization uses deposit PaymentIntent payment_method string", async () => {
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
        payment_method: "pm_card",
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
