import { BadRequestException } from "@nestjs/common";
import { RecurringPlanService } from "../src/modules/recurring-plan/recurring-plan.service";

function completedBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "bk_completed",
    customerId: "cus_1",
    status: "completed",
    publicDepositStatus: "deposit_required",
    scheduledStart: null,
    estimatedTotalCentsSnapshot: null,
    quotedTotal: null,
    priceTotal: null,
    estimateSnapshot: {
      outputJson: {
        estimatedDurationMinutes: 180,
      },
    },
    customer: { id: "cus_1" },
    ...overrides,
  };
}

function assignedDepositConfirmedBooking(overrides: Record<string, unknown> = {}) {
  return completedBooking({
    id: "bk_assigned",
    status: "assigned",
    publicDepositStatus: "deposit_succeeded",
    scheduledStart: new Date("2030-01-02T14:00:00.000Z"),
    ...overrides,
  });
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

  it("rejects pending_payment booking", async () => {
    const { service } = createService({
      booking: completedBooking({ status: "pending_payment" }),
    });

    await expect(
      service.createFromBooking({ bookingId: "bk_pending", cadence: "weekly" }),
    ).rejects.toThrow(
      new BadRequestException("BOOKING_NOT_RECURRING_ELIGIBLE"),
    );
  });

  it("rejects assigned booking without deposit_succeeded", async () => {
    const { service } = createService({
      booking: assignedDepositConfirmedBooking({
        publicDepositStatus: "deposit_required",
      }),
    });

    await expect(
      service.createFromBooking({ bookingId: "bk_assigned", cadence: "weekly" }),
    ).rejects.toThrow(
      new BadRequestException("BOOKING_NOT_RECURRING_ELIGIBLE"),
    );
  });

  it("rejects assigned booking without scheduledStart", async () => {
    const { service } = createService({
      booking: assignedDepositConfirmedBooking({ scheduledStart: null }),
    });

    await expect(
      service.createFromBooking({ bookingId: "bk_assigned", cadence: "weekly" }),
    ).rejects.toThrow(
      new BadRequestException("BOOKING_NOT_RECURRING_ELIGIBLE"),
    );
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

  it("creates plan for completed booking", async () => {
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

  it("creates plan for assigned booking with deposit_succeeded and scheduledStart", async () => {
    const { service, prisma } = createService({
      booking: assignedDepositConfirmedBooking(),
    });

    const plan = await service.createFromBooking({
      bookingId: "bk_assigned",
      cadence: "weekly",
    });

    expect(prisma.recurringPlan.create).toHaveBeenCalledTimes(1);
    expect(plan).toEqual(
      expect.objectContaining({
        bookingId: "bk_assigned",
        customerId: "cus_1",
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

  it("stores weekly discounted pricePerVisitCents from estimatedTotalCentsSnapshot", async () => {
    const { service, prisma } = createService({
      booking: assignedDepositConfirmedBooking({
        estimatedTotalCentsSnapshot: 33042,
      }),
    });

    await service.createFromBooking({
      bookingId: "bk_assigned",
      cadence: "weekly",
    });

    expect(prisma.recurringPlan.create.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        pricePerVisitCents: 28086,
        discountPercent: 15,
      }),
    );
  });

  it("stores biweekly discounted pricePerVisitCents from estimatedTotalCentsSnapshot", async () => {
    const { service, prisma } = createService({
      booking: assignedDepositConfirmedBooking({
        estimatedTotalCentsSnapshot: 33042,
      }),
    });

    await service.createFromBooking({
      bookingId: "bk_assigned",
      cadence: "biweekly",
    });

    expect(prisma.recurringPlan.create.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        pricePerVisitCents: 29738,
        discountPercent: 10,
      }),
    );
  });

  it("stores monthly discounted pricePerVisitCents from estimatedTotalCentsSnapshot", async () => {
    const { service, prisma } = createService({
      booking: assignedDepositConfirmedBooking({
        estimatedTotalCentsSnapshot: 33042,
      }),
    });

    await service.createFromBooking({
      bookingId: "bk_assigned",
      cadence: "monthly",
    });

    expect(prisma.recurringPlan.create.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        pricePerVisitCents: 31390,
        discountPercent: 5,
      }),
    );
  });

  it("records converted outcome after creation", async () => {
    const { service, prisma } = createService({
      booking: assignedDepositConfirmedBooking(),
    });

    await service.createFromBooking({
      bookingId: "bk_assigned",
      cadence: "weekly",
    });

    expect(prisma.recurringPlanOutcome.upsert).toHaveBeenCalledWith({
      where: { bookingId: "bk_assigned" },
      update: expect.objectContaining({
        converted: true,
        cadence: "weekly",
        recordedAt: expect.any(Date),
      }),
      create: {
        bookingId: "bk_assigned",
        converted: true,
        cadence: "weekly",
      },
    });
  });
});
