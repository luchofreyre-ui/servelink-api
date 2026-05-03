import { RecurringPlanService } from "../src/modules/recurring-plan/recurring-plan.service";

const newestPlan = {
  id: "rp_new",
  bookingId: "bk_new",
  customerId: "cus_new",
  franchiseOwnerId: null,
  cadence: "weekly",
  status: "active",
  pricePerVisitCents: 0,
  estimatedMinutes: 120,
  discountPercent: 15,
  startAt: new Date("2030-01-10T00:00:00.000Z"),
  nextRunAt: new Date("2030-01-17T00:00:00.000Z"),
  createdAt: new Date("2030-01-10T00:00:00.000Z"),
  updatedAt: new Date("2030-01-10T00:00:00.000Z"),
  booking: {
    id: "bk_new",
    status: "completed",
    createdAt: new Date("2030-01-09T00:00:00.000Z"),
    customer: {
      id: "cus_new",
      email: "new@example.test",
      phone: "555-0101",
    },
  },
};

const olderPlan = {
  ...newestPlan,
  id: "rp_old",
  bookingId: "bk_old",
  customerId: "cus_old",
  cadence: "monthly",
  status: "paused",
  createdAt: new Date("2030-01-01T00:00:00.000Z"),
  updatedAt: new Date("2030-01-01T00:00:00.000Z"),
  booking: {
    id: "bk_old",
    status: "completed",
    createdAt: new Date("2029-12-31T00:00:00.000Z"),
    customer: {
      id: "cus_old",
      email: null,
      phone: null,
    },
  },
};

function createService(plans = [newestPlan, olderPlan]) {
  const prisma = {
    recurringPlan: {
      findMany: jest.fn().mockResolvedValue(plans),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    service: new RecurringPlanService(prisma as any),
    prisma,
  };
}

describe("RecurringPlanService admin visibility V1", () => {
  it("lists recurring plans ordered newest first", async () => {
    const { service, prisma } = createService();

    const plans = await service.listForAdmin();

    expect(prisma.recurringPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: "desc" }],
      }),
    );
    expect(plans.map((plan) => plan.id)).toEqual(["rp_new", "rp_old"]);
  });

  it("filters by status", async () => {
    const { service, prisma } = createService([newestPlan]);

    await service.listForAdmin({ status: "active" });

    expect(prisma.recurringPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "active" },
      }),
    );
  });

  it("filters by cadence", async () => {
    const { service, prisma } = createService([newestPlan]);

    await service.listForAdmin({ cadence: "weekly" });

    expect(prisma.recurringPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { cadence: "weekly" },
      }),
    );
  });

  it("includes booking linkage and customer contact fields when present", async () => {
    const { service, prisma } = createService([newestPlan]);

    const [plan] = await service.listForAdmin();

    expect(prisma.recurringPlan.findMany).toHaveBeenCalledWith(
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
                  phone: true,
                },
              },
            },
          },
        },
      }),
    );
    expect(plan.booking).toEqual(
      expect.objectContaining({
        id: "bk_new",
        customer: expect.objectContaining({
          id: "cus_new",
          email: "new@example.test",
          phone: "555-0101",
        }),
      }),
    );
  });

  it("does not mutate plan status", async () => {
    const { service, prisma } = createService([newestPlan]);

    await service.listForAdmin({ status: "active", cadence: "weekly" });

    expect(prisma.recurringPlan.create).not.toHaveBeenCalled();
    expect(prisma.recurringPlan.update).not.toHaveBeenCalled();
  });
});
