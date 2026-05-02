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

const outcome = {
  id: "rpo_1",
  bookingId: "bk_completed",
  converted: true,
  cadence: "weekly",
  recordedAt: new Date("2030-01-01T00:00:00.000Z"),
  createdAt: new Date("2030-01-01T00:00:00.000Z"),
  updatedAt: new Date("2030-01-01T00:00:00.000Z"),
  booking: {
    id: "bk_completed",
    status: "completed",
    createdAt: new Date("2030-01-01T00:00:00.000Z"),
    customer: {
      id: "cus_1",
      email: "customer@example.test",
    },
  },
};

function createService({
  booking = completedBooking(),
  existingPlan,
  outcomes = [outcome],
}: {
  booking?: unknown;
  existingPlan?: unknown;
  outcomes?: unknown[];
} = {}) {
  const prisma = {
    booking: {
      findUnique: jest.fn().mockResolvedValue(booking),
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
      upsert: jest.fn(async ({ create, update }) => ({
        id: "rpo_1",
        ...create,
        ...update,
        recordedAt: new Date("2030-01-01T00:00:00.000Z"),
        createdAt: new Date("2030-01-01T00:00:00.000Z"),
        updatedAt: new Date("2030-01-01T00:00:00.000Z"),
      })),
      findMany: jest.fn().mockResolvedValue(outcomes),
    },
  };

  return {
    service: new RecurringPlanService(prisma as any),
    prisma,
  };
}

describe("RecurringPlanOutcome V1", () => {
  it("creates converted outcome when plan created", async () => {
    const { service, prisma } = createService();

    await service.createFromBooking({
      bookingId: "bk_completed",
      cadence: "weekly",
    });

    expect(prisma.recurringPlanOutcome.upsert).toHaveBeenCalledWith({
      where: { bookingId: "bk_completed" },
      update: expect.objectContaining({
        converted: true,
        cadence: "weekly",
        recordedAt: expect.any(Date),
      }),
      create: {
        bookingId: "bk_completed",
        converted: true,
        cadence: "weekly",
      },
    });
  });

  it("upserts outcome so duplicate records are not created", async () => {
    const { service, prisma } = createService();

    await service.recordOutcome({
      bookingId: "bk_completed",
      converted: true,
      cadence: "biweekly",
    });

    expect(prisma.recurringPlanOutcome.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.recurringPlanOutcome.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { bookingId: "bk_completed" },
      }),
    );
    expect(prisma.recurringPlan.create).not.toHaveBeenCalled();
  });

  it("marks non-converted", async () => {
    const { service, prisma } = createService();

    await service.markNotConverted("bk_not_converted");

    expect(prisma.recurringPlanOutcome.upsert).toHaveBeenCalledWith({
      where: { bookingId: "bk_not_converted" },
      update: expect.objectContaining({
        converted: false,
        cadence: null,
        recordedAt: expect.any(Date),
      }),
      create: {
        bookingId: "bk_not_converted",
        converted: false,
        cadence: null,
      },
    });
  });

  it("filters by converted true or false", async () => {
    const { service, prisma } = createService();

    await service.listOutcomesForAdmin({ converted: true });
    await service.listOutcomesForAdmin({ converted: false });

    expect(prisma.recurringPlanOutcome.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { converted: true },
      }),
    );
    expect(prisma.recurringPlanOutcome.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { converted: false },
      }),
    );
  });

  it("includes booking linkage", async () => {
    const { service, prisma } = createService();

    const [result] = await service.listOutcomesForAdmin();

    expect(prisma.recurringPlanOutcome.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          booking: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              customer: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        bookingId: "bk_completed",
        booking: expect.objectContaining({
          id: "bk_completed",
          customer: expect.objectContaining({
            email: "customer@example.test",
          }),
        }),
      }),
    );
  });
});
