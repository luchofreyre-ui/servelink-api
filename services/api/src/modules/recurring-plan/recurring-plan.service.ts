import { Injectable, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type RecurringCadenceValue =
  | 'weekly'
  | 'every_10_days'
  | 'biweekly'
  | 'monthly';
export type RecurringCadenceV2 = RecurringCadenceValue;
type RecurringVisitStructure = 'one_visit' | 'three_visit_reset';

type JsonRecord = Record<string, unknown>;

export type RecurringQuoteOption = {
  cadence: RecurringCadenceV2;
  cadenceDays: number;
  firstCleanPriceCents: number;
  recurringPriceCents: number;
  savingsCents: number;
  discountPercent: number;
  estimatedMinutes: number;
};

@Injectable()
export class RecurringPlanService {
  constructor(private prisma: PrismaService) {}

  private cadenceDaysMap = {
    weekly: 7,
    every_10_days: 10,
    biweekly: 14,
    monthly: 30,
  } as const;

  private cadenceMultiplierMap = {
    weekly: 0.6,
    every_10_days: 0.66,
    biweekly: 0.7,
    monthly: 0.8,
  } as const;

  private readonly supportedCadences = [
    'weekly',
    'every_10_days',
    'biweekly',
    'monthly',
  ] as const;

  async listForAdmin(params?: {
    status?: 'active' | 'paused' | 'cancelled';
    cadence?: RecurringCadenceV2;
  }) {
    return this.prisma.recurringPlan.findMany({
      where: {
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.cadence ? { cadence: params.cadence as any } : {}),
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
    cadence?: RecurringCadenceV2;
  }) {
    return this.prisma.recurringPlanOutcome.upsert({
      where: { bookingId: params.bookingId },
      update: {
        converted: params.converted,
        cadence: (params.cadence ?? null) as any,
        recordedAt: new Date(),
      },
      create: {
        bookingId: params.bookingId,
        converted: params.converted,
        cadence: (params.cadence ?? null) as any,
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
    cadence: RecurringCadenceV2;
  }) {
    if (!this.isSupportedCadence(params.cadence)) {
      throw new BadRequestException('RECURRING_CADENCE_NOT_SUPPORTED');
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

    if (!this.isEligibleForRecurringPlan(booking)) {
      throw new BadRequestException('BOOKING_NOT_RECURRING_ELIGIBLE');
    }

    const existing = await this.prisma.recurringPlan.findFirst({
      where: { bookingId: params.bookingId },
    });

    if (existing) {
      return existing;
    }

    const estimateSnapshot = this.getEstimateSnapshotJson(booking.estimateSnapshot);
    const outputJson = estimateSnapshot.outputJson;
    const estimatedMinutes = this.getEstimatedMinutes(outputJson);
    const firstCleanPriceCents = this.getFirstCleanPriceCentsFromBooking(booking);
    const quote = this.getRecurringOfferQuote({
      firstCleanPriceCents,
      estimatedMinutes,
      estimateSnapshot,
      cadence: params.cadence,
    })[0];
    const visitStructure =
      this.getSelectedVisitStructureFromEstimateSnapshot(estimateSnapshot);
    const now = new Date();
    const nextRunAt = this.getNextRunAt({
      scheduledStart: booking.scheduledStart ?? now,
      cadence: params.cadence,
      visitStructure,
    });

    const plan = await this.prisma.recurringPlan.create({
      data: {
        bookingId: booking.id,
        customerId: booking.customerId,
        franchiseOwnerId: booking.foId ?? null,
        cadence: params.cadence as any,
        status: 'active',
        pricePerVisitCents: quote.recurringPriceCents,
        estimatedMinutes: quote.estimatedMinutes,
        discountPercent: quote.discountPercent,
        startAt: now,
        nextRunAt,
        nextAnchorAt: nextRunAt,
        createdFromBookingId: booking.id,
        tenantId: booking.tenantId ?? 'nustandard',
        estimateSnapshot: estimateSnapshot as unknown as Prisma.InputJsonValue,
        pricingSnapshot: {
          firstCleanPriceCents,
          recurringPriceCents: quote.recurringPriceCents,
          savingsCents: quote.savingsCents,
          discountPercent: quote.discountPercent,
          cadenceDays: quote.cadenceDays,
          cadenceMultiplier: this.cadenceMultiplierMap[params.cadence],
          visitStructure,
        },
      },
    });

    await this.recordOutcome({
      bookingId: booking.id,
      converted: true,
      cadence: params.cadence,
    });

    return plan;
  }

  getRecurringOfferQuote(params: {
    firstCleanPriceCents: number;
    estimatedMinutes: number;
    estimateSnapshot?: unknown;
    cadence?: RecurringCadenceV2;
  }): RecurringQuoteOption[] {
    const cadences = params.cadence
      ? [params.cadence]
      : [...this.supportedCadences];
    const firstCleanPriceCents = Math.max(
      0,
      Math.round(params.firstCleanPriceCents),
    );
    const estimatedMinutes = Math.max(1, Math.round(params.estimatedMinutes));

    return cadences.map((cadence) => {
      const recurringMinutes = this.getRecurringMinutes({
        estimatedMinutes,
        cadence,
        estimateSnapshot: params.estimateSnapshot,
      });
      const recurringPriceCents = Math.round(
        (recurringMinutes / estimatedMinutes) * firstCleanPriceCents,
      );
      const savingsCents = Math.max(
        0,
        firstCleanPriceCents - recurringPriceCents,
      );
      const discountPercent =
        firstCleanPriceCents > 0
          ? Math.round((savingsCents / firstCleanPriceCents) * 100)
          : 0;

      return {
        cadence,
        cadenceDays: this.cadenceDaysMap[cadence],
        firstCleanPriceCents,
        recurringPriceCents,
        savingsCents,
        discountPercent,
        estimatedMinutes: recurringMinutes,
      };
    });
  }

  getRecurringQuoteOptionsFromEstimate(params: {
    firstCleanPriceCents: number;
    firstCleanEstimatedMinutes: number;
    estimateSnapshotLikeInput?: unknown;
    cadence?: RecurringCadenceV2;
  }): RecurringQuoteOption[] {
    return this.getRecurringOfferQuote({
      firstCleanPriceCents: params.firstCleanPriceCents,
      estimatedMinutes: params.firstCleanEstimatedMinutes,
      estimateSnapshot: params.estimateSnapshotLikeInput,
      cadence: params.cadence,
    });
  }

  async getOfferQuoteForBooking(
    bookingId: string,
    cadence?: RecurringCadenceV2 | 'not_sure' | null,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { estimateSnapshot: true },
    });
    if (!booking) {
      throw new BadRequestException('BOOKING_NOT_FOUND');
    }

    const estimateSnapshot = this.getEstimateSnapshotJson(booking.estimateSnapshot);
    const cadenceFilter = this.isSupportedCadence(cadence)
      ? cadence
      : undefined;
    return this.getRecurringOfferQuote({
      firstCleanPriceCents: this.getFirstCleanPriceCentsFromBooking(booking),
      estimatedMinutes: this.getEstimatedMinutes(estimateSnapshot.outputJson),
      estimateSnapshot,
      cadence: cadenceFilter,
    });
  }

  async autoCreateFromBookingAfterDeposit(params: { bookingId: string }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: { estimateSnapshot: true, customer: true },
    });
    if (!booking) {
      return { result: 'skipped' as const, reason: 'BOOKING_NOT_FOUND' };
    }

    const estimateSnapshot = this.getEstimateSnapshotJson(booking.estimateSnapshot);
    const cadence = this.getSelectedCadenceFromEstimateSnapshot(estimateSnapshot);
    const visitStructure =
      this.getSelectedVisitStructureFromEstimateSnapshot(estimateSnapshot);

    if (!cadence) {
      return { result: 'skipped' as const, reason: 'NO_RECURRING_CADENCE' };
    }

    const existing = await this.prisma.recurringPlan.findFirst({
      where: { bookingId: params.bookingId },
    });
    if (existing) {
      return {
        result: 'already_exists' as const,
        cadence,
        visitStructure,
        plan: existing,
      };
    }

    try {
      const plan = await this.createFromBooking({
        bookingId: params.bookingId,
        cadence,
      });
      return { result: 'created' as const, cadence, visitStructure, plan };
    } catch (error) {
      return {
        result: 'failed' as const,
        cadence,
        visitStructure,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private isSupportedCadence(
    cadence: string | null | undefined,
  ): cadence is RecurringCadenceV2 {
    return (
      cadence === 'weekly' ||
      cadence === 'every_10_days' ||
      cadence === 'biweekly' ||
      cadence === 'monthly'
    );
  }

  private isEligibleForRecurringPlan(booking: {
    status: string;
    publicDepositStatus?: string | null;
    scheduledStart?: Date | null;
  }): boolean {
    const isCompleted = booking.status === 'completed';
    const isConfirmedPublicBooking =
      booking.status === 'assigned' &&
      booking.publicDepositStatus === 'deposit_succeeded' &&
      Boolean(booking.scheduledStart);
    return isCompleted || isConfirmedPublicBooking;
  }

  private getFirstCleanPriceCentsFromBooking(booking: {
    estimatedTotalCentsSnapshot?: number | null;
    quotedTotal?: unknown;
    priceTotal?: number | null;
    estimateSnapshot?: { outputJson?: string | null } | null;
  }): number {
    if (
      typeof booking.estimatedTotalCentsSnapshot === 'number' &&
      Number.isFinite(booking.estimatedTotalCentsSnapshot)
    ) {
      return Math.max(0, Math.round(booking.estimatedTotalCentsSnapshot));
    }

    const quotedTotal = Number(booking.quotedTotal);
    if (Number.isFinite(quotedTotal)) {
      return Math.max(0, Math.round(quotedTotal * 100));
    }

    if (typeof booking.priceTotal === 'number' && Number.isFinite(booking.priceTotal)) {
      return Math.max(0, Math.round(booking.priceTotal * 100));
    }

    const outputJson = this.parseJsonRecord(booking.estimateSnapshot?.outputJson);
    const estimatedPriceCents = outputJson.estimatedPriceCents;
    if (
      typeof estimatedPriceCents === 'number' &&
      Number.isFinite(estimatedPriceCents)
    ) {
      return Math.max(0, Math.round(estimatedPriceCents));
    }

    return 0;
  }

  private getEstimatedMinutes(outputJson: JsonRecord): number {
    const value = outputJson.estimatedDurationMinutes;
    return typeof value === 'number' && Number.isFinite(value) && value > 0
      ? Math.round(value)
      : 120;
  }

  private getMaintenanceLoadMultiplier(estimateSnapshot: unknown): number {
    const root = this.normalizeEstimateSnapshot(estimateSnapshot);
    const factors = { ...root.inputJson, ...root.outputJson };
    let score = 1;

    const kitchenIntensity =
      factors.kitchenIntensity ??
      factors.kitchen_intensity ??
      factors.kitchenUsage ??
      factors.kitchen_usage;
    if (kitchenIntensity === 'heavy_use') score += 0.1;
    if (kitchenIntensity === 'moderate_use') score += 0.05;

    const clutterAccess =
      factors.clutterAccess ??
      factors.clutter_access ??
      factors.clutterLevel ??
      factors.clutter_level;
    if (clutterAccess === 'heavy_clutter') score += 0.08;
    if (clutterAccess === 'moderate_clutter') score += 0.04;

    const petImpact = factors.petImpact ?? factors.pet_impact;
    const hasPets =
      factors.hasPets === true ||
      factors.pets === true ||
      petImpact === 'light' ||
      petImpact === 'moderate' ||
      petImpact === 'heavy';
    if (hasPets) score += 0.1;
    if (petImpact === 'moderate') score += 0.05;
    if (petImpact === 'heavy') score += 0.1;

    const occupants =
      factors.occupants ??
      factors.occupantCount ??
      factors.occupant_count ??
      factors.peopleCount ??
      factors.people_count;
    if (typeof occupants === 'number') {
      if (occupants >= 5) score += 0.1;
      else if (occupants >= 3) score += 0.05;
    }
    const occupancyLevel = factors.occupancyLevel ?? factors.occupancy_level;
    if (occupancyLevel === 'ppl_5_plus') score += 0.1;
    if (occupancyLevel === 'ppl_3_4') score += 0.05;

    return Math.min(score, 1.25);
  }

  private getRecurringMinutes(params: {
    estimatedMinutes: number;
    cadence: RecurringCadenceV2;
    estimateSnapshot?: unknown;
  }): number {
    const cadenceMultiplier = this.cadenceMultiplierMap[params.cadence];
    const loadMultiplier = this.getMaintenanceLoadMultiplier(
      params.estimateSnapshot,
    );
    return Math.max(
      1,
      Math.round(params.estimatedMinutes * cadenceMultiplier * loadMultiplier),
    );
  }

  private getSelectedCadenceFromEstimateSnapshot(
    estimateSnapshot: unknown,
  ): RecurringCadenceV2 | null {
    const root = this.normalizeEstimateSnapshot(estimateSnapshot);
    const cadence =
      root.inputJson.recurring_cadence_intent ??
      root.inputJson.recurringCadenceIntent ??
      root.inputJson.recurringCadence ??
      root.outputJson.recurring_cadence_intent;
    if (typeof cadence === 'string' && this.isSupportedCadence(cadence)) {
      return cadence;
    }
    return null;
  }

  private getSelectedVisitStructureFromEstimateSnapshot(
    estimateSnapshot: unknown,
  ): RecurringVisitStructure {
    const root = this.normalizeEstimateSnapshot(estimateSnapshot);
    const value =
      root.inputJson.first_time_visit_program ??
      root.inputJson.firstTimeVisitProgram ??
      root.outputJson.first_time_visit_program;
    return value === 'three_visit_reset' || value === 'three_visit'
      ? 'three_visit_reset'
      : 'one_visit';
  }

  private getNextRunAt(params: {
    scheduledStart: Date;
    cadence: RecurringCadenceV2;
    visitStructure?: RecurringVisitStructure;
  }): Date {
    const resetOffsetDays =
      params.visitStructure === 'three_visit_reset' ? 28 : 0;
    return this.addDays(
      params.scheduledStart,
      resetOffsetDays + this.cadenceDaysMap[params.cadence],
    );
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private getEstimateSnapshotJson(
    estimateSnapshot?: { inputJson?: string | null; outputJson?: string | null } | null,
  ): { inputJson: JsonRecord; outputJson: JsonRecord } {
    return {
      inputJson: this.parseJsonRecord(estimateSnapshot?.inputJson),
      outputJson: this.parseJsonRecord(estimateSnapshot?.outputJson),
    };
  }

  private normalizeEstimateSnapshot(estimateSnapshot: unknown): {
    inputJson: JsonRecord;
    outputJson: JsonRecord;
  } {
    if (
      estimateSnapshot &&
      typeof estimateSnapshot === 'object' &&
      ('inputJson' in estimateSnapshot || 'outputJson' in estimateSnapshot)
    ) {
      const snapshot = estimateSnapshot as {
        inputJson?: unknown;
        outputJson?: unknown;
      };
      return {
        inputJson: this.parseJsonRecord(snapshot.inputJson),
        outputJson: this.parseJsonRecord(snapshot.outputJson),
      };
    }

    return {
      inputJson: {},
      outputJson: this.parseJsonRecord(estimateSnapshot),
    };
  }

  private parseJsonRecord(value: unknown): JsonRecord {
    if (!value) return {};
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as JsonRecord;
    }
    if (typeof value !== 'string') return {};
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as JsonRecord)
        : {};
    } catch {
      return {};
    }
  }
}
