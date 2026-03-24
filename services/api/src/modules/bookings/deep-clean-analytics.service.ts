import { Injectable } from "@nestjs/common";
import {
  DeepCleanCalibrationReviewStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import {
  mapProgramCalibrationToAnalyticsBookingRowDto,
  type ProgramCalibrationAnalyticsSource,
} from "./deep-clean-analytics-row.map";
import type {
  DeepCleanAnalyticsQueryDto,
  DeepCleanAnalyticsResponseDto,
  DeepCleanAnalyticsSummaryDto,
  DeepCleanAnalyticsSortBy,
} from "./dto/deep-clean-analytics.dto";

function decToNumber(v: Prisma.Decimal | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

function persistedProgramTypeFilter(
  programType: "single_visit" | "three_visit" | undefined,
): string | undefined {
  if (!programType) return undefined;
  if (programType === "single_visit") return "single_visit_deep_clean";
  return "phased_deep_clean_program";
}

/** Exported for E2E cross-checks against Prisma `count`. */
export function buildDeepCleanProgramCalibrationFilter(
  input: DeepCleanAnalyticsQueryDto,
): Prisma.BookingDeepCleanProgramCalibrationWhereInput {
  const persistedPt = persistedProgramTypeFilter(input.programType);
  return {
    ...(input.usableOnly === true
      ? { usableForCalibrationAnalysis: true }
      : {}),
    ...(input.withOperatorNotesOnly === true
      ? { hasAnyOperatorNotes: true }
      : {}),
    ...(input.fullyCompletedOnly === true ? { isFullyCompleted: true } : {}),
    ...(persistedPt ? { programType: persistedPt } : {}),
    ...(input.reviewStatus === "reviewed"
      ? { reviewStatus: DeepCleanCalibrationReviewStatus.reviewed }
      : {}),
    ...(input.reviewStatus === "unreviewed"
      ? { reviewStatus: DeepCleanCalibrationReviewStatus.unreviewed }
      : {}),
    ...(input.reasonTag
      ? {
          reviewReasonTagsJson: {
            path: [],
            array_contains: [input.reasonTag],
          },
        }
      : {}),
  };
}

@Injectable()
export class DeepCleanAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private computeSummary(
    rows: ProgramCalibrationAnalyticsSource[],
  ): DeepCleanAnalyticsSummaryDto {
    const n = rows.length;
    if (n === 0) {
      return {
        totalProgramCalibrations: 0,
        usableProgramCalibrations: 0,
        fullyCompletedPrograms: 0,
        programsWithOperatorNotes: 0,
        averageVarianceMinutes: null,
        averageVariancePercent: null,
        averageEstimatedTotalDurationMinutes: null,
        averageActualTotalDurationMinutes: null,
      };
    }

    const usableProgramCalibrations = rows.filter(
      (r) => r.usableForCalibrationAnalysis,
    ).length;
    const fullyCompletedPrograms = rows.filter((r) => r.isFullyCompleted).length;
    const programsWithOperatorNotes = rows.filter(
      (r) => r.hasAnyOperatorNotes,
    ).length;

    const varMinutes = rows
      .map((r) => r.durationVarianceMinutes)
      .filter((v): v is number => v != null && Number.isFinite(v));
    const averageVarianceMinutes =
      varMinutes.length > 0
        ? Math.round(
            (varMinutes.reduce((a, b) => a + b, 0) / varMinutes.length) * 100,
          ) / 100
        : null;

    const percentForAvg = rows
      .filter(
        (r) =>
          r.usableForCalibrationAnalysis &&
          r.durationVariancePercent != null,
      )
      .map((r) => decToNumber(r.durationVariancePercent))
      .filter((v): v is number => v != null && Number.isFinite(v));
    const averageVariancePercent =
      percentForAvg.length > 0
        ? Math.round(
            (percentForAvg.reduce((a, b) => a + b, 0) / percentForAvg.length) *
              100,
          ) / 100
        : null;

    const estTotals = rows.map((r) => r.estimatedTotalDurationMinutes);
    const averageEstimatedTotalDurationMinutes =
      estTotals.length > 0
        ? Math.round(
            (estTotals.reduce((a, b) => a + b, 0) / estTotals.length) * 100,
          ) / 100
        : null;

    const actuals = rows
      .map((r) => r.actualTotalDurationMinutes)
      .filter((v): v is number => v != null && Number.isFinite(v));
    const averageActualTotalDurationMinutes =
      actuals.length > 0
        ? Math.round(
            (actuals.reduce((a, b) => a + b, 0) / actuals.length) * 100,
          ) / 100
        : null;

    return {
      totalProgramCalibrations: n,
      usableProgramCalibrations,
      fullyCompletedPrograms,
      programsWithOperatorNotes,
      averageVarianceMinutes,
      averageVariancePercent,
      averageEstimatedTotalDurationMinutes,
      averageActualTotalDurationMinutes,
    };
  }

  private sortRows(
    rows: ProgramCalibrationAnalyticsSource[],
    sortBy: DeepCleanAnalyticsSortBy | undefined,
  ): ProgramCalibrationAnalyticsSource[] {
    const key = sortBy ?? "createdAt_desc";
    const copy = [...rows];
    const pctVal = (r: ProgramCalibrationAnalyticsSource) =>
      decToNumber(r.durationVariancePercent);
    /** Desc: larger first; nulls last */
    const minDesc = (a: number | null, b: number | null) => {
      const av = a != null && Number.isFinite(a) ? a : Number.NEGATIVE_INFINITY;
      const bv = b != null && Number.isFinite(b) ? b : Number.NEGATIVE_INFINITY;
      return bv - av;
    };
    /** Asc: smaller first; nulls last */
    const minAsc = (a: number | null, b: number | null) => {
      const av = a != null && Number.isFinite(a) ? a : Number.POSITIVE_INFINITY;
      const bv = b != null && Number.isFinite(b) ? b : Number.POSITIVE_INFINITY;
      return av - bv;
    };

    copy.sort((a, b) => {
      switch (key) {
        case "variance_minutes_desc":
          return minDesc(a.durationVarianceMinutes, b.durationVarianceMinutes);
        case "variance_minutes_asc":
          return minAsc(a.durationVarianceMinutes, b.durationVarianceMinutes);
        case "variance_percent_desc":
          return minDesc(pctVal(a), pctVal(b));
        case "variance_percent_asc":
          return minAsc(pctVal(a), pctVal(b));
        case "createdAt_desc":
        default:
          return b.booking.createdAt.getTime() - a.booking.createdAt.getTime();
      }
    });
    return copy;
  }

  async getDeepCleanAnalyticsRows(
    input: DeepCleanAnalyticsQueryDto,
  ): Promise<ProgramCalibrationAnalyticsSource[]> {
    const where = buildDeepCleanProgramCalibrationFilter(input);
    return this.prisma.bookingDeepCleanProgramCalibration.findMany({
      where,
      include: {
        booking: { select: { createdAt: true, updatedAt: true } },
      },
    }) as Promise<ProgramCalibrationAnalyticsSource[]>;
  }

  async getDeepCleanAnalyticsSummary(
    input: DeepCleanAnalyticsQueryDto,
  ): Promise<DeepCleanAnalyticsSummaryDto> {
    const rows = await this.getDeepCleanAnalyticsRows(input);
    return this.computeSummary(rows);
  }

  async getDeepCleanAnalytics(
    input: DeepCleanAnalyticsQueryDto,
  ): Promise<DeepCleanAnalyticsResponseDto> {
    const rows = await this.getDeepCleanAnalyticsRows(input);
    const summary = this.computeSummary(rows);
    const sorted = this.sortRows(rows, input.sortBy);
    const limit = input.limit ?? 100;
    const sliced = sorted.slice(0, limit);
    return {
      summary,
      rows: sliced.map((r) => mapProgramCalibrationToAnalyticsBookingRowDto(r)),
    };
  }
}
