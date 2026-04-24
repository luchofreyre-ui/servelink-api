import { ServiceUnavailableException } from "@nestjs/common";
import { createHash } from "node:crypto";
import {
  BookingPublicDepositStatus,
  BookingRemainingBalancePaymentStatus,
  BookingStatus,
} from "@prisma/client";
import { PrismaService } from "../src/prisma";
import { StripePaymentService } from "../src/modules/bookings/stripe/stripe-payment.service";
import { PaymentReliabilityService } from "../src/modules/bookings/payment-reliability/payment-reliability.service";
import { PublicBookingDepositService } from "../src/modules/public-booking-orchestrator/public-booking-deposit.service";

function estimateHash(outputJson: string) {
  return createHash("sha256").update(outputJson.trim()).digest("hex").slice(0, 32);
}

describe("PublicBookingDepositService gate", () => {
  const OLD_SKIP = process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM;
  const OLD_STRIPE = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM = OLD_SKIP;
    process.env.STRIPE_SECRET_KEY = OLD_STRIPE;
  });

  it("throws ServiceUnavailable when Stripe is not configured", async () => {
    delete process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM;
    delete process.env.STRIPE_SECRET_KEY;

    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "bk1",
          tenantId: "tenant_1",
          status: BookingStatus.pending_payment,
          customerId: "u1",
          publicDepositStatus: BookingPublicDepositStatus.deposit_required,
          publicDepositAmountCents: 10_000,
          publicDepositPaymentIntentId: null,
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: null },
          estimateSnapshot: { outputJson: JSON.stringify({ estimatedPriceCents: 27_100 }) },
        }),
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue({
          id: "h1",
          bookingId: "bk1",
          foId: "fo1",
          startAt: new Date("2030-01-01T10:00:00.000Z"),
          endAt: new Date("2030-01-01T12:00:00.000Z"),
          expiresAt: new Date("2030-01-01T13:00:00.000Z"),
        }),
      },
    } as unknown as PrismaService;

    const stripePayments = new StripePaymentService(
      prisma,
      {} as PaymentReliabilityService,
    );
    const svc = new PublicBookingDepositService(prisma, stripePayments);

    await expect(
      svc.ensurePublicDepositResolvedBeforeConfirm({
        bookingId: "bk1",
        holdId: "h1",
        stripePaymentMethodId: null,
        idempotencyKey: "k1",
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("syncs deposit from Stripe when local row is pending but PaymentIntent already succeeded", async () => {
    process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM = undefined;
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const outputJson = JSON.stringify({ estimatedPriceCents: 27_100 });
    const bookingUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "bk1",
          tenantId: "tenant_1",
          status: BookingStatus.pending_payment,
          customerId: "u1",
          publicDepositStatus: BookingPublicDepositStatus.deposit_required,
          publicDepositAmountCents: 10_000,
          publicDepositPaymentIntentId: "pi_existing",
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: null },
          estimateSnapshot: { outputJson },
        }),
        update: bookingUpdate,
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue({
          id: "h1",
          bookingId: "bk1",
          foId: "fo1",
          startAt: new Date("2030-01-01T10:00:00.000Z"),
          endAt: new Date("2030-01-01T12:00:00.000Z"),
          expiresAt: new Date("2030-01-01T13:00:00.000Z"),
        }),
      },
    } as unknown as PrismaService;

    const stripePayments = new StripePaymentService(
      prisma,
      {} as PaymentReliabilityService,
    );
    jest.spyOn(stripePayments, "ensureStripeCustomerForUser").mockResolvedValue("cus_x");
    jest.spyOn(stripePayments, "retrievePaymentIntent").mockResolvedValue({
      id: "pi_existing",
      status: "succeeded",
      amount: 10_000,
      metadata: {
        bookingId: "bk1",
        bookingSessionKey: "bk1",
        holdId: "h1",
        tenantId: "tenant_1",
        estimateSnapshotHash: estimateHash(outputJson),
      },
      client_secret: "cs_test",
    } as any);
    const createPi = jest.spyOn(stripePayments, "createPublicBookingDepositPaymentIntent");

    const svc = new PublicBookingDepositService(prisma, stripePayments);

    await svc.ensurePublicDepositResolvedBeforeConfirm({
      bookingId: "bk1",
      holdId: "h1",
      stripePaymentMethodId: null,
      idempotencyKey: "k1",
    });

    expect(stripePayments.retrievePaymentIntent).toHaveBeenCalledWith("pi_existing");
    expect(createPi).not.toHaveBeenCalled();
    expect(bookingUpdate).toHaveBeenCalled();
    expect(bookingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_pending_authorization,
        }),
      }),
    );
  });

  it("allows deposit_succeeded without a PaymentIntent and records idempotent visibility", async () => {
    process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM = undefined;
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const outputJson = JSON.stringify({ estimatedPriceCents: 27_100 });
    const bookingEventCreate = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce({ code: "P2002" });
    const anomalyFindFirst = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "anom_existing" });
    const anomalyCreate = jest.fn().mockResolvedValue({});
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "bk1",
          tenantId: "tenant_1",
          status: BookingStatus.pending_payment,
          customerId: "u1",
          publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
          publicDepositAmountCents: 10_000,
          publicDepositPaymentIntentId: null,
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: null },
          estimateSnapshot: { outputJson },
        }),
      },
      bookingEvent: {
        create: bookingEventCreate,
      },
      paymentAnomaly: {
        findFirst: anomalyFindFirst,
        create: anomalyCreate,
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue({
          id: "h1",
          bookingId: "bk1",
          foId: "fo1",
          startAt: new Date("2030-01-01T10:00:00.000Z"),
          endAt: new Date("2030-01-01T12:00:00.000Z"),
          expiresAt: new Date("2030-01-01T13:00:00.000Z"),
        }),
      },
    } as unknown as PrismaService;

    const stripePayments = new StripePaymentService(
      prisma,
      {} as PaymentReliabilityService,
    );
    const svc = new PublicBookingDepositService(prisma, stripePayments);

    await svc.ensurePublicDepositResolvedBeforeConfirm({
      bookingId: "bk1",
      holdId: "h1",
      stripePaymentMethodId: null,
      idempotencyKey: "k1",
    });
    await svc.ensurePublicDepositResolvedBeforeConfirm({
      bookingId: "bk1",
      holdId: "h1",
      stripePaymentMethodId: null,
      idempotencyKey: "k1",
    });

    expect(bookingEventCreate).toHaveBeenCalledTimes(2);
    expect(bookingEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          idempotencyKey: "public-deposit-missing-pi:bk1",
          payload: expect.objectContaining({
            reason: "DEPOSIT_SUCCEEDED_MISSING_PAYMENT_INTENT",
            bookingId: "bk1",
            holdId: "h1",
            publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
            source: "public_booking_confirm",
          }),
        }),
      }),
    );
    expect(anomalyCreate).toHaveBeenCalledTimes(1);
    expect(anomalyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingId: "bk1",
          kind: "public_deposit_succeeded_missing_payment_intent",
          details: expect.objectContaining({
            reason: "DEPOSIT_SUCCEEDED_MISSING_PAYMENT_INTENT",
          }),
        }),
      }),
    );
  });

  it.each([
    BookingPublicDepositStatus.deposit_required,
    BookingPublicDepositStatus.deposit_failed,
  ])("still blocks %s by requiring payment", async (publicDepositStatus) => {
    process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM = undefined;
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const outputJson = JSON.stringify({ estimatedPriceCents: 27_100 });
    const bookingUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "bk1",
          tenantId: "tenant_1",
          status: BookingStatus.pending_payment,
          customerId: "u1",
          publicDepositStatus,
          publicDepositAmountCents: 10_000,
          publicDepositPaymentIntentId: null,
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: null },
          estimateSnapshot: { outputJson },
        }),
        update: bookingUpdate,
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue({
          id: "h1",
          bookingId: "bk1",
          foId: "fo1",
          startAt: new Date("2030-01-01T10:00:00.000Z"),
          endAt: new Date("2030-01-01T12:00:00.000Z"),
          expiresAt: new Date("2030-01-01T13:00:00.000Z"),
        }),
      },
    } as unknown as PrismaService;

    const stripePayments = new StripePaymentService(
      prisma,
      {} as PaymentReliabilityService,
    );
    jest.spyOn(stripePayments, "ensureStripeCustomerForUser").mockResolvedValue("cus_x");
    jest
      .spyOn(stripePayments, "createPublicBookingDepositPaymentIntent")
      .mockResolvedValue({
        id: "pi_required",
        status: "requires_payment_method",
        client_secret: "cs_required",
      } as never);
    const svc = new PublicBookingDepositService(prisma, stripePayments);

    await expect(
      svc.ensurePublicDepositResolvedBeforeConfirm({
        bookingId: "bk1",
        holdId: "h1",
        stripePaymentMethodId: null,
        idempotencyKey: "k1",
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
      }),
    });
  });
});
