import { HttpException, ServiceUnavailableException } from "@nestjs/common";
import { BookingPublicDepositStatus, BookingStatus } from "@prisma/client";
import { PrismaService } from "../src/prisma";
import { StripePaymentService } from "../src/modules/bookings/stripe/stripe-payment.service";
import { PaymentReliabilityService } from "../src/modules/bookings/payment-reliability/payment-reliability.service";
import {
  PublicBookingDepositService,
  publicBookingDepositPiIdempotencyKey,
} from "../src/modules/public-booking-orchestrator/public-booking-deposit.service";

describe("PublicBookingDepositService.preparePublicBookingDeposit", () => {
  const OLD_SKIP = process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM;
  const OLD_STRIPE = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM = OLD_SKIP;
    process.env.STRIPE_SECRET_KEY = OLD_STRIPE;
  });

  it("returns paymentMode none when skip-deposit env is set", async () => {
    process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM = "1";
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const prisma = {} as unknown as PrismaService;
    const stripePayments = new StripePaymentService(
      prisma,
      {} as PaymentReliabilityService,
    );
    const svc = new PublicBookingDepositService(prisma, stripePayments);

    const res = await svc.preparePublicBookingDeposit("bk1");
    expect(res.paymentMode).toBe("none");
    expect(res.classification).toBe("skip_deposit_env");
  });

  it("throws ServiceUnavailable when Stripe is not configured", async () => {
    delete process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM;
    delete process.env.STRIPE_SECRET_KEY;

    const prisma = {} as unknown as PrismaService;
    const stripePayments = new StripePaymentService(
      prisma,
      {} as PaymentReliabilityService,
    );
    const svc = new PublicBookingDepositService(prisma, stripePayments);

    await expect(svc.preparePublicBookingDeposit("bk1")).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it("syncs succeeded PI and returns deposit_succeeded", async () => {
    delete process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM;
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
    } as never);

    const svc = new PublicBookingDepositService(prisma, stripePayments);
    const res = await svc.preparePublicBookingDeposit("bk1");

    expect(res.paymentMode).toBe("none");
    expect(res.classification).toBe("deposit_succeeded");
    expect(bookingUpdate).toHaveBeenCalled();
  });
});

describe("publicBookingDepositPiIdempotencyKey", () => {
  it("is stable per booking id", () => {
    expect(publicBookingDepositPiIdempotencyKey("abc")).toBe(
      publicBookingDepositPiIdempotencyKey("abc"),
    );
  });
});

describe("prepare + confirm deposit PI idempotency", () => {
  const OLD_SKIP = process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM;
  const OLD_STRIPE = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM = OLD_SKIP;
    process.env.STRIPE_SECRET_KEY = OLD_STRIPE;
  });

  it("uses the same booking-scoped Stripe idempotency key when prepare and gate both create a PI", async () => {
    process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM = undefined;
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const bookingRow = {
      id: "bk1",
      status: BookingStatus.pending_payment,
      customerId: "u1",
      publicDepositStatus: BookingPublicDepositStatus.deposit_required,
      publicDepositAmountCents: 10_000,
      publicDepositPaymentIntentId: null,
      customer: { id: "u1", email: "a@b.c", stripeCustomerId: null },
      estimateSnapshot: { outputJson: JSON.stringify({ estimatedPriceCents: 27_100 }) },
    };

    const bookingUpdate = jest.fn().mockResolvedValue({});
    const prismaPrepare = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(bookingRow),
        update: bookingUpdate,
      },
    } as unknown as PrismaService;

    const stripePaymentsPrepare = new StripePaymentService(
      prismaPrepare,
      {} as PaymentReliabilityService,
    );
    jest
      .spyOn(stripePaymentsPrepare, "ensureStripeCustomerForUser")
      .mockResolvedValue("cus_x");
    const createPrepare = jest
      .spyOn(stripePaymentsPrepare, "createPublicBookingDepositPaymentIntent")
      .mockResolvedValue({
        id: "pi_prepare",
        status: "requires_payment_method",
        client_secret: "cs_prepare",
      } as never);

    const prepareSvc = new PublicBookingDepositService(
      prismaPrepare,
      stripePaymentsPrepare,
    );
    await prepareSvc.preparePublicBookingDeposit("bk1");
    const prepareKey = createPrepare.mock.calls[0]?.[0]?.idempotencyKey;

    const prismaEnsure = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          ...bookingRow,
          publicDepositPaymentIntentId: null,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as unknown as PrismaService;

    const stripePaymentsEnsure = new StripePaymentService(
      prismaEnsure,
      {} as PaymentReliabilityService,
    );
    jest
      .spyOn(stripePaymentsEnsure, "ensureStripeCustomerForUser")
      .mockResolvedValue("cus_x");
    const createEnsure = jest
      .spyOn(stripePaymentsEnsure, "createPublicBookingDepositPaymentIntent")
      .mockResolvedValue({
        id: "pi_gate",
        status: "requires_payment_method",
        client_secret: "cs_gate",
      } as never);

    const ensureSvc = new PublicBookingDepositService(prismaEnsure, stripePaymentsEnsure);
    await expect(
      ensureSvc.ensurePublicDepositResolvedBeforeConfirm({
        bookingId: "bk1",
        holdId: "h1",
        stripePaymentMethodId: null,
        idempotencyKey: "idem-confirm",
      }),
    ).rejects.toBeInstanceOf(HttpException);

    const ensureKey = createEnsure.mock.calls[0]?.[0]?.idempotencyKey;
    expect(ensureKey).toBe(publicBookingDepositPiIdempotencyKey("bk1"));
    expect(prepareKey).toBe(ensureKey);
  });
});
