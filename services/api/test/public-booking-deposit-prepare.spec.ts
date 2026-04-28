import { HttpException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { BookingPublicDepositStatus, BookingStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../src/prisma";
import { StripePaymentService } from "../src/modules/bookings/stripe/stripe-payment.service";
import { PaymentReliabilityService } from "../src/modules/bookings/payment-reliability/payment-reliability.service";
import {
  PublicBookingDepositService,
  publicBookingDepositPiIdempotencyKey,
} from "../src/modules/public-booking-orchestrator/public-booking-deposit.service";

function estimateHash(outputJson: string) {
  return createHash("sha256").update(outputJson.trim()).digest("hex").slice(0, 32);
}

function duplicateBookingEventIdempotencyError() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target: ["bookingId", "idempotencyKey"] },
  });
}

describe("PublicBookingDepositService.preparePublicBookingDeposit", () => {
  const OLD_SKIP = process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM;
  const OLD_DEPOSIT_MODE = process.env.PUBLIC_BOOKING_DEPOSIT_MODE;
  const OLD_STRIPE = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM = OLD_SKIP;
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = OLD_DEPOSIT_MODE;
    process.env.STRIPE_SECRET_KEY = OLD_STRIPE;
  });

  it("returns paymentMode none when deposit mode is bypass", async () => {
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = "bypass";
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const prisma = {} as unknown as PrismaService;
    const stripePayments = new StripePaymentService(
      prisma,
      {} as PaymentReliabilityService,
    );
    const svc = new PublicBookingDepositService(prisma, stripePayments);

    const res = await svc.preparePublicBookingDeposit("bk1", "h1");
    expect(res.paymentMode).toBe("none");
    expect(res.classification).toBe("skip_deposit_env");
    expect(res.publicDepositStatus).toBe("deposit_succeeded");
  });

  it("returns paymentMode none when Stripe is not configured", async () => {
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = "required";
    delete process.env.STRIPE_SECRET_KEY;

    const prisma = {} as unknown as PrismaService;
    const stripePayments = new StripePaymentService(
      prisma,
      {} as PaymentReliabilityService,
    );
    const svc = new PublicBookingDepositService(prisma, stripePayments);

    const res = await svc.preparePublicBookingDeposit("bk1", "h1");
    expect(res).toEqual({
      kind: "public_booking_deposit_prepare",
      bookingId: "bk1",
      paymentMode: "none",
      classification: "skip_deposit_env",
      publicDepositStatus: "deposit_succeeded",
    });
  });

  it("rejects missing tenant context before creating a PaymentIntent", async () => {
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = "required";
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "bk1",
          tenantId: "",
          status: BookingStatus.pending_payment,
          customerId: "u1",
          publicDepositStatus: BookingPublicDepositStatus.deposit_required,
          publicDepositAmountCents: 10_000,
          publicDepositPaymentIntentId: null,
          stripeCustomerId: null,
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
    const createPi = jest.spyOn(stripePayments, "createPublicBookingDepositPaymentIntent");
    const svc = new PublicBookingDepositService(prisma, stripePayments);

    await expect(svc.preparePublicBookingDeposit("bk1", "h1")).rejects.toMatchObject({
      response: expect.objectContaining({ code: "PUBLIC_BOOKING_TENANT_REQUIRED" }),
    });
    expect(createPi).not.toHaveBeenCalled();
  });

  it("syncs succeeded PI and returns deposit_succeeded", async () => {
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = "required";
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const bookingUpdate = jest.fn().mockResolvedValue({});
    const bookingEventCreate = jest.fn().mockResolvedValue({});
    const outputJson = JSON.stringify({ estimatedPriceCents: 27_100 });
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
      bookingEvent: {
        create: bookingEventCreate,
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
    } as never);

    const svc = new PublicBookingDepositService(prisma, stripePayments);
    const res = await svc.preparePublicBookingDeposit("bk1", "h1");

    expect(res.paymentMode).toBe("none");
    expect(res.classification).toBe("deposit_succeeded");
    expect(bookingUpdate).toHaveBeenCalled();
    expect(bookingEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingId: "bk1",
          idempotencyKey: "public-deposit-sync:pi_existing",
        }),
      }),
    );
  });

  it("does not treat deposit_succeeded without a PaymentIntent as satisfied", async () => {
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = "required";
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const outputJson = JSON.stringify({ estimatedPriceCents: 27_100 });
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
    const createPi = jest.spyOn(stripePayments, "createPublicBookingDepositPaymentIntent");
    const svc = new PublicBookingDepositService(prisma, stripePayments);

    const res = await svc.preparePublicBookingDeposit("bk1", "h1");

    expect(res.paymentMode).toBe("none");
    expect(res.classification).toBe("deposit_inconsistent");
    expect(createPi).not.toHaveBeenCalled();
  });

  it("uses the locked server-side deposit amount and hold metadata", async () => {
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = "required";
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const outputJson = JSON.stringify({ estimatedPriceCents: 999_999 });
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
          stripeCustomerId: null,
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: null },
          estimateSnapshot: { outputJson },
        }),
        update: jest.fn().mockResolvedValue({}),
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
    const createPi = jest
      .spyOn(stripePayments, "createPublicBookingDepositPaymentIntent")
      .mockResolvedValue({
        id: "pi_new",
        status: "requires_payment_method",
        client_secret: "cs_new",
      } as never);

    const svc = new PublicBookingDepositService(prisma, stripePayments);
    const res = await svc.preparePublicBookingDeposit("bk1", "h1");

    expect(res.amountCents).toBe(10_000);
    expect(createPi).toHaveBeenCalledTimes(1);
    expect(createPi).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: "bk1",
        stripeCustomerId: "cus_x",
        holdId: "h1",
        tenantId: "tenant_1",
        estimatedTotalCents: 999_999,
      }),
    );
  });

  it("returns existing non-succeeded deposit PaymentIntent without creating another one", async () => {
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = "required";
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const outputJson = JSON.stringify({ estimatedPriceCents: 27_100 });
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
          stripeCustomerId: "cus_x",
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: "cus_x" },
          estimateSnapshot: { outputJson },
        }),
        update: jest.fn().mockResolvedValue({}),
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
    const retrievePi = jest.spyOn(stripePayments, "retrievePaymentIntent").mockResolvedValue({
      id: "pi_existing",
      status: "requires_payment_method",
      amount: 10_000,
      metadata: {
        bookingId: "bk1",
        bookingSessionKey: "bk1",
        holdId: "h1",
        tenantId: "tenant_1",
        estimateSnapshotHash: estimateHash(outputJson),
      },
      client_secret: "cs_existing",
    } as never);
    const createPi = jest.spyOn(stripePayments, "createPublicBookingDepositPaymentIntent");

    const svc = new PublicBookingDepositService(prisma, stripePayments);
    const res = await svc.preparePublicBookingDeposit("bk1", "h1");

    expect(createPi).not.toHaveBeenCalled();
    expect(retrievePi).toHaveBeenCalledWith("pi_existing");
    expect(res).toEqual(
      expect.objectContaining({
        paymentMode: "deposit",
        classification: "payment_required",
        clientSecret: "cs_existing",
        paymentIntentId: "pi_existing",
        alreadyExists: true,
      }),
    );
  });

  it("returns alreadyCompleted after deposit succeeded without creating another PaymentIntent", async () => {
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = "required";
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const bookingUpdate = jest.fn().mockResolvedValue({});
    const bookingEventCreate = jest.fn().mockResolvedValue({});
    const outputJson = JSON.stringify({ estimatedPriceCents: 27_100 });
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "bk1",
          tenantId: "tenant_1",
          status: BookingStatus.pending_payment,
          customerId: "u1",
          publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
          publicDepositAmountCents: 10_000,
          publicDepositPaymentIntentId: "pi_existing",
          stripeCustomerId: null,
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: null },
          estimateSnapshot: { outputJson },
        }),
        update: bookingUpdate,
      },
      bookingEvent: {
        create: bookingEventCreate,
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
      client_secret: "cs_existing",
    } as never);
    const ensureCustomer = jest.spyOn(stripePayments, "ensureStripeCustomerForUser");
    const createPi = jest.spyOn(stripePayments, "createPublicBookingDepositPaymentIntent");

    const svc = new PublicBookingDepositService(prisma, stripePayments);
    const res = await svc.preparePublicBookingDeposit("bk1", "h1");

    expect(createPi).not.toHaveBeenCalled();
    expect(ensureCustomer).not.toHaveBeenCalled();
    expect(bookingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
          publicDepositPaymentIntentId: "pi_existing",
        }),
      }),
    );
    expect(bookingEventCreate).toHaveBeenCalledTimes(1);
    expect(res).toEqual(
      expect.objectContaining({
        paymentMode: "none",
        classification: "deposit_succeeded",
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        paymentIntentId: "pi_existing",
        alreadyCompleted: true,
      }),
    );
  });

  it("returns alreadyCompleted when succeeded PI sync event already exists", async () => {
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = "required";
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const bookingUpdate = jest.fn().mockResolvedValue({});
    const bookingEventCreate = jest
      .fn()
      .mockRejectedValue(duplicateBookingEventIdempotencyError());
    const outputJson = JSON.stringify({ estimatedPriceCents: 27_100 });
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "bk1",
          tenantId: "tenant_1",
          status: BookingStatus.pending_payment,
          customerId: "u1",
          publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
          publicDepositAmountCents: 10_000,
          publicDepositPaymentIntentId: "pi_existing",
          stripeCustomerId: null,
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: null },
          estimateSnapshot: { outputJson },
        }),
        update: bookingUpdate,
      },
      bookingEvent: {
        create: bookingEventCreate,
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
      client_secret: "cs_existing",
    } as never);
    const createPi = jest.spyOn(stripePayments, "createPublicBookingDepositPaymentIntent");

    const svc = new PublicBookingDepositService(prisma, stripePayments);
    const res = await svc.preparePublicBookingDeposit("bk1", "h1");

    expect(createPi).not.toHaveBeenCalled();
    expect(bookingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
          publicDepositPaymentIntentId: "pi_existing",
        }),
      }),
    );
    expect(bookingEventCreate).toHaveBeenCalledTimes(1);
    expect(res).toEqual(
      expect.objectContaining({
        paymentMode: "none",
        classification: "deposit_succeeded",
        alreadyCompleted: true,
      }),
    );
  });

  it("rethrows non-duplicate errors from succeeded PI sync event creation", async () => {
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = "required";
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const eventError = new Error("database unavailable");
    const outputJson = JSON.stringify({ estimatedPriceCents: 27_100 });
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "bk1",
          tenantId: "tenant_1",
          status: BookingStatus.pending_payment,
          customerId: "u1",
          publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
          publicDepositAmountCents: 10_000,
          publicDepositPaymentIntentId: "pi_existing",
          stripeCustomerId: null,
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: null },
          estimateSnapshot: { outputJson },
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      bookingEvent: {
        create: jest.fn().mockRejectedValue(eventError),
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
      client_secret: "cs_existing",
    } as never);

    const svc = new PublicBookingDepositService(prisma, stripePayments);

    await expect(svc.preparePublicBookingDeposit("bk1", "h1")).rejects.toThrow(
      "database unavailable",
    );
  });

  it("duplicate deposit prepare for same booking creates PaymentIntent only once", async () => {
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = "required";
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const outputJson = JSON.stringify({ estimatedPriceCents: 27_100 });
    let publicDepositPaymentIntentId: string | null = null;
    const prisma = {
      booking: {
        findUnique: jest.fn().mockImplementation(async () => ({
          id: "bk1",
          tenantId: "tenant_1",
          status: BookingStatus.pending_payment,
          customerId: "u1",
          publicDepositStatus: BookingPublicDepositStatus.deposit_required,
          publicDepositAmountCents: 10_000,
          publicDepositPaymentIntentId,
          stripeCustomerId: "cus_x",
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: "cus_x" },
          estimateSnapshot: { outputJson },
        })),
        update: jest.fn().mockImplementation(async (args: { data?: { publicDepositPaymentIntentId?: string | null } }) => {
          if (args.data?.publicDepositPaymentIntentId !== undefined) {
            publicDepositPaymentIntentId = args.data.publicDepositPaymentIntentId;
          }
          return {};
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
    const createPi = jest
      .spyOn(stripePayments, "createPublicBookingDepositPaymentIntent")
      .mockResolvedValue({
        id: "pi_new",
        status: "requires_payment_method",
        client_secret: "cs_new",
      } as never);
    const retrievePi = jest.spyOn(stripePayments, "retrievePaymentIntent").mockResolvedValue({
      id: "pi_new",
      status: "requires_payment_method",
      client_secret: "cs_new",
    } as never);

    const svc = new PublicBookingDepositService(prisma, stripePayments);
    const first = await svc.preparePublicBookingDeposit("bk1", "h1");
    const second = await svc.preparePublicBookingDeposit("bk1", "h1");

    expect(first.paymentIntentId).toBe("pi_new");
    expect(second).toEqual(
      expect.objectContaining({
        paymentIntentId: "pi_new",
        clientSecret: "cs_new",
        alreadyExists: true,
      }),
    );
    expect(createPi).toHaveBeenCalledTimes(1);
    expect(retrievePi).toHaveBeenCalledWith("pi_new");
  });

  it("returns controlled error when existing deposit PaymentIntent cannot be retrieved", async () => {
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = "required";
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "bk1",
          tenantId: "tenant_1",
          status: BookingStatus.pending_payment,
          customerId: "u1",
          publicDepositStatus: BookingPublicDepositStatus.deposit_required,
          publicDepositAmountCents: 10_000,
          publicDepositPaymentIntentId: "pi_missing",
          stripeCustomerId: "cus_x",
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: "cus_x" },
          estimateSnapshot: { outputJson: JSON.stringify({ estimatedPriceCents: 27_100 }) },
        }),
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;
    const stripePayments = new StripePaymentService(
      prisma,
      {} as PaymentReliabilityService,
    );
    jest
      .spyOn(stripePayments, "retrievePaymentIntent")
      .mockRejectedValue(new Error("No such payment_intent"));
    const createPi = jest.spyOn(stripePayments, "createPublicBookingDepositPaymentIntent");

    const svc = new PublicBookingDepositService(prisma, stripePayments);

    await expect(svc.preparePublicBookingDeposit("bk1")).rejects.toMatchObject({
      response: expect.objectContaining({
        code: "PUBLIC_BOOKING_DEPOSIT_PAYMENT_INTENT_RETRIEVE_FAILED",
        message: "Existing deposit PaymentIntent could not be retrieved",
        paymentIntentId: "pi_missing",
      }),
    });
    expect(createPi).not.toHaveBeenCalled();
  });

  it("creates a booking-scoped deposit before a hold exists", async () => {
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = "required";
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const outputJson = JSON.stringify({ estimatedPriceCents: 42_500 });
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
          stripeCustomerId: null,
          customer: { id: "u1", email: "a@b.c", stripeCustomerId: null },
          estimateSnapshot: { outputJson },
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as unknown as PrismaService;
    const stripePayments = new StripePaymentService(
      prisma,
      {} as PaymentReliabilityService,
    );
    jest.spyOn(stripePayments, "ensureStripeCustomerForUser").mockResolvedValue("cus_x");
    const createPi = jest
      .spyOn(stripePayments, "createPublicBookingDepositPaymentIntent")
      .mockResolvedValue({
        id: "pi_new",
        status: "requires_payment_method",
        client_secret: "cs_new",
      } as never);

    const svc = new PublicBookingDepositService(prisma, stripePayments);
    const res = await svc.preparePublicBookingDeposit("bk1");

    expect(res.paymentMode).toBe("deposit");
    expect(createPi).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: "bk1",
        holdId: null,
        tenantId: "tenant_1",
        estimatedTotalCents: 42_500,
      }),
    );
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
  const OLD_DEPOSIT_MODE = process.env.PUBLIC_BOOKING_DEPOSIT_MODE;
  const OLD_STRIPE = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM = OLD_SKIP;
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = OLD_DEPOSIT_MODE;
    process.env.STRIPE_SECRET_KEY = OLD_STRIPE;
  });

  it("uses the same booking+hold-scoped Stripe idempotency key when prepare and gate both create a PI", async () => {
    process.env.PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM = undefined;
    process.env.PUBLIC_BOOKING_DEPOSIT_MODE = "required";
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    const bookingRow = {
      id: "bk1",
      tenantId: "tenant_1",
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
    await prepareSvc.preparePublicBookingDeposit("bk1", "h1");
    const prepareKey = createPrepare.mock.calls[0]?.[0]?.idempotencyKey;

    const prismaEnsure = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          ...bookingRow,
          publicDepositPaymentIntentId: null,
        }),
        update: jest.fn().mockResolvedValue({}),
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
    expect(ensureKey).toBe(publicBookingDepositPiIdempotencyKey("bk1", "h1"));
    expect(prepareKey).toBe(ensureKey);
  });
});
