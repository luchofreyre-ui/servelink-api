import { BadRequestException } from "@nestjs/common";
import { RecurringPlanService } from "../src/modules/recurring-plan/recurring-plan.service";

function completedBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "bk_completed",
    customerId: "cus_1",
    status: "completed",
    foId: null,
    tenantId: "nustandard",
    scheduledStart: new Date("2030-01-01T10:00:00.000Z"),
    estimatedTotalCentsSnapshot: 50000,
    quotedTotal: null,
    priceTotal: null,
    publicDepositStatus: "deposit_required",
    estimateSnapshot: {
      inputJson: {
        first_time_visit_program: "one_visit",
        recurring_cadence_intent: "weekly",
      },
      outputJson: {
        estimatedDurationMinutes: 180,
        estimatedPriceCents: 50000,
      },
    },
    customer: { id: "cus_1" },
    ...overrides,
  };
}

function createService({
  booking,
  existingPlan,
}: {
  booking?: unknown;
  existingPlan?: unknown;
}) {
  const prisma = {
    booking: {
      findUnique: jest.fn().mockResolvedValue(booking ?? null),
    },
    recurringPlan: {
      findFirst: jest.fn().mockResolvedValue(existingPlan ?? null),
      create: jest.fn(async ({ data }) => ({
        id: "rp_1",
        ...data,
        createdAt: new Date("2030-01-01T00:00:00.000Z"),
        updatedAt: new Date("2030-01-01T00:00:00.000Z"),
      })),
    },
    recurringPlanOutcome: {
      upsert: jest.fn(async ({ create }) => ({
        id: "rpo_1",
        ...create,
        recordedAt: new Date("2030-01-01T00:00:00.000Z"),
        createdAt: new Date("2030-01-01T00:00:00.000Z"),
        updatedAt: new Date("2030-01-01T00:00:00.000Z"),
      })),
    },
  };

  return {
    service: new RecurringPlanService(prisma as any),
    prisma,
  };
}

describe("RecurringPlanService V1", () => {
  it("rejects missing booking", async () => {
    const { service } = createService({});

    await expect(
      service.createFromBooking({ bookingId: "missing", cadence: "weekly" }),
    ).rejects.toThrow(new BadRequestException("BOOKING_NOT_FOUND"));
  });

  it("rejects booking that is not recurring eligible", async () => {
    const { service } = createService({
      booking: completedBooking({ status: "pending_payment" }),
    });

    await expect(
      service.createFromBooking({ bookingId: "bk_pending", cadence: "weekly" }),
    ).rejects.toThrow(
      new BadRequestException("BOOKING_NOT_RECURRING_ELIGIBLE"),
    );
  });

  it("returns existing plan for duplicate creation", async () => {
    const existingPlan = { id: "rp_existing", bookingId: "bk_completed" };
    const { service } = createService({
      booking: completedBooking(),
      existingPlan,
    });

    await expect(
      service.createFromBooking({ bookingId: "bk_completed", cadence: "weekly" }),
    ).resolves.toBe(existingPlan);
  });

  it("creates active recurring plan from completed booking", async () => {
    const { service, prisma } = createService({
      booking: completedBooking(),
    });

    const plan = await service.createFromBooking({
      bookingId: "bk_completed",
      cadence: "weekly",
    });

    expect(prisma.recurringPlan.create).toHaveBeenCalledTimes(1);
    expect(plan).toEqual(
      expect.objectContaining({
        bookingId: "bk_completed",
        customerId: "cus_1",
        franchiseOwnerId: null,
        cadence: "weekly",
        status: "active",
      }),
    );
  });

  it("stores maintenance-priced cadence, estimatedMinutes, pricePerVisitCents, startAt, and nextRunAt", async () => {
    const { service, prisma } = createService({
      booking: completedBooking(),
    });

    await service.createFromBooking({
      bookingId: "bk_completed",
      cadence: "biweekly",
    });

    const data = prisma.recurringPlan.create.mock.calls[0][0].data;
    expect(data.cadence).toBe("biweekly");
    expect(data.discountPercent).toBe(30);
    expect(data.estimatedMinutes).toBe(126);
    expect(data.pricePerVisitCents).toBe(35000);
    expect(data.startAt).toBeInstanceOf(Date);
    expect(data.nextRunAt).toBeInstanceOf(Date);
    expect(data.nextRunAt.toISOString()).toBe("2030-01-15T10:00:00.000Z");
  });

  it("creates plan for assigned deposit-confirmed booking with scheduledStart", async () => {
    const { service, prisma } = createService({
      booking: completedBooking({
        status: "assigned",
        publicDepositStatus: "deposit_succeeded",
      }),
    });

    await service.createFromBooking({
      bookingId: "bk_completed",
      cadence: "weekly",
    });

    expect(prisma.recurringPlan.create).toHaveBeenCalledTimes(1);
  });

  it("supports every_10_days nextRunAt and maintenance quote pricing", async () => {
    const { service, prisma } = createService({
      booking: completedBooking(),
    });

    await service.createFromBooking({
      bookingId: "bk_completed",
      cadence: "every_10_days",
    });

    const data = prisma.recurringPlan.create.mock.calls[0][0].data;
    expect(data.cadence).toBe("every_10_days");
    expect(data.estimatedMinutes).toBe(119);
    expect(data.pricePerVisitCents).toBe(33056);
    expect(data.nextRunAt.toISOString()).toBe("2030-01-11T10:00:00.000Z");
  });

  it("adds reset spacing before cadence for three_visit_reset nextRunAt", async () => {
    const { service, prisma } = createService({
      booking: completedBooking({
        estimateSnapshot: {
          inputJson: {
            first_time_visit_program: "three_visit_reset",
            recurring_cadence_intent: "weekly",
          },
          outputJson: {
            estimatedDurationMinutes: 180,
            estimatedPriceCents: 50000,
          },
        },
      }),
    });

    await service.createFromBooking({
      bookingId: "bk_completed",
      cadence: "weekly",
    });

    const data = prisma.recurringPlan.create.mock.calls[0][0].data;
    expect(data.nextRunAt.toISOString()).toBe("2030-02-05T10:00:00.000Z");
  });

  it("keeps reset-only signals out of maintenance pricing", async () => {
    const { service } = createService({ booking: completedBooking() });

    const cleanQuote = service.getRecurringOfferQuote({
      firstCleanPriceCents: 50000,
      estimatedMinutes: 180,
      estimateSnapshot: {
        outputJson: { overallLaborCondition: "major_reset" },
      },
      cadence: "weekly",
    })[0];

    const maintenanceQuote = service.getRecurringOfferQuote({
      firstCleanPriceCents: 50000,
      estimatedMinutes: 180,
      estimateSnapshot: {
        outputJson: {
          kitchenIntensity: "heavy_use",
          clutterAccess: "heavy_clutter",
          petImpact: "heavy",
        },
      },
      cadence: "weekly",
    })[0];

    expect(cleanQuote.recurringPriceCents).toBe(30000);
    expect(maintenanceQuote.recurringPriceCents).toBeGreaterThan(
      cleanQuote.recurringPriceCents,
    );
  });
});
