import { BadRequestException } from "@nestjs/common";
import { RecurringPlanController } from "../src/modules/recurring-plan/recurring-plan.controller";
import { RecurringPlanService } from "../src/modules/recurring-plan/recurring-plan.service";

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: "bk_quote",
    status: "pending_payment",
    estimatedTotalCentsSnapshot: 20000,
    quotedTotal: null,
    priceTotal: null,
    estimateSnapshot: {
      outputJson: {
        estimatedDurationMinutes: 180,
      },
    },
    ...overrides,
  };
}

function createService({ bookingResult }: { bookingResult?: unknown } = {}) {
  const prisma = {
    booking: {
      findUnique: jest
        .fn()
        .mockResolvedValue(
          bookingResult === undefined ? booking() : bookingResult,
        ),
    },
  };

  const service = new RecurringPlanService(prisma as any);

  return {
    controller: new RecurringPlanController(service),
    prisma,
    service,
  };
}

describe("RecurringPlan offer quote V1", () => {
  it("returns quotes for weekly, biweekly, and monthly", () => {
    const { service } = createService();

    const quotes = service.getRecurringOfferQuote({
      firstCleanPriceCents: 20000,
      estimatedMinutes: 180,
    });

    expect(quotes.map((quote) => quote.cadence)).toEqual([
      "weekly",
      "biweekly",
      "monthly",
    ]);
  });

  it("quote endpoint with cadence weekly returns one quote only", async () => {
    const { controller } = createService();

    const quotes = await controller.getOfferQuote("bk_quote", "weekly");

    expect(quotes).toHaveLength(1);
    expect(quotes[0]).toEqual(
      expect.objectContaining({
        cadence: "weekly",
      }),
    );
  });

  it("quote endpoint without cadence returns all three", async () => {
    const { controller } = createService();

    const quotes = await controller.getOfferQuote("bk_quote");

    expect(quotes.map((quote) => quote.cadence)).toEqual([
      "weekly",
      "biweekly",
      "monthly",
    ]);
  });

  it("quote endpoint treats not_sure cadence as unlocked", async () => {
    const { controller } = createService();

    const quotes = await controller.getOfferQuote("bk_quote", "not_sure");

    expect(quotes).toHaveLength(3);
  });

  it("uses weekly maintenance pricing", () => {
    const { service } = createService();

    const [weekly] = service.getRecurringOfferQuote({
      firstCleanPriceCents: 20000,
      estimatedMinutes: 180,
    });

    expect(weekly).toEqual(
      expect.objectContaining({
        discountPercent: 40,
        estimatedMinutes: 108,
        recurringPriceCents: 12000,
        savingsCents: 8000,
      }),
    );
  });

  it("uses biweekly maintenance pricing", () => {
    const { service } = createService();

    const [, biweekly] = service.getRecurringOfferQuote({
      firstCleanPriceCents: 20000,
      estimatedMinutes: 180,
    });

    expect(biweekly).toEqual(
      expect.objectContaining({
        discountPercent: 30,
        estimatedMinutes: 126,
        recurringPriceCents: 14000,
        savingsCents: 6000,
      }),
    );
  });

  it("uses monthly maintenance pricing", () => {
    const { service } = createService();

    const [, , monthly] = service.getRecurringOfferQuote({
      firstCleanPriceCents: 20000,
      estimatedMinutes: 180,
    });

    expect(monthly).toEqual(
      expect.objectContaining({
        discountPercent: 20,
        estimatedMinutes: 144,
        recurringPriceCents: 16000,
        savingsCents: 4000,
      }),
    );
  });

  it("heavy reset and bathroom detail signals do not inflate maintenance multiplier", () => {
    const { service } = createService();

    const [weekly] = service.getRecurringOfferQuote({
      firstCleanPriceCents: 20000,
      estimatedMinutes: 180,
      estimateSnapshot: {
        outputJson: {
          estimatedDurationMinutes: 180,
          primaryIntent: "reset_level",
          overallLaborCondition: "major_reset",
          lastProCleanRecency: "unknown_or_not_recently",
          bathroomComplexity: "heavy_detailing",
        },
      },
      cadence: "weekly",
    });

    expect(weekly).toEqual(
      expect.objectContaining({
        estimatedMinutes: 108,
        recurringPriceCents: 12000,
      }),
    );
  });

  it("pets and kitchen heavy_use can increase recurring price", () => {
    const { service } = createService();

    const [baseline] = service.getRecurringOfferQuote({
      firstCleanPriceCents: 20000,
      estimatedMinutes: 180,
      estimateSnapshot: {
        outputJson: {
          estimatedDurationMinutes: 180,
        },
      },
      cadence: "weekly",
    });
    const [higherLoad] = service.getRecurringOfferQuote({
      firstCleanPriceCents: 20000,
      estimatedMinutes: 180,
      estimateSnapshot: {
        outputJson: {
          estimatedDurationMinutes: 180,
          kitchenIntensity: "heavy_use",
          hasPets: true,
        },
      },
      cadence: "weekly",
    });

    expect(higherLoad.recurringPriceCents).toBeGreaterThan(
      baseline.recurringPriceCents,
    );
  });

  it("weekly price remains below biweekly and monthly for the same load", () => {
    const { service } = createService();

    const [weekly, biweekly, monthly] = service.getRecurringOfferQuote({
      firstCleanPriceCents: 20000,
      estimatedMinutes: 180,
      estimateSnapshot: {
        outputJson: {
          estimatedDurationMinutes: 180,
          kitchenIntensity: "heavy_use",
          clutterAccess: "moderate_clutter",
          hasPets: true,
        },
      },
    });

    expect(weekly.recurringPriceCents).toBeLessThan(
      biweekly.recurringPriceCents,
    );
    expect(biweekly.recurringPriceCents).toBeLessThan(
      monthly.recurringPriceCents,
    );
  });

  it("discountPercent is derived dynamically from recurring price ratio", () => {
    const { service } = createService();

    const [weekly] = service.getRecurringOfferQuote({
      firstCleanPriceCents: 20000,
      estimatedMinutes: 180,
      estimateSnapshot: {
        outputJson: {
          estimatedDurationMinutes: 180,
          kitchenIntensity: "heavy_use",
          hasPets: true,
        },
      },
      cadence: "weekly",
    });

    expect(weekly.recurringPriceCents).toBe(14444);
    expect(weekly.savingsCents).toBe(5556);
    expect(weekly.discountPercent).toBe(28);
  });

  it("quote endpoint rejects missing booking", async () => {
    const { controller } = createService({ bookingResult: null });

    await expect(controller.getOfferQuote("missing")).rejects.toThrow(
      new BadRequestException("BOOKING_NOT_FOUND"),
    );
  });

  it("quote endpoint does not require booking completed or assigned", async () => {
    const { controller, prisma } = createService({
      bookingResult: booking({
        status: "pending_payment",
        publicDepositStatus: "deposit_required",
        scheduledStart: null,
      }),
    });

    const quotes = await controller.getOfferQuote("bk_quote");

    expect(prisma.booking.findUnique).toHaveBeenCalledWith({
      where: { id: "bk_quote" },
      include: { estimateSnapshot: true },
    });
    expect(quotes[0]).toEqual(
      expect.objectContaining({
        cadence: "weekly",
        firstCleanPriceCents: 20000,
        estimatedMinutes: 108,
      }),
    );
  });
});
