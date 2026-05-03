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

  it("uses weekly discount of 15", () => {
    const { service } = createService();

    const [weekly] = service.getRecurringOfferQuote({
      firstCleanPriceCents: 20000,
      estimatedMinutes: 180,
    });

    expect(weekly).toEqual(
      expect.objectContaining({
        discountPercent: 15,
        recurringPriceCents: 17000,
        savingsCents: 3000,
      }),
    );
  });

  it("uses biweekly discount of 10", () => {
    const { service } = createService();

    const [, biweekly] = service.getRecurringOfferQuote({
      firstCleanPriceCents: 20000,
      estimatedMinutes: 180,
    });

    expect(biweekly).toEqual(
      expect.objectContaining({
        discountPercent: 10,
        recurringPriceCents: 18000,
        savingsCents: 2000,
      }),
    );
  });

  it("uses monthly discount of 5", () => {
    const { service } = createService();

    const [, , monthly] = service.getRecurringOfferQuote({
      firstCleanPriceCents: 20000,
      estimatedMinutes: 180,
    });

    expect(monthly).toEqual(
      expect.objectContaining({
        discountPercent: 5,
        recurringPriceCents: 19000,
        savingsCents: 1000,
      }),
    );
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
        estimatedMinutes: 180,
      }),
    );
  });
});
