import { Injectable, Logger } from "@nestjs/common";
import {
  EstimateVarianceReasonCode,
  type Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import type { EstimateFactorsDto } from "../booking-direction-intake/dto/estimate-factors.dto";
import type { EstimateInput, EstimateResult } from "../estimate/estimator.service";

type SnapshotRow = {
  laborVariancePct: number | null;
  varianceReasonCodes: EstimateVarianceReasonCode[];
  estimateInputSnapshot: Prisma.JsonValue;
};

@Injectable()
export class EstimateAccuracyService {
  private readonly logger = new Logger(EstimateAccuracyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotent: one audit row per booking.
   */
  async recordAuditAfterJobCompletion(bookingId: string): Promise<void> {
    const dup = await this.prisma.estimateAccuracyAudit.findUnique({
      where: { bookingId },
      select: { id: true },
    });
    if (dup) return;

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        foId: true,
        estimatedHours: true,
        priceTotal: true,
        quotedTotal: true,
        startedAt: true,
        completedAt: true,
        estimateSnapshot: {
          select: { inputJson: true, outputJson: true },
        },
        directionIntake: {
          select: {
            id: true,
            homeSize: true,
            bedrooms: true,
            bathrooms: true,
            serviceId: true,
            frequency: true,
            deepCleanProgram: true,
            estimateFactors: true,
            pets: true,
          },
        },
      },
    });

    if (!booking?.estimateSnapshot) return;

    let estimateInput: EstimateInput;
    let estimateOutput: EstimateResult;
    try {
      estimateInput = JSON.parse(
        booking.estimateSnapshot.inputJson,
      ) as EstimateInput;
      estimateOutput = JSON.parse(
        booking.estimateSnapshot.outputJson,
      ) as EstimateResult;
    } catch {
      this.logger.warn(
        `estimate snapshot JSON parse failed bookingId=${bookingId}`,
      );
      return;
    }

    const predictedLaborMinutes = estimateOutput.adjustedLaborMinutes;
    const predictedPriceCents = estimateOutput.estimatedPriceCents;

    const visits = await this.prisma.bookingDeepCleanVisitExecution.findMany({
      where: { bookingId },
      select: { actualDurationMinutes: true, visitNumber: true },
    });
    const sumVisitMinutes = visits.reduce(
      (s, v) =>
        s +
        (typeof v.actualDurationMinutes === "number"
          ? v.actualDurationMinutes
          : 0),
      0,
    );

    let actualLaborMinutes = sumVisitMinutes;
    if (actualLaborMinutes <= 0 && booking.startedAt && booking.completedAt) {
      const wall =
        (booking.completedAt.getTime() - booking.startedAt.getTime()) / 60000;
      const crew = Math.max(1, estimateOutput.effectiveTeamSize || 1);
      actualLaborMinutes = Math.max(0, Math.round(wall * crew));
    }
    if (actualLaborMinutes <= 0) {
      actualLaborMinutes = Math.round((booking.estimatedHours ?? 0) * 60);
    }

    const quoted =
      booking.quotedTotal != null
        ? Number(booking.quotedTotal)
        : booking.priceTotal ?? 0;
    const actualPriceCents = Math.round(Math.max(0, quoted) * 100);

    const laborVariancePct =
      predictedLaborMinutes > 0
        ? ((actualLaborMinutes - predictedLaborMinutes) /
            predictedLaborMinutes) *
          100
        : null;

    const pricingVariancePct =
      predictedPriceCents > 0
        ? ((actualPriceCents - predictedPriceCents) / predictedPriceCents) *
          100
        : null;

    const effortVariancePct = laborVariancePct;

    const factors = booking.directionIntake?.estimateFactors as
      | EstimateFactorsDto
      | null
      | undefined;

    const varianceReasonCodes = inferVarianceReasonCodes({
      estimateInput,
      laborVariancePct: laborVariancePct ?? 0,
    });

    const estimateInputSnapshot = {
      directionIntake: booking.directionIntake,
      estimateFactorsResolved: factors ?? null,
      estimateInput,
    };

    const estimateOutputSnapshot = {
      predictedLaborMinutes,
      predictedPriceCents,
      predictedDifficultyScore: estimateOutput.jobComplexityIndex,
      predictedTeamAssumptions: {
        recommendedTeamSize: estimateOutput.recommendedTeamSize,
        effectiveTeamSize: estimateOutput.effectiveTeamSize,
      },
      estimateResult: estimateOutput,
    };

    const actualJobOutcome = {
      actualLaborMinutes,
      actualCrewAssumed: estimateOutput.effectiveTeamSize,
      actualDurationWallMinutes:
        booking.startedAt && booking.completedAt
          ? Math.round(
              (booking.completedAt.getTime() - booking.startedAt.getTime()) /
                60000,
            )
          : null,
      deepCleanVisitActuals: visits,
      actualPriceCents,
    };

    await this.prisma.estimateAccuracyAudit.create({
      data: {
        bookingId,
        estimateInputSnapshot: estimateInputSnapshot as Prisma.InputJsonValue,
        estimateOutputSnapshot:
          estimateOutputSnapshot as Prisma.InputJsonValue,
        actualJobOutcome: actualJobOutcome as Prisma.InputJsonValue,
        laborVariancePct: laborVariancePct ?? undefined,
        pricingVariancePct: pricingVariancePct ?? undefined,
        effortVariancePct: effortVariancePct ?? undefined,
        varianceReasonCodes,
      },
    });
  }

  async getAggregateMetrics(opts?: { foId?: string }) {
    const where: Prisma.EstimateAccuracyAuditWhereInput = {
      laborVariancePct: { not: null },
      ...(opts?.foId ? { booking: { is: { foId: opts.foId } } } : {}),
    };

    const rows: SnapshotRow[] = await this.prisma.estimateAccuracyAudit.findMany(
      {
        where,
        select: {
          laborVariancePct: true,
          varianceReasonCodes: true,
          estimateInputSnapshot: true,
        },
      },
    );

    const n = rows.length;
    const within = (pct: number) =>
      n === 0
        ? 0
        : (rows.filter(
            (r) =>
              r.laborVariancePct != null &&
              Math.abs(r.laborVariancePct) <= pct,
          ).length /
            n) *
          100;

    const reasonCounts = new Map<string, number>();
    for (const r of rows) {
      for (const c of r.varianceReasonCodes) {
        reasonCounts.set(c, (reasonCounts.get(c) ?? 0) + 1);
      }
    }
    const topMissReasons = [...reasonCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([code, count]) => ({ code, count }));

    return {
      sampleSize: n,
      pctWithin10Labor: within(10),
      pctWithin15Labor: within(15),
      pctWithin20Labor: within(20),
      avgLaborVariancePct:
        n === 0
          ? null
          : rows.reduce((s, r) => s + (r.laborVariancePct ?? 0), 0) / n,
      missRateBeyond15Pct:
        n === 0
          ? 0
          : (rows.filter((r) => Math.abs(r.laborVariancePct ?? 0) > 15).length /
              n) *
            100,
      topMissReasons,
      worstCorrelatedIntakeSignals: correlateOverallCondition(rows),
    };
  }

  async listAudits(take = 50) {
    return this.prisma.estimateAccuracyAudit.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(take, 1), 200),
      include: {
        booking: { select: { id: true, foId: true, status: true } },
      },
    });
  }
}

