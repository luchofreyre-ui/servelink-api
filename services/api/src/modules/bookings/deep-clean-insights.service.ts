import { Injectable } from "@nestjs/common";
import { DeepCleanCalibrationReviewStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { classifyBookingFeedbackBucket } from "./deep-clean-feedback-buckets";
import { DEEP_CLEAN_INSIGHT_FEEDBACK_BUCKETS } from "./deep-clean-feedback-buckets";
import { DEEP_CLEAN_REVIEW_TAGS } from "./deep-clean-review-tags";
import { parseReviewReasonTagsFromJson } from "./deep-clean-review-tags";
import type {
  DeepCleanInsightsQueryDto,
  DeepCleanInsightsResponseDto,
  DeepCleanInsightsSummaryDto,
  DeepCleanProgramTypeInsightRowDto,
  DeepCleanReasonTagInsightRowDto,
} from "./dto/deep-clean-insights.dto";
import type { ProgramCalibrationAnalyticsSource } from "./deep-clean-analytics-row.map";

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

function parseInsightsDateStart(s: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number) as [number, number, number];
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  }
  return new Date(s);
}

function parseInsightsDateEnd(s: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number) as [number, number, number];
    return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  }
  return new Date(s);
}

function avg(nums: number[]): number | null {
  const v = nums.filter((x) => Number.isFinite(x));
  if (v.length === 0) return null;
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100;
}

const PROGRAM_TYPES_FOR_INSIGHTS = [
  "single_visit_deep_clean",
  "phased_deep_clean_program",
] as const;

