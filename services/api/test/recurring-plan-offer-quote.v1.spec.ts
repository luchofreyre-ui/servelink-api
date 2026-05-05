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
    expect(quotes[0].recurringPriceCents).toBe(30000);
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

    expect(heavy.recurringPriceCents).toBe(30000);
    expect(heavy.discountPercent).toBe(40);
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
        recurringPriceCents: 30000,
      }),
    ]);
  });

  it("rejects missing booking quote", async () => {
    const service = createService(null);

    await expect(service.getOfferQuoteForBooking("missing")).rejects.toThrow(
      new BadRequestException("BOOKING_NOT_FOUND"),
    );
  });

  describe("V2.1 recurring baseline + hard cap invariants", () => {
    const heavyMaintenanceSnapshot = {
      outputJson: {
        kitchenIntensity: "heavy_use",
        clutterAccess: "heavy_clutter",
        petImpact: "heavy",
        occupantCount: 5,
      },
    };

    it("worst-realistic monthly recurring stays below first clean and cap (75%)", () => {
      const service = createService();
      const firstCleanPriceCents = 165_100;
      const estimatedMinutes = 381;

      const quote = service.getRecurringOfferQuote({
        firstCleanPriceCents,
        estimatedMinutes,
        estimateSnapshot: heavyMaintenanceSnapshot,
        cadence: "monthly",
      })[0];

      expect(quote.estimatedMinutes).toBeLessThan(estimatedMinutes);
      expect(quote.recurringPriceCents).toBeLessThan(firstCleanPriceCents);
      expect(quote.estimatedMinutes).toBeLessThanOrEqual(
        Math.floor(estimatedMinutes * 0.75),
      );
    });

    it("heavy reset biweekly recurring respects 70% minute hard cap", () => {
      const service = createService();
      const estimatedMinutes = 298;
      const firstCleanPriceCents = 129_134;

      const quote = service.getRecurringOfferQuote({
        firstCleanPriceCents,
        estimatedMinutes,
        estimateSnapshot: heavyMaintenanceSnapshot,
        cadence: "biweekly",
      })[0];

      expect(quote.estimatedMinutes).toBeLessThanOrEqual(
        Math.floor(estimatedMinutes * 0.7),
      );
      expect(quote.recurringPriceCents).toBeLessThan(firstCleanPriceCents);
    });

    it("weekly standard deep-clean preview stays plausible under 60% cap", () => {
      const service = createService();
      const estimatedMinutes = 149;
      const firstCleanPriceCents = 401_92;

      const quote = service.getRecurringOfferQuote({
        firstCleanPriceCents,
        estimatedMinutes,
        estimateSnapshot: {
          outputJson: { kitchenIntensity: "moderate_use" },
        },
        cadence: "weekly",
      })[0];

      expect(quote.estimatedMinutes).toBeGreaterThan(0);
      expect(quote.estimatedMinutes).toBeLessThanOrEqual(
        Math.floor(estimatedMinutes * 0.6),
      );
      expect(quote.recurringPriceCents).toBeLessThan(firstCleanPriceCents);
    });

    it("minimal maintenance weekly does not collapse", () => {
      const service = createService();
      const estimatedMinutes = 139;
      const firstCleanPriceCents = 150_59;

      const quote = service.getRecurringOfferQuote({
        firstCleanPriceCents,
        estimatedMinutes,
        cadence: "weekly",
      })[0];

      expect(quote.estimatedMinutes).toBeGreaterThan(60);
      expect(quote.estimatedMinutes).toBeLessThan(estimatedMinutes);
      expect(quote.recurringPriceCents).toBeLessThan(firstCleanPriceCents);
    });
  });
});
