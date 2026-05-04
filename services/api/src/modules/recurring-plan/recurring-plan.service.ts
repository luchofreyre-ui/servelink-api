import { Injectable, BadRequestException, Logger } from '@nestjs/common';
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

function parseEstimateInputJson(inputJson: unknown) {
  return parseEstimateOutputJson(inputJson);
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

export type RecurringCadenceValue =
  | 'weekly'
  | 'every_10_days'
  | 'biweekly'
  | 'monthly';

export type RecurringVisitStructure = 'one_visit' | 'three_visit_reset';

@Injectable()
export class RecurringPlanService {
  private readonly logger = new Logger(RecurringPlanService.name);

  constructor(private prisma: PrismaService) {}

  private readonly cadenceDayMap: Record<RecurringCadenceValue, number> = {
    weekly: 7,
    every_10_days: 10,
    biweekly: 14,
    monthly: 30,
  };

  private readonly cadenceMultiplierMap: Record<RecurringCadenceValue, number> = {
    weekly: 0.6,
    every_10_days: 0.66,
    biweekly: 0.7,
    monthly: 0.8,
  };

  normalizeCadence(value: unknown): RecurringCadenceValue | null {
    if (value === 'weekly') return 'weekly';
    if (value === 'every_10_days') return 'every_10_days';
    if (value === 'biweekly') return 'biweekly';
    if (value === 'monthly') return 'monthly';
    return null;
  }

  private getSelectedCadenceFromEstimateSnapshot(
    estimateSnapshot: unknown,
  ): RecurringCadenceValue | null {
    const inputJson =
      estimateSnapshot &&
      typeof estimateSnapshot === 'object' &&
      'inputJson' in estimateSnapshot
        ? (estimateSnapshot as { inputJson?: unknown }).inputJson
        : null;
    const input = parseEstimateInputJson(inputJson) as
      | Record<string, unknown>
      | null;
    return this.normalizeCadence(input?.recurring_cadence_intent);
  }

  private getSelectedVisitStructureFromEstimateSnapshot(
    estimateSnapshot: unknown,
  ): RecurringVisitStructure {
    const inputJson =
      estimateSnapshot &&
      typeof estimateSnapshot === 'object' &&
      'inputJson' in estimateSnapshot
        ? (estimateSnapshot as { inputJson?: unknown }).inputJson
        : null;
    const input = parseEstimateInputJson(inputJson) as
      | Record<string, unknown>
      | null;
    return input?.first_time_visit_program === 'three_visit'
      ? 'three_visit_reset'
      : 'one_visit';
  }

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
    cadence?: RecurringCadenceValue;
  }) {
    const cadences = params.cadence
      ? ([params.cadence] as const)
      : (['weekly', 'every_10_days', 'biweekly', 'monthly'] as const);

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
        cadenceDays: this.cadenceDayMap[cadence],
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
    cadence: RecurringCadenceValue;
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

  async getOfferQuoteForBooking(
    bookingId: string,
    cadence?: RecurringCadenceValue,
  ) {
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
    cadence?: RecurringCadenceValue;
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
    cadence?: RecurringCadenceValue;
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
    cadence: RecurringCadenceValue;
  }) {
    const cadence = this.normalizeCadence(params.cadence);
    if (!cadence) {
      throw new BadRequestException('RECURRING_CADENCE_INVALID');
    }

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
      cadence,
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

    const nextRunAt = booking.scheduledStart
      ? this.getNextRunAt({
          scheduledStart: new Date(booking.scheduledStart),
          cadence,
          visitStructure: this.getSelectedVisitStructureFromEstimateSnapshot(
            booking.estimateSnapshot,
          ),
        })
      : new Date(now.getTime() + this.cadenceDayMap[cadence] * 24 * 60 * 60 * 1000);

    const plan = await this.prisma.recurringPlan.create({
      data: {
        bookingId: booking.id,
        customerId: booking.customerId,
        franchiseOwnerId: null,
        cadence,
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
      cadence,
    });

    return plan;
  }

  private getNextRunAt(params: {
    scheduledStart: Date;
    cadence: RecurringCadenceValue;
    visitStructure?: RecurringVisitStructure;
  }) {
    return this.addDays(
      params.scheduledStart,
      (params.visitStructure === 'three_visit_reset' ? 28 : 0) +
        this.cadenceDayMap[params.cadence],
    );
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  async autoCreateFromBookingAfterDeposit(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { estimateSnapshot: true },
    });

    if (!booking) {
      this.logAutoCreate({
        bookingId,
        cadence: null,
        result: 'skipped',
        reason: 'booking_not_found',
      });
      return { result: 'skipped' as const };
    }

    const cadence = this.getSelectedCadenceFromEstimateSnapshot(
      booking.estimateSnapshot,
    );
    const visitStructure = this.getSelectedVisitStructureFromEstimateSnapshot(
      booking.estimateSnapshot,
    );
    if (!cadence) {
      this.logAutoCreate({
        bookingId,
        cadence: null,
        visitStructure,
        result: 'skipped',
        reason: 'cadence_missing',
      });
      return { result: 'skipped' as const };
    }

    try {
      const plan = await this.createFromBooking({ bookingId, cadence });
      this.logAutoCreate({ bookingId, cadence, visitStructure, result: 'created' });
      return { result: 'created' as const, plan };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error ?? 'unknown');
      if (message.includes('RECURRING_PLAN_ALREADY_EXISTS')) {
        this.logAutoCreate({
          bookingId,
          cadence,
          visitStructure,
          result: 'already_exists',
        });
        return { result: 'already_exists' as const };
      }
      if (message.includes('BOOKING_NOT_RECURRING_ELIGIBLE')) {
        this.logAutoCreate({
          bookingId,
          cadence,
          visitStructure,
          result: 'skipped',
          reason: 'booking_not_eligible',
        });
        return { result: 'skipped' as const };
      }

      this.logAutoCreate({
        bookingId,
        cadence,
        visitStructure,
        result: 'failed',
        reason: message,
      });
      return { result: 'failed' as const };
    }
  }

  private logAutoCreate(args: {
    bookingId: string;
    cadence: RecurringCadenceValue | null;
    visitStructure?: RecurringVisitStructure;
    result: 'created' | 'already_exists' | 'skipped' | 'failed';
    reason?: string;
  }) {
    this.logger.log(
      JSON.stringify({
        event: 'recurring_plan_auto_create_after_deposit',
        bookingId: args.bookingId,
        cadence: args.cadence,
        visitStructure: args.visitStructure ?? 'one_visit',
        result: args.result,
        ...(args.reason ? { reason: args.reason } : {}),
      }),
    );
  }
}
