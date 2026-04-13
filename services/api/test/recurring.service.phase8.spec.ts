import {
  RecurringCadence,
  RecurringOccurrenceStatus,
  RecurringPlanStatus,
} from "@prisma/client";
import { BookingsService } from "../src/modules/bookings/bookings.service";
import {
  BOOKING_FINALIZE_ERROR_PREFIX,
  BOOKING_NOTE_FINGERPRINT_KEY,
  buildOccurrenceBookingFingerprint,
} from "../src/modules/recurring/recurring-occurrence-identity";
import { RecurringService } from "../src/modules/recurring/recurring.service";

const VALID_INTAKE = {
  serviceId: "recurring-home-cleaning",
  homeSize: "Single family about 2200 sqft",
  bedrooms: "2",
  bathrooms: "2",
  frequency: "weekly",
  estimateFactors: {
    propertyType: "house",
    floors: "1",
    firstTimeWithServelink: "no",
    lastProfessionalClean: "1_3_months",
    clutterLevel: "light",
    kitchenCondition: "normal",
    stovetopType: "not_sure",
    bathroomCondition: "normal",
    glassShowers: "none",
    petPresence: "none",
    petAccidentsOrLitterAreas: "no",
    occupancyState: "occupied_normal",
    floorVisibility: "mostly_clear",
    carpetPercent: "26_50",
    stairsFlights: "none",
    addonIds: [] as string[],
  },
};

function planBase(overrides: Record<string, unknown> = {}) {
  return {
    id: "plan_1",
    customerId: "cust_1",
    status: RecurringPlanStatus.active,
    cadence: RecurringCadence.weekly,
    serviceType: "recurring-home-cleaning",
    intakeSnapshot: VALID_INTAKE,
    createdFromBookingId: "first_booking" as string | null,
    ...overrides,
  };
}

function occBase(
  overrides: Record<string, unknown> = {},
  planOverrides: Record<string, unknown> = {},
) {
  return {
    id: "occ_1",
    recurringPlanId: "plan_1",
    sequenceNumber: 1,
    targetDate: new Date("2026-06-01T12:00:00.000Z"),
    status: RecurringOccurrenceStatus.pending_generation,
    bookingId: null as string | null,
    generationError: null as string | null,
    processingState: "ready",
    processingAttempts: 0,
    processingToken: null as string | null,
    bookingFingerprint: null as string | null,
    bookingCreatedAt: null as Date | null,
    reconciliationState: "clean",
    recurringPlan: planBase(planOverrides),
    ...overrides,
  };
}

