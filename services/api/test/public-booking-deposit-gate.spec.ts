import { ServiceUnavailableException } from "@nestjs/common";
import {
  BookingPublicDepositStatus,
  BookingRemainingBalancePaymentStatus,
  BookingStatus,
} from "@prisma/client";
import { PrismaService } from "../src/prisma";
import { StripePaymentService } from "../src/modules/bookings/stripe/stripe-payment.service";
import { PaymentReliabilityService } from "../src/modules/bookings/payment-reliability/payment-reliability.service";
import { PublicBookingDepositService } from "../src/modules/public-booking-orchestrator/public-booking-deposit.service";

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
          status: BookingStatus.pending_payment,
          customerId: "u1",
          publicDepositStatus: BookingPublicDepositStatus.deposit_required,
          publicDepositAmountCents: 10_000,
          publicDepositPaymentIntentId: null,
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: null },
          estimateSnapshot: { outputJson: JSON.stringify({ estimatedPriceCents: 27_100 }) },
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

    const bookingUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "bk1",
          status: BookingStatus.pending_payment,
          customerId: "u1",
          publicDepositStatus: BookingPublicDepositStatus.deposit_required,
          publicDepositAmountCents: 10_000,
          publicDepositPaymentIntentId: "pi_existing",
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: null },
          estimateSnapshot: { outputJson: JSON.stringify({ estimatedPriceCents: 27_100 }) },
        }),
        update: bookingUpdate,
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
});
