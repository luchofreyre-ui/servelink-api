import { PublicBookingConfirmationController } from "../src/modules/bookings/public-booking-confirmation.controller";

function createController(overrides: Record<string, unknown> = {}) {
  const booking = {
    id: "bk_confirmation",
    status: "assigned",
    scheduledStart: new Date("2030-01-01T10:00:00.000Z"),
    scheduledEnd: new Date("2030-01-01T13:00:00.000Z"),
    estimatedHours: 3,
    publicDepositStatus: "deposit_succeeded",
    estimateSnapshot: {
      outputJson: JSON.stringify({
        estimatedPriceCents: 50000,
        estimatedDurationMinutes: 180,
        confidence: 0.8,
      }),
      inputJson: JSON.stringify({
        service_type: "first_time",
        recurring_cadence_intent: "weekly",
        first_time_visit_program: "one_visit",
      }),
    },
    deepCleanProgram: null,
    recurringPlans: [],
    fo: { displayName: "Test Team" },
    ...overrides,
  };
  const db = {
    booking: {
      findUnique: jest.fn().mockResolvedValue(booking),
    },
  };

  return {
    controller: new PublicBookingConfirmationController(db as any),
    db,
  };
}

describe("PublicBookingConfirmationController visit structure contract", () => {
  it("renders one_visit without reset schedule and starts recurring after Visit 1", async () => {
    const { controller } = createController();

    const res = await controller.confirmation("bk_confirmation");

    expect(res.visitStructure).toBe("one_visit");
    expect(res.resetSchedule).toBeNull();
    expect(res.recurringBeginsAt).toBe("2030-01-08T10:00:00.000Z");
  });

  it("renders two_visit with Visit 1 and Visit 2 only and starts recurring after Visit 2", async () => {
    const { controller } = createController({
      estimateSnapshot: {
        outputJson: JSON.stringify({
          estimatedPriceCents: 50000,
          estimatedDurationMinutes: 180,
          confidence: 0.8,
        }),
        inputJson: JSON.stringify({
          service_type: "first_time",
          recurring_cadence_intent: "weekly",
          first_time_visit_program: "two_visit",
        }),
      },
    });

    const res = await controller.confirmation("bk_confirmation");

    expect(res.visitStructure).toBe("two_visit");
    expect(res.resetSchedule).toEqual({
      visit1At: "2030-01-01T10:00:00.000Z",
      visit2At: "2030-01-15T10:00:00.000Z",
    });
    expect(res.resetSchedule).not.toHaveProperty("visit3At");
    expect(res.recurringBeginsAt).toBe("2030-01-22T10:00:00.000Z");
  });

  it("renders three_visit_reset with all reset visits and starts recurring after Visit 3", async () => {
    const { controller } = createController({
      estimateSnapshot: {
        outputJson: JSON.stringify({
          estimatedPriceCents: 50000,
          estimatedDurationMinutes: 180,
          confidence: 0.8,
        }),
        inputJson: JSON.stringify({
          service_type: "first_time",
          recurring_cadence_intent: "weekly",
          first_time_visit_program: "three_visit_reset",
        }),
      },
    });

    const res = await controller.confirmation("bk_confirmation");

    expect(res.visitStructure).toBe("three_visit_reset");
    expect(res.resetSchedule).toEqual({
      visit1At: "2030-01-01T10:00:00.000Z",
      visit2At: "2030-01-15T10:00:00.000Z",
      visit3At: "2030-01-29T10:00:00.000Z",
    });
    expect(res.recurringBeginsAt).toBe("2030-02-05T10:00:00.000Z");
  });
});