describe("RecurringService Phase 8 — processOccurrence", () => {
  let prisma: {
    recurringOccurrence: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    recurringPlan: { update: jest.Mock; count: jest.Mock };
    booking: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let bookings: { createBooking: jest.Mock };
  let service: RecurringService;

  beforeEach(() => {
    prisma = {
      recurringOccurrence: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn().mockResolvedValue({ processingAttempts: 1 }),
        count: jest.fn(),
      },
      recurringPlan: { update: jest.fn(), count: jest.fn() },
      booking: { findFirst: jest.fn() },
      $transaction: jest.fn(),
    };
    bookings = { createBooking: jest.fn() };
    service = new RecurringService(
      prisma as unknown as import("../src/prisma").PrismaService,
      bookings as unknown as BookingsService,
    );
  });

  it("returns processed_failure when occurrence is missing", async () => {
    prisma.recurringOccurrence.findUnique.mockResolvedValue(null);
    const r = await service.processOccurrence("missing");
    expect(r).toEqual({
      kind: "processed_failure",
      occurrenceId: "missing",
      generationError: "Occurrence not found.",
    });
    expect(bookings.createBooking).not.toHaveBeenCalled();
  });

  it("returns already_completed when processing completed with bookingId", async () => {
    prisma.recurringOccurrence.findUnique.mockResolvedValue(
      occBase({
        processingState: "completed",
        bookingId: "bk_done",
      }),
    );
    const r = await service.processOccurrence("occ_1");
    expect(r).toEqual({
      kind: "already_completed",
      occurrenceId: "occ_1",
      bookingId: "bk_done",
    });
    expect(prisma.recurringOccurrence.updateMany).not.toHaveBeenCalled();
    expect(bookings.createBooking).not.toHaveBeenCalled();
  });

  it("returns already_claimed when guarded claim updateMany affects 0 rows", async () => {
    prisma.recurringOccurrence.findUnique.mockResolvedValue(occBase());
    prisma.recurringOccurrence.updateMany.mockResolvedValueOnce({ count: 0 });
    const r = await service.processOccurrence("occ_1");
    expect(r).toEqual({ kind: "already_claimed", occurrenceId: "occ_1" });
    expect(bookings.createBooking).not.toHaveBeenCalled();
  });

  it("does not call createBooking when post-claim row already has bookingId (finalizes only)", async () => {
    prisma.recurringOccurrence.findUnique.mockResolvedValue(occBase());
    prisma.recurringOccurrence.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.recurringOccurrence.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.recurringOccurrence.findFirst.mockImplementation((args: unknown) => {
      const w = (args as { where?: { processingToken?: string } })?.where;
      return Promise.resolve(
        occBase({
          processingState: "processing",
          bookingId: "bk_existing",
          processingAttempts: 1,
          processingToken: w?.processingToken ?? null,
        }),
      );
    });
    prisma.booking.findFirst.mockResolvedValue({
      id: "bk_existing",
      customerId: "cust_1",
      status: "pending_payment",
      scheduledStart: null,
      notes: null,
    });
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn(prisma),
    );
    prisma.recurringOccurrence.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.recurringPlan.update.mockResolvedValue({});

    const r = await service.processOccurrence("occ_1");
    expect(bookings.createBooking).not.toHaveBeenCalled();
    expect(r.kind).toBe("already_completed");
    if (r.kind === "already_completed") {
      expect(r.bookingId).toBe("bk_existing");
    }
  });

  it("reconciles split-write from generationError without createBooking", async () => {
    prisma.recurringOccurrence.findUnique.mockResolvedValue(
      occBase({
        status: RecurringOccurrenceStatus.needs_review,
        processingState: "failed",
        processingAttempts: 3,
        reconciliationState: "booking_created_occurrence_pending",
        generationError: `${BOOKING_FINALIZE_ERROR_PREFIX}bk_split`,
      }),
    );
    prisma.booking.findFirst.mockResolvedValue({
      id: "bk_split",
      customerId: "cust_1",
      status: "pending_payment",
      scheduledStart: null,
      notes: null,
    });
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn(prisma),
    );
    prisma.recurringOccurrence.updateMany.mockResolvedValue({ count: 1 });
    prisma.recurringPlan.update.mockResolvedValue({});

    const r = await service.processOccurrence("occ_1");
    expect(bookings.createBooking).not.toHaveBeenCalled();
    expect(r).toEqual({
      kind: "processed_success",
      occurrenceId: "occ_1",
      bookingId: "bk_split",
    });
  });

  it("deduplicates by fingerprint via existing booking notes (no second createBooking)", async () => {
    const row = occBase();
    const fp = buildOccurrenceBookingFingerprint({
      recurringPlanId: "plan_1",
      occurrenceId: "occ_1",
      customerId: "cust_1",
      targetDateIso: row.targetDate.toISOString(),
      serviceType: "recurring-home-cleaning",
    });
    prisma.recurringOccurrence.findUnique.mockResolvedValue(row);
    prisma.recurringOccurrence.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.recurringOccurrence.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.recurringOccurrence.findFirst.mockImplementation((args: unknown) => {
      const w = (args as { where?: { processingToken?: string } })?.where;
      return Promise.resolve(
        occBase({
          processingState: "processing",
          processingAttempts: 1,
          processingToken: w?.processingToken ?? null,
        }),
      );
    });
    prisma.booking.findFirst.mockResolvedValueOnce({
      id: "bk_dup",
      customerId: "cust_1",
      status: "pending_payment",
      scheduledStart: null,
      notes: `${BOOKING_NOTE_FINGERPRINT_KEY}=${fp}`,
    });
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn(prisma),
    );
    prisma.recurringOccurrence.updateMany.mockResolvedValue({ count: 1 });
    prisma.recurringPlan.update.mockResolvedValue({});

    const r = await service.processOccurrence("occ_1");
    expect(bookings.createBooking).not.toHaveBeenCalled();
    expect(r).toEqual({
      kind: "processed_success",
      occurrenceId: "occ_1",
      bookingId: "bk_dup",
    });
  });

  it("uses first createdFromBookingId on plan finalize (never overwrites)", async () => {
    prisma.recurringOccurrence.findUnique.mockResolvedValue(occBase());
    prisma.recurringOccurrence.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.recurringOccurrence.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.recurringOccurrence.findFirst.mockImplementation((args: unknown) => {
      const w = (args as { where?: { processingToken?: string } })?.where;
      return Promise.resolve(
        occBase({
          processingState: "processing",
          processingAttempts: 1,
          processingToken: w?.processingToken ?? null,
        }),
      );
    });
    prisma.booking.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "bk_new",
        customerId: "cust_1",
        status: "pending_payment",
        scheduledStart: null,
        notes: null,
      });
    bookings.createBooking.mockResolvedValue({
      booking: {
        id: "bk_new",
        customerId: "cust_1",
        status: "pending_payment",
        scheduledStart: null,
      },
      estimate: { ok: true },
    });

    let capturedPlanUpdate: { createdFromBookingId?: string } | undefined;
    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => unknown) => {
        const txMock = {
          recurringOccurrence: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          recurringPlan: {
            update: jest.fn(
              async (args: { data: { createdFromBookingId?: string } }) => {
                capturedPlanUpdate = args.data;
                return {};
              },
            ),
          },
        };
        return fn(txMock);
      },
    );

    await service.processOccurrence("occ_1");
    expect(capturedPlanUpdate?.createdFromBookingId).toBe("first_booking");
  });

  it("marks split-write drift when finalize transaction fails after createBooking", async () => {
    prisma.recurringOccurrence.findUnique.mockResolvedValue(occBase());
    prisma.recurringOccurrence.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.recurringOccurrence.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.recurringOccurrence.findFirst.mockImplementation((args: unknown) => {
      const w = (args as { where?: { processingToken?: string } })?.where;
      return Promise.resolve(
        occBase({
          processingState: "processing",
          processingAttempts: 1,
          processingToken: w?.processingToken ?? null,
        }),
      );
    });
    prisma.booking.findFirst.mockResolvedValue(null);
    bookings.createBooking.mockResolvedValue({
      booking: {
        id: "bk_tx_fail",
        customerId: "cust_1",
        status: "pending_payment",
        scheduledStart: null,
      },
      estimate: { ok: true },
    });
    prisma.$transaction.mockRejectedValue(new Error("tx boom"));
    prisma.recurringOccurrence.updateMany.mockResolvedValueOnce({ count: 1 });

    const r = await service.processOccurrence("occ_1");
    expect(r.kind).toBe("processed_failure");
    const fallback = prisma.recurringOccurrence.updateMany.mock.calls.find(
      (c) =>
        c[0]?.data?.reconciliationState ===
        "booking_created_occurrence_pending",
    );
    expect(fallback).toBeTruthy();
  });
});

describe("RecurringService Phase 8 — ops queries", () => {
  it("getExhaustedRecurringOccurrences requests attempts >= 3", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new RecurringService(
      { recurringOccurrence: { findMany } } as unknown as import("../src/prisma").PrismaService,
      {} as BookingsService,
    );
    await service.getExhaustedRecurringOccurrences(25);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          processingAttempts: { gte: 3 },
        }),
        take: 25,
      }),
    );
  });

  it("getRecurringOpsSummary issues expected aggregate counts", async () => {
    const count = jest.fn().mockResolvedValue(0);
    const service = new RecurringService(
      {
        recurringOccurrence: { count },
        recurringPlan: { count },
      } as unknown as import("../src/prisma").PrismaService,
      {} as BookingsService,
    );
    const summary = await service.getRecurringOpsSummary();
    expect(summary).toMatchObject({
      pendingGenerationCount: 0,
      processingCount: 0,
      failedRetryableCount: 0,
      exhaustedCount: 0,
      reconciliationDriftCount: 0,
      canceledPlanWithBookedNextCount: 0,
    });
    expect(count).toHaveBeenCalledTimes(6);
  });
});