@Injectable()
export class DeepCleanInsightsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildPrismaWhere(
    input: DeepCleanInsightsQueryDto,
    reviewedOnly: boolean,
  ): Prisma.BookingDeepCleanProgramCalibrationWhereInput {
    const persistedPt = persistedProgramTypeFilter(input.programType);
    return {
      ...(reviewedOnly ? { reviewStatus: DeepCleanCalibrationReviewStatus.reviewed } : {}),
      ...(persistedPt ? { programType: persistedPt } : {}),
      ...(input.reasonTag
        ? {
            reviewReasonTagsJson: {
              path: [],
              array_contains: [input.reasonTag],
            },
          }
        : {}),
      ...(input.bookingNotesStartsWith
        ? {
            booking: {
              is: {
                notes: { startsWith: input.bookingNotesStartsWith },
              },
            },
          }
        : {}),
      ...(input.reviewedAtFrom || input.reviewedAtTo
        ? {
            reviewedAt: {
              ...(input.reviewedAtFrom ? { gte: parseInsightsDateStart(input.reviewedAtFrom) } : {}),
              ...(input.reviewedAtTo ? { lte: parseInsightsDateEnd(input.reviewedAtTo) } : {}),
            },
          }
        : {}),
    };
  }

  private async loadRows(
    where: Prisma.BookingDeepCleanProgramCalibrationWhereInput,
  ): Promise<ProgramCalibrationAnalyticsSource[]> {
    return this.prisma.bookingDeepCleanProgramCalibration.findMany({
      where,
      include: {
        booking: { select: { createdAt: true, updatedAt: true } },
      },
    }) as Promise<ProgramCalibrationAnalyticsSource[]>;
  }

  private tagsForRow(r: ProgramCalibrationAnalyticsSource): string[] {
    return parseReviewReasonTagsFromJson(r.reviewReasonTagsJson);
  }

  async getDeepCleanInsights(
    input: DeepCleanInsightsQueryDto,
  ): Promise<DeepCleanInsightsResponseDto> {
    const reviewedOnly = input.reviewedOnly !== false;
    return this.computeInsights(input, reviewedOnly);
  }

  private async computeInsights(
    input: DeepCleanInsightsQueryDto,
    reviewedOnly: boolean,
  ): Promise<DeepCleanInsightsResponseDto> {
    const where = this.buildPrismaWhere(input, reviewedOnly);
    let rows = await this.loadRows(where);

    if (input.feedbackBucket) {
      rows = rows.filter((r) => {
        const tags = this.tagsForRow(r);
        return classifyBookingFeedbackBucket(tags) === input.feedbackBucket;
      });
    }

    const reviewedRows = rows.filter(
      (r) => r.reviewStatus === DeepCleanCalibrationReviewStatus.reviewed,
    );

    const summary = this.buildSummary(reviewedRows);
    const reasonTagRows = this.buildReasonTagRows(reviewedRows);
    const programTypeRows = this.buildProgramTypeRows(rows);
    const feedbackBuckets = this.buildFeedbackBuckets(reviewedRows);

    return {
      summary,
      reasonTagRows,
      programTypeRows,
      feedbackBuckets,
    };
  }

  buildSummary(reviewedRows: ProgramCalibrationAnalyticsSource[]): DeepCleanInsightsSummaryDto {
    const n = reviewedRows.length;
    if (n === 0) {
      return {
        totalReviewedPrograms: 0,
        reviewedEstimatorIssuePrograms: 0,
        reviewedOperationalIssuePrograms: 0,
        reviewedScopeIssuePrograms: 0,
        averageReviewedVarianceMinutes: null,
        averageReviewedVariancePercent: null,
      };
    }

    let est = 0;
    let ops = 0;
    let scope = 0;
    for (const r of reviewedRows) {
      const b = classifyBookingFeedbackBucket(this.tagsForRow(r));
      if (b === "estimator_issue") est += 1;
      else if (b === "operational_issue") ops += 1;
      else if (b === "scope_issue") scope += 1;
    }

    const varMins = reviewedRows
      .map((r) => r.durationVarianceMinutes)
      .filter((v): v is number => v != null && Number.isFinite(v));
    const varPcts = reviewedRows
      .map((r) => decToNumber(r.durationVariancePercent))
      .filter((v): v is number => v != null && Number.isFinite(v));

    return {
      totalReviewedPrograms: n,
      reviewedEstimatorIssuePrograms: est,
      reviewedOperationalIssuePrograms: ops,
      reviewedScopeIssuePrograms: scope,
      averageReviewedVarianceMinutes: avg(varMins),
      averageReviewedVariancePercent: avg(varPcts),
    };
  }

  buildReasonTagRows(
    reviewedRows: ProgramCalibrationAnalyticsSource[],
  ): DeepCleanReasonTagInsightRowDto[] {
    return DEEP_CLEAN_REVIEW_TAGS.map((reasonTag) => {
      const matching = reviewedRows.filter((r) => this.tagsForRow(r).includes(reasonTag));
      const n = matching.length;
      if (n === 0) {
        return {
          reasonTag,
          reviewedCount: 0,
          averageVarianceMinutes: null,
          averageVariancePercent: null,
          averageEstimatedTotalDurationMinutes: null,
          averageActualTotalDurationMinutes: null,
        };
      }
      const varMins = matching
        .map((r) => r.durationVarianceMinutes)
        .filter((v): v is number => v != null && Number.isFinite(v));
      const varPcts = matching
        .map((r) => decToNumber(r.durationVariancePercent))
        .filter((v): v is number => v != null && Number.isFinite(v));
      const est = matching.map((r) => r.estimatedTotalDurationMinutes);
      const act = matching
        .map((r) => r.actualTotalDurationMinutes)
        .filter((v): v is number => v != null && Number.isFinite(v));
      return {
        reasonTag,
        reviewedCount: n,
        averageVarianceMinutes: avg(varMins),
        averageVariancePercent: avg(varPcts),
        averageEstimatedTotalDurationMinutes: avg(est),
        averageActualTotalDurationMinutes: avg(act),
      };
    });
  }

  buildProgramTypeRows(
    rowsInFilter: ProgramCalibrationAnalyticsSource[],
  ): DeepCleanProgramTypeInsightRowDto[] {
    return PROGRAM_TYPES_FOR_INSIGHTS.map((programType) => {
      const subset = rowsInFilter.filter((r) => r.programType === programType);
      const reviewed = subset.filter(
        (r) => r.reviewStatus === DeepCleanCalibrationReviewStatus.reviewed,
      );
      const usable = subset.filter((r) => r.usableForCalibrationAnalysis);
      const varMins = reviewed
        .map((r) => r.durationVarianceMinutes)
        .filter((v): v is number => v != null && Number.isFinite(v));
      const varPcts = reviewed
        .map((r) => decToNumber(r.durationVariancePercent))
        .filter((v): v is number => v != null && Number.isFinite(v));
      return {
        programType,
        reviewedCount: reviewed.length,
        usableCount: usable.length,
        averageVarianceMinutes: avg(varMins),
        averageVariancePercent: avg(varPcts),
      };
    });
  }

  buildFeedbackBuckets(
    reviewedRows: ProgramCalibrationAnalyticsSource[],
  ): { bucket: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const b of DEEP_CLEAN_INSIGHT_FEEDBACK_BUCKETS) {
      counts.set(b, 0);
    }
    for (const r of reviewedRows) {
      const b = classifyBookingFeedbackBucket(this.tagsForRow(r));
      counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    return DEEP_CLEAN_INSIGHT_FEEDBACK_BUCKETS.map((bucket) => ({
      bucket,
      count: counts.get(bucket) ?? 0,
    }));
  }
}
