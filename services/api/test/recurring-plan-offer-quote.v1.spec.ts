import { BadRequestException } from "@nestjs/common";
import { RecurringPlanService } from "../src/modules/recurring-plan/recurring-plan.service";

function createService(booking?: unknown) {
  const prisma = {
    booking: {
      findUnique: jest.fn().mockResolvedValue(booking ?? null),
    },
    recurringPlan: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    recurringPlanOutcome: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  };

  return new RecurringPlanService(prisma as any);
}

describe("RecurringPlanService offer quote V1", () => {
  it("returns four cadences in contract order", () => {
    const service = createService();

    const quotes = service.getRecurringOfferQuote({
      firstCleanPriceCents: 50000,
      estimatedMinutes: 180,
    });

    expect(quotes.map((quote) => quote.cadence)).toEqual([
      "weekly",
      "every_10_days",
      "biweekly",
      "monthly",
    ]);
  });

  it("returns every_10_days with cadenceDays 10 when filtered", () => {
    const service = createService();

    const quotes = service.getRecurringOfferQuote({
      firstCleanPriceCents: 50000,
      estimatedMinutes: 180,
      cadence: "every_10_days",
    });

    expect(quotes).toHaveLength(1);
    expect(quotes[0]).toEqual(
      expect.objectContaining({
        cadence: "every_10_days",
        cadenceDays: 10,
      }),
    );
  });

  it("uses the same quote helper for estimate preview inputs", () => {
    const service = createService();

    const quotes = service.getRecurringQuoteOptionsFromEstimate({
      firstCleanPriceCents: 50000,
      firstCleanEstimatedMinutes: 180,
      estimateSnapshotLikeInput: {
        inputJson: {
          kitchenIntensity: "heavy_use",
        },
      },
    });

    expect(quotes.map((quote) => quote.cadence)).toEqual([
      "weekly",
      "every_10_days",
      "biweekly",
      "monthly",
    ]);
    expect(quotes[0].recurringPriceCents).toBe(33056);
  });

  it("prices weekly below every_10_days below biweekly below monthly", () => {
    const service = createService();

    const quotes = service.getRecurringOfferQuote({
      firstCleanPriceCents: 50000,
      estimatedMinutes: 180,
    });

    expect(quotes[0].recurringPriceCents).toBeLessThan(
      quotes[1].recurringPriceCents,
    );
    expect(quotes[1].recurringPriceCents).toBeLessThan(
      quotes[2].recurringPriceCents,
    );
    expect(quotes[2].recurringPriceCents).toBeLessThan(
      quotes[3].recurringPriceCents,
    );
  });

  it("does not let reset-only signals inflate maintenance pricing", () => {
    const service = createService();

    const base = service.getRecurringOfferQuote({
      firstCleanPriceCents: 50000,
      estimatedMinutes: 180,
      cadence: "weekly",
    })[0];
    const resetOnly = service.getRecurringOfferQuote({
      firstCleanPriceCents: 50000,
      estimatedMinutes: 180,
      estimateSnapshot: {
        outputJson: {
          overallLaborCondition: "major_reset",
          bathroomComplexity: "heavy_detailing",
          reset_level: "major_reset",
        },
      },
      cadence: "weekly",
    })[0];

    expect(resetOnly.recurringPriceCents).toBe(base.recurringPriceCents);
  });

  it("lets maintenance signals increase price within cap", () => {
    const service = createService();

    const heavy = service.getRecurringOfferQuote({
      firstCleanPriceCents: 50000,
      estimatedMinutes: 180,
      estimateSnapshot: {
        outputJson: {
          kitchenIntensity: "heavy_use",
          clutterAccess: "heavy_clutter",
          petImpact: "heavy",
          occupantCount: 5,
        },
      },
      cadence: "weekly",
    })[0];

    expect(heavy.recurringPriceCents).toBe(37500);
    expect(heavy.discountPercent).toBe(25);
  });

  it("loads booking quote without requiring completed or assigned status", async () => {
    const service = createService({
      id: "bk_quote",
      estimatedTotalCentsSnapshot: 50000,
      quotedTotal: null,
      priceTotal: null,
      estimateSnapshot: {
        inputJson: JSON.stringify({ recurring_cadence_intent: "weekly" }),
        outputJson: JSON.stringify({ estimatedDurationMinutes: 180 }),
      },
    });

    await expect(
      service.getOfferQuoteForBooking("bk_quote", "every_10_days"),
    ).resolves.toEqual([
      expect.objectContaining({
        cadence: "every_10_days",
        recurringPriceCents: 33056,
      }),
    ]);
  });

  it("rejects missing booking quote", async () => {
    const service = createService(null);

    await expect(service.getOfferQuoteForBooking("missing")).rejects.toThrow(
      new BadRequestException("BOOKING_NOT_FOUND"),
    );
  });
});
