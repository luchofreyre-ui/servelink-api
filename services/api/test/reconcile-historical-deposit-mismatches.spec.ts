import {
  BookingEventType,
  BookingPaymentStatus,
  BookingPublicDepositStatus,
} from "@prisma/client";
import {
  historicalDepositMismatchReconciliationInternals,
  reconcileHistoricalDepositMismatches,
} from "../scripts/reconcile-historical-deposit-mismatches";

function createMockPrisma(options?: {
  eligible?: boolean;
  existingAudit?: boolean;
  mutateOnUpdate?: boolean;
}) {
  const booking = {
    id: "booking_1",
    status: "assigned",
    paymentStatus: options?.eligible === false
      ? BookingPaymentStatus.authorized
      : BookingPaymentStatus.payment_pending,
    publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
    publicDepositPaymentIntentId: "pi_deposit_1",
    createdAt: new Date("2030-01-01T00:00:00.000Z"),
    updatedAt: new Date("2030-01-01T00:00:00.000Z"),
    customer: { email: "customer@example.com" },
  };
  const bookingEvents: Array<Record<string, unknown>> = options?.existingAudit
    ? [
        {
          id: "evt_existing",
          bookingId: booking.id,
          type: historicalDepositMismatchReconciliationInternals.EVENT_TYPE,
          payload: {
            reconciliationType:
              historicalDepositMismatchReconciliationInternals.RECONCILIATION_TYPE,
          },
        },
      ]
    : [];

  const prisma: Record<string, any> = {
    booking: {
      findMany: jest.fn(async () =>
        booking.paymentStatus === BookingPaymentStatus.payment_pending &&
        booking.publicDepositStatus === BookingPublicDepositStatus.deposit_succeeded
          ? [{ ...booking, customer: { ...booking.customer } }]
          : [],
      ),
      findUnique: jest.fn(async () => ({
        ...booking,
        customer: { ...booking.customer },
      })),
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        if (options?.mutateOnUpdate !== false) {
          Object.assign(booking, data);
        }
        return booking;
      }),
    },
    paymentAnomaly: {
      findMany: jest.fn(async () => []),
    },
    bookingEvent: {
      findFirst: jest.fn(async () => bookingEvents[0] ?? null),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        bookingEvents.push({ id: `evt_${bookingEvents.length + 1}`, ...data });
        return bookingEvents[bookingEvents.length - 1];
      }),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(prisma),
    ),
    __booking: booking,
    __bookingEvents: bookingEvents,
  };

  return prisma as typeof prisma & { __booking: typeof booking };
}

describe("reconcileHistoricalDepositMismatches", () => {
  it("dry-run does not mutate eligible bookings", async () => {
    const prisma = createMockPrisma();

    const report = await reconcileHistoricalDepositMismatches(prisma as never, {
      executedBy: "test",
    });

    expect(report.dryRun).toBe(true);
    expect(report.totalEligible).toBe(1);
    expect(report.wouldUpdate).toBe(1);
    expect(prisma.__booking.paymentStatus).toBe(
      BookingPaymentStatus.payment_pending,
    );
    expect(prisma.booking.update).not.toHaveBeenCalled();
    expect(prisma.bookingEvent.create).not.toHaveBeenCalled();
  });

  it("execute reconciles an eligible booking and writes one audit event", async () => {
    const prisma = createMockPrisma();

    const report = await reconcileHistoricalDepositMismatches(prisma as never, {
      execute: true,
      confirm:
        historicalDepositMismatchReconciliationInternals.CONFIRMATION_PHRASE,
      executedBy: "test-admin",
      now: new Date("2030-01-02T00:00:00.000Z"),
    });

    expect(report.updated).toBe(1);
    expect(prisma.__booking.paymentStatus).toBe(BookingPaymentStatus.authorized);
    expect(prisma.__booking.publicDepositStatus).toBe(
      BookingPublicDepositStatus.deposit_succeeded,
    );
    expect(prisma.bookingEvent.create).toHaveBeenCalledTimes(1);
    expect(prisma.bookingEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "PAYMENT_RECONCILIATION_APPLIED" as BookingEventType,
          idempotencyKey:
            "historical_deposit_mismatch_fix:booking_1",
          payload: expect.objectContaining({
            reconciliationType: "historical_deposit_mismatch_fix",
            previousPaymentStatus: BookingPaymentStatus.payment_pending,
            newPaymentStatus: BookingPaymentStatus.authorized,
            publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
            executedBy: "test-admin",
            dryRun: false,
            scriptVersion:
              "targeted-historical-deposit-mismatch-reconciliation-v1",
          }),
        }),
      }),
    );
  });

  it("execute is idempotent when the audit event already exists", async () => {
    const prisma = createMockPrisma({ mutateOnUpdate: false });

    const first = await reconcileHistoricalDepositMismatches(prisma as never, {
      execute: true,
      confirm:
        historicalDepositMismatchReconciliationInternals.CONFIRMATION_PHRASE,
      executedBy: "test-admin",
    });
    const second = await reconcileHistoricalDepositMismatches(prisma as never, {
      execute: true,
      confirm:
        historicalDepositMismatchReconciliationInternals.CONFIRMATION_PHRASE,
      executedBy: "test-admin",
    });

    expect(first.updated).toBe(1);
    expect(second.updated).toBe(0);
    expect(second.alreadyReconciled).toBe(1);
    expect(prisma.bookingEvent.create).toHaveBeenCalledTimes(1);
  });

  it("does not touch non-eligible bookings", async () => {
    const prisma = createMockPrisma({ eligible: false });

    const report = await reconcileHistoricalDepositMismatches(prisma as never, {
      execute: true,
      confirm:
        historicalDepositMismatchReconciliationInternals.CONFIRMATION_PHRASE,
      executedBy: "test-admin",
    });

    expect(report.totalEligible).toBe(0);
    expect(report.updated).toBe(0);
    expect(prisma.booking.update).not.toHaveBeenCalled();
    expect(prisma.bookingEvent.create).not.toHaveBeenCalled();
  });
});
