import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function isEligibleForRecurringPlan(booking: {
  status: string;
  publicDepositStatus?: string | null;
  scheduledStart?: Date | string | null;
}) {
  const isCompleted = booking.status === 'completed';

  const isConfirmedPublicBooking =
    booking.status === 'assigned' &&
    booking.publicDepositStatus === 'deposit_succeeded' &&
    Boolean(booking.scheduledStart);

  return isCompleted || isConfirmedPublicBooking;
}

function readEstimatedMinutes(outputJson: unknown) {
  const parsedOutputJson = parseEstimateOutputJson(outputJson);

  if (parsedOutputJson) {
    const estimatedDurationMinutes = (
      parsedOutputJson as { estimatedDurationMinutes?: unknown }
    ).estimatedDurationMinutes;

    if (typeof estimatedDurationMinutes === 'number') {
      return estimatedDurationMinutes;
    }
  }

  return 120;
}

function parseEstimateOutputJson(outputJson: unknown) {
  if (typeof outputJson === 'string') {
    try {
      const parsed = JSON.parse(outputJson) as unknown;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  return outputJson && typeof outputJson === 'object' ? outputJson : null;
}

function readFactor(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

type RecurringCadence = 'weekly' | 'biweekly' | 'monthly';

@Injectable()
export class RecurringPlanService {
  constructor(private prisma: PrismaService) {}

  private cadenceDaysMap = {
    weekly: 7,
    biweekly: 14,
    monthly: 30,
  } as const;

  private cadenceMultiplierMap = {
    weekly: 0.6,
    biweekly: 0.7,
    monthly: 0.8,
  } as const;

  private getFirstCleanPriceCentsFromBooking(booking: {
    estimatedTotalCentsSnapshot?: number | null;
    quotedTotal?: unknown;
    priceTotal?: number | null;
  }) {
    if (typeof booking.estimatedTotalCentsSnapshot === 'number') {
      return booking.estimatedTotalCentsSnapshot;
    }

    const quotedTotal = Number(booking.quotedTotal);
    if (Number.isFinite(quotedTotal)) {
      return Math.round(quotedTotal * 100);
    }

    if (typeof booking.priceTotal === 'number') {
      return Math.round(booking.priceTotal * 100);
    }

    return 0;
  }

  getRecurringOfferQuote(params: {
    firstCleanPriceCents: number;
    estimatedMinutes: number;
    estimateSnapshot?: unknown;
    cadence?: RecurringCadence;
  }) {
    const cadences = params.cadence
      ? ([params.cadence] as const)
      : (['weekly', 'biweekly', 'monthly'] as const);

    return cadences.map((cadence) => {
      const recurringMinutes = this.getRecurringMinutes({
        estimatedMinutes: params.estimatedMinutes,
        cadence,
        estimateSnapshot: params.estimateSnapshot,
      });
      const recurringPriceCents = Math.round(
        params.estimatedMinutes > 0
          ? (recurringMinutes / params.estimatedMinutes) *
              params.firstCleanPriceCents
          : 0,
      );
      const savingsCents = Math.max(
        0,
        params.firstCleanPriceCents - recurringPriceCents,
      );
      const discountPercent =
        params.firstCleanPriceCents > 0
          ? Math.round((savingsCents / params.firstCleanPriceCents) * 100)
          : 0;

      return {
        cadence,
        firstCleanPriceCents: params.firstCleanPriceCents,
        recurringPriceCents,
        savingsCents,
        discountPercent,
        estimatedMinutes: recurringMinutes,
      };
    });
  }

  private getMaintenanceLoadMultiplier(estimateSnapshot: unknown) {
    const outputJson =
      estimateSnapshot &&
      typeof estimateSnapshot === 'object' &&
      'outputJson' in estimateSnapshot
        ? (estimateSnapshot as { outputJson?: unknown }).outputJson
        : estimateSnapshot;

    const factors = parseEstimateOutputJson(outputJson) as
      | Record<string, unknown>
      | null;

    if (!factors) return 1;

    const rawNormalizedIntake =
      factors.rawNormalizedIntake &&
      typeof factors.rawNormalizedIntake === 'object'
        ? (factors.rawNormalizedIntake as Record<string, unknown>)
        : {};

    let score = 1;

    const kitchenIntensity =
      readFactor(
        factors,
        'kitchenIntensity',
        'kitchen_intensity',
        'kitchenUsage',
        'kitchen_usage',
      ) ??
      readFactor(
        rawNormalizedIntake,
        'kitchenIntensity',
        'kitchen_intensity',
        'kitchenUsage',
        'kitchen_usage',
      );
    if (kitchenIntensity === 'heavy_use') score += 0.1;
    if (kitchenIntensity === 'moderate_use') score += 0.05;

    const clutterAccess =
      readFactor(
        factors,
        'clutterAccess',
        'clutter_access',
        'clutterLevel',
        'clutter_level',
      ) ??
      readFactor(
        rawNormalizedIntake,
        'clutterAccess',
        'clutter_access',
        'clutterLevel',
        'clutter_level',
      );
    if (clutterAccess === 'heavy_clutter') score += 0.08;
    if (clutterAccess === 'moderate_clutter') score += 0.04;

    const hasPets =
      readFactor(factors, 'hasPets') ??
      readFactor(factors, 'pets') ??
      readFactor(rawNormalizedIntake, 'hasPets', 'pets');
    const petImpact =
      readFactor(factors, 'petImpact', 'pet_impact') ??
      readFactor(rawNormalizedIntake, 'petImpact', 'pet_impact');
    const hasOngoingPetLoad =
      hasPets === true ||
      petImpact === 'light' ||
      petImpact === 'moderate' ||
      petImpact === 'heavy';

    if (hasOngoingPetLoad) score += 0.1;
    if (petImpact === 'moderate') score += 0.05;
    if (petImpact === 'heavy') score += 0.1;

    const occupants =
      readFactor(
        factors,
        'occupants',
        'occupantCount',
        'occupant_count',
        'peopleCount',
        'people_count',
      ) ??
      readFactor(
        rawNormalizedIntake,
        'occupants',
        'occupantCount',
        'occupant_count',
        'peopleCount',
        'people_count',
      );

    if (typeof occupants === 'number') {
      if (occupants >= 5) score += 0.1;
      else if (occupants >= 3) score += 0.05;
    }

    return Math.min(score, 1.25);
  }

  private getRecurringMinutes(params: {
    estimatedMinutes: number;
    cadence: RecurringCadence;
    estimateSnapshot: unknown;
  }) {
    const cadenceMultiplier = this.cadenceMultiplierMap[params.cadence] ?? 1;
    const loadMultiplier = this.getMaintenanceLoadMultiplier(
      params.estimateSnapshot,
    );

    return Math.round(
      params.estimatedMinutes * cadenceMultiplier * loadMultiplier,
    );
  }

  async getOfferQuoteForBooking(bookingId: string, cadence?: RecurringCadence) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { estimateSnapshot: true },
    });

    if (!booking) {
      throw new BadRequestException('BOOKING_NOT_FOUND');
    }

    const estimatedMinutes = readEstimatedMinutes(
      booking.estimateSnapshot?.outputJson,
    );

    return this.getRecurringOfferQuote({
      firstCleanPriceCents: this.getFirstCleanPriceCentsFromBooking(booking),
      estimatedMinutes,
      estimateSnapshot: booking.estimateSnapshot,
      cadence,
    });
  }

  async listForAdmin(params?: {
    status?: 'active' | 'paused' | 'cancelled';
    cadence?: 'weekly' | 'biweekly' | 'monthly';
  }) {
    return this.prisma.recurringPlan.findMany({
      where: {
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.cadence ? { cadence: params.cadence } : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
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
    });
  }

  async recordOutcome(params: {
    bookingId: string;
    converted: boolean;
    cadence?: 'weekly' | 'biweekly' | 'monthly';
  }) {
    return this.prisma.recurringPlanOutcome.upsert({
      where: { bookingId: params.bookingId },
      update: {
        converted: params.converted,
        cadence: params.cadence ?? null,
        recordedAt: new Date(),
      },
      create: {
        bookingId: params.bookingId,
        converted: params.converted,
        cadence: params.cadence ?? null,
      },
    });
  }

  async markNotConverted(bookingId: string) {
    return this.recordOutcome({
      bookingId,
      converted: false,
    });
  }

  async listOutcomesForAdmin(params?: { converted?: boolean }) {
    return this.prisma.recurringPlanOutcome.findMany({
      where: {
        ...(params?.converted !== undefined
          ? { converted: params.converted }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
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
    });
  }

  async createFromBooking(params: {
    bookingId: string;
    cadence: RecurringCadence;
  }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        estimateSnapshot: true,
        customer: true,
      },
    });

    if (!booking) {
      throw new BadRequestException('BOOKING_NOT_FOUND');
    }

    if (!isEligibleForRecurringPlan(booking)) {
      throw new BadRequestException('BOOKING_NOT_RECURRING_ELIGIBLE');
    }

    const existing = await this.prisma.recurringPlan.findFirst({
      where: { bookingId: params.bookingId },
    });

    if (existing) {
      throw new BadRequestException('RECURRING_PLAN_ALREADY_EXISTS');
    }

    const estimatedMinutes = readEstimatedMinutes(
      booking.estimateSnapshot?.outputJson,
    );

    const basePrice = this.getFirstCleanPriceCentsFromBooking(booking);

    const recurringMinutes = this.getRecurringMinutes({
      estimatedMinutes,
      cadence: params.cadence,
      estimateSnapshot: booking.estimateSnapshot,
    });

    const pricePerVisitCents = Math.round(
      estimatedMinutes > 0 ? (recurringMinutes / estimatedMinutes) * basePrice : 0,
    );
    const discountPercent =
      basePrice > 0
        ? Math.max(0, Math.round((1 - pricePerVisitCents / basePrice) * 100))
        : 0;

    const now = new Date();

    const nextRunAt = new Date(
      now.getTime() +
        this.cadenceDaysMap[params.cadence] * 24 * 60 * 60 * 1000,
    );

    const plan = await this.prisma.recurringPlan.create({
      data: {
        bookingId: booking.id,
        customerId: booking.customerId,
        franchiseOwnerId: null,
        cadence: params.cadence,
        status: 'active',
        pricePerVisitCents,
        estimatedMinutes: recurringMinutes,
        discountPercent,
        startAt: now,
        nextRunAt,
      },
    });

    await this.recordOutcome({
      bookingId: booking.id,
      converted: true,
      cadence: params.cadence,
    });

    return plan;
  }
}