function correlateOverallCondition(rows: SnapshotRow[]) {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const snap = r.estimateInputSnapshot as {
      estimateInput?: { overall_labor_condition?: string };
    };
    const key = snap?.estimateInput?.overall_labor_condition ?? "unknown";
    const b = buckets.get(key) ?? { sum: 0, count: 0 };
    b.sum += Math.abs(r.laborVariancePct ?? 0);
    b.count += 1;
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .map(([signal, { sum, count }]) => ({
      signal,
      avgAbsLaborVariancePct: count ? sum / count : 0,
      sampleCount: count,
    }))
    .sort((a, b) => b.avgAbsLaborVariancePct - a.avgAbsLaborVariancePct)
    .slice(0, 8);
}

function inferVarianceReasonCodes(args: {
  estimateInput: EstimateInput;
  laborVariancePct: number;
}): EstimateVarianceReasonCode[] {
  const out = new Set<EstimateVarianceReasonCode>();
  const v = args.laborVariancePct;
  const input = args.estimateInput;

  if (Math.abs(v) < 8) {
    out.add(EstimateVarianceReasonCode.other);
    return [...out];
  }

  if (v > 12) {
    out.add(EstimateVarianceReasonCode.estimator_model_miss);
    if (input.clutter_level === "light" || input.clutter_level === "minimal") {
      out.add(EstimateVarianceReasonCode.clutter_understated);
    }
    if (
      input.kitchen_condition === "light" ||
      input.kitchen_condition === "normal"
    ) {
      out.add(EstimateVarianceReasonCode.kitchen_underestimated);
    }
    if (
      input.bathroom_condition === "light" ||
      input.bathroom_condition === "normal"
    ) {
      out.add(EstimateVarianceReasonCode.bathroom_underestimated);
    }
    if (input.pet_presence !== "none") {
      out.add(EstimateVarianceReasonCode.pet_impact_underestimated);
    }
    if (
      input.overall_labor_condition === "normal_lived_in" ||
      input.overall_labor_condition === "recently_maintained"
    ) {
      out.add(EstimateVarianceReasonCode.home_dirtier_than_intake);
    }
  } else if (v < -12) {
    out.add(EstimateVarianceReasonCode.intake_missing_signal);
  }

  if (out.size === 0) out.add(EstimateVarianceReasonCode.other);
  return [...out];
}
