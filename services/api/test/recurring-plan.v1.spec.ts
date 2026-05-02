import { BadRequestException } from "@nestjs/common";
import { RecurringPlanService } from "../src/modules/recurring-plan/recurring-plan.service";

function completedBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "bk_completed",
    customerId: "cus_1",
    status: "completed",
    estimateSnapshot: {
      outputJson: {
        estimatedDurationMinutes: 180,
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

  it("rejects non-completed booking", async () => {
    const { service } = createService({
      booking: completedBooking({ status: "pending_payment" }),
    });

    await expect(
      service.createFromBooking({ bookingId: "bk_pending", cadence: "weekly" }),
    ).rejects.toThrow(new BadRequestException("BOOKING_NOT_COMPLETED"));
  });

  it("rejects duplicate plan for same booking", async () => {
    const { service } = createService({
      booking: completedBooking(),
      existingPlan: { id: "rp_existing" },
    });

    await expect(
      service.createFromBooking({ bookingId: "bk_completed", cadence: "weekly" }),
    ).rejects.toThrow(
      new BadRequestException("RECURRING_PLAN_ALREADY_EXISTS"),
    );
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

  it("stores cadence, discountPercent, estimatedMinutes, pricePerVisitCents, startAt, nextRunAt", async () => {
    const { service, prisma } = createService({
      booking: completedBooking(),
    });

    await service.createFromBooking({
      bookingId: "bk_completed",
      cadence: "biweekly",
    });

    const data = prisma.recurringPlan.create.mock.calls[0][0].data;
    expect(data.cadence).toBe("biweekly");
    expect(data.discountPercent).toBe(10);
    expect(data.estimatedMinutes).toBe(180);
    expect(data.pricePerVisitCents).toBe(0);
    expect(data.startAt).toBeInstanceOf(Date);
    expect(data.nextRunAt).toBeInstanceOf(Date);
    expect(data.nextRunAt.getTime()).toBeGreaterThan(data.startAt.getTime());
  });
});
