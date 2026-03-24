import { Injectable } from "@nestjs/common";
import {
  DeepCleanCalibrationReviewStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { classifyBookingFeedbackBucket } from "./deep-clean-feedback-buckets";
import { parseReviewReasonTagsFromJson } from "./deep-clean-review-tags";
import {
  DEEP_CLEAN_ESTIMATOR_DEFAULT_TREND_WINDOW_DAYS,
  type DeepCleanEstimatorImpactQueryDto,
  type DeepCleanEstimatorImpactResponseDto,
  type DeepCleanEstimatorTrendBucketDto,
  type DeepCleanEstimatorVersionComparisonDto,
  type DeepCleanEstimatorVersionImpactRowDto,
} from "./dto/deep-clean-estimator-impact.dto";

function decToNumber(v: Prisma.Decimal | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

function compareVersion(
  a: number | null,
  b: number | null,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = nums.reduce((x, y) => x + y, 0);
  return Math.round((s / nums.length) * 100) / 100;
}

/** Query booleans often arrive as strings on GET; default strict when omitted. */
function wantStrictReviewedOnly(q: DeepCleanEstimatorImpactQueryDto): boolean {
  const v = q.reviewedOnly as unknown;
  if (v === undefined || v === null || v === "") return true;
  if (v === false || v === "false" || v === "0" || v === 0) return false;
  return true;
}

function wantStrictUsableOnly(q: DeepCleanEstimatorImpactQueryDto): boolean {
  const v = q.usableOnly as unknown;
  if (v === undefined || v === null || v === "") return true;
  if (v === false || v === "false" || v === "0" || v === 0) return false;
  return true;
}

/** Explicit true only — avoids treating string "false" as true. */
function wantIncludeTrend(q: DeepCleanEstimatorImpactQueryDto): boolean {
  const v = q.includeTrend as unknown;
  if (v === undefined || v === null || v === "") return false;
  if (v === true || v === "true" || v === "1" || v === 1) return true;
  return false;
}

function clampTrendWindowDays(raw: number | undefined): number {
  if (raw == null || !Number.isFinite(raw)) return DEEP_CLEAN_ESTIMATOR_DEFAULT_TREND_WINDOW_DAYS;
  return Math.min(365, Math.max(1, Math.floor(raw)));
}

/** Review time when set; otherwise calibration row creation time (stable, not updatedAt). */
function trendAnchorDate(reviewedAt: Date | null, createdAt: Date): Date {
  return reviewedAt ?? createdAt;
}

function utcDayKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** Monday-start week in UTC; returns YYYY-MM-DD of that Monday. */
function utcWeekStartMondayKey(d: Date): string {
  const t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const day = new Date(t).getUTCDay();
  const diff = (day + 6) % 7;
  const mondayMs = t - diff * 86_400_000;
  const monday = new Date(mondayMs);
  return utcDayKey(monday);
}

function bucketMetaForAnchor(
  anchor: Date,
  trendBucket: "day" | "week",
): { bucketStartDate: string; bucketLabel: string } {
  if (trendBucket === "day") {
    const bucketStartDate = utcDayKey(anchor);
    return { bucketStartDate, bucketLabel: bucketStartDate };
  }
  const bucketStartDate = utcWeekStartMondayKey(anchor);
  return { bucketStartDate, bucketLabel: `Week of ${bucketStartDate} (UTC)` };
}

function buildWhere(
  q: DeepCleanEstimatorImpactQueryDto,
): Prisma.BookingDeepCleanProgramCalibrationWhereInput {
  const reviewedOnly = wantStrictReviewedOnly(q);
  const usableOnly = wantStrictUsableOnly(q);
  const where: Prisma.BookingDeepCleanProgramCalibrationWhereInput = {};
  if (reviewedOnly) {
    where.reviewStatus = DeepCleanCalibrationReviewStatus.reviewed;
  }
  if (usableOnly) {
    where.usableForCalibrationAnalysis = true;
  }
  if (q.programType === "single_visit") {
    where.programType = "single_visit_deep_clean";
  } else if (q.programType === "three_visit") {
    where.programType = "phased_deep_clean_program";
  }
  if (q.version !== undefined && q.version !== "") {
    const v = String(q.version).trim().toLowerCase();
    if (v === "null" || v === "unknown") {
      where.deepCleanEstimatorConfigVersion = null;
    } else {
      const n = parseInt(q.version, 10);
      if (Number.isFinite(n)) {
        where.deepCleanEstimatorConfigVersion = n;
      }
    }
  }
  return where;
}

type CalRow = {
  deepCleanEstimatorConfigVersion: number | null;
  deepCleanEstimatorConfigLabel: string | null;
  usableForCalibrationAnalysis: boolean;
  reviewStatus: DeepCleanCalibrationReviewStatus;
  durationVarianceMinutes: number | null;
  durationVariancePercent: Prisma.Decimal | null;
  reviewReasonTagsJson: Prisma.JsonValue | null;
};

type CalTrendRow = CalRow & {
  createdAt: Date;
  reviewedAt: Date | null;
};

function versionKey(v: number | null): string {
  return v === null ? "__null__" : String(v);
}

@Injectable()
export class DeepCleanEstimatorImpactService {
  constructor(private readonly prisma: PrismaService) {}

  async getEstimatorVersionImpact(
    query: DeepCleanEstimatorImpactQueryDto,
  ): Promise<DeepCleanEstimatorImpactResponseDto> {
    const where = buildWhere(query);
    const raw: CalRow[] = await this.prisma.bookingDeepCleanProgramCalibration.findMany({
      where,
      select: {
        deepCleanEstimatorConfigVersion: true,
        deepCleanEstimatorConfigLabel: true,
        usableForCalibrationAnalysis: true,
        reviewStatus: true,
        durationVarianceMinutes: true,
        durationVariancePercent: true,
        reviewReasonTagsJson: true,
      },
    });

    const byVersion = new Map<string, CalRow[]>();
    for (const r of raw) {
      const k = versionKey(r.deepCleanEstimatorConfigVersion);
      const list = byVersion.get(k) ?? [];
      list.push(r);
      byVersion.set(k, list);
    }

    const rows: DeepCleanEstimatorVersionImpactRowDto[] = [];
    for (const [, group] of byVersion) {
      const v = group[0]?.deepCleanEstimatorConfigVersion ?? null;
      const labelCounts = new Map<string, number>();
      for (const r of group) {
        const lab = r.deepCleanEstimatorConfigLabel?.trim();
        if (lab) labelCounts.set(lab, (labelCounts.get(lab) ?? 0) + 1);
      }
      let bestLabel: string | null = null;
      let bestN = 0;
      for (const [lab, n] of labelCounts) {
        if (n > bestN) {
          bestN = n;
          bestLabel = lab;
        }
      }
      if (bestLabel == null && group.length > 0) {
        bestLabel = group.find((g) => g.deepCleanEstimatorConfigLabel)?.deepCleanEstimatorConfigLabel ?? null;
      }

      const programCount = group.length;
      const usableProgramCount = group.filter((g) => g.usableForCalibrationAnalysis).length;
      const reviewedProgramCount = group.filter(
        (g) => g.reviewStatus === DeepCleanCalibrationReviewStatus.reviewed,
      ).length;

      const mins: number[] = [];
      const pcts: number[] = [];
      for (const g of group) {
        if (g.durationVarianceMinutes != null && Number.isFinite(g.durationVarianceMinutes)) {
          mins.push(g.durationVarianceMinutes);
        }
        const p = decToNumber(g.durationVariancePercent);
        if (p != null && Number.isFinite(p)) pcts.push(p);
      }

      let underestimationTagCount = 0;
      let overestimationTagCount = 0;
      let estimatorIssueCount = 0;
      let operationalIssueCount = 0;
      let scopeIssueCount = 0;
      let dataQualityIssueCount = 0;
      let mixedIssueCount = 0;
      let otherIssueCount = 0;

      for (const g of group) {
        if (g.reviewStatus !== DeepCleanCalibrationReviewStatus.reviewed) continue;
        const tags = parseReviewReasonTagsFromJson(g.reviewReasonTagsJson);
        if (tags.includes("underestimation")) underestimationTagCount += 1;
        if (tags.includes("overestimation")) overestimationTagCount += 1;
        const bucket = classifyBookingFeedbackBucket(tags);
        if (bucket === "estimator_issue") estimatorIssueCount += 1;
        else if (bucket === "operational_issue") operationalIssueCount += 1;
        else if (bucket === "scope_issue") scopeIssueCount += 1;
        else if (bucket === "data_quality_issue") dataQualityIssueCount += 1;
        else if (bucket === "mixed") mixedIssueCount += 1;
        else otherIssueCount += 1;
      }

      rows.push({
        estimatorConfigVersion: v,
        estimatorConfigLabel: bestLabel,
        programCount,
        usableProgramCount,
        reviewedProgramCount,
        averageVarianceMinutes: avg(mins),
        averageVariancePercent: avg(pcts),
        underestimationTagCount,
        overestimationTagCount,
        estimatorIssueCount,
        operationalIssueCount,
        scopeIssueCount,
        dataQualityIssueCount,
        mixedIssueCount,
        otherIssueCount,
      });
    }

    rows.sort((a, b) => compareVersion(a.estimatorConfigVersion, b.estimatorConfigVersion));

    const limited = this.applyVersionLimit(rows, query.limit);
    const comparisons = this.buildComparisons(limited);

    if (!wantIncludeTrend(query)) {
      return { rows: limited, comparisons };
    }

    const trendBucket = query.trendBucket === "day" ? "day" : "week";
    const windowDays = clampTrendWindowDays(query.trendWindowDays);
    const trendRows = await this.buildTrendRows(query, trendBucket, windowDays);

    return { rows: limited, comparisons, trendRows };
  }

  private async buildTrendRows(
    query: DeepCleanEstimatorImpactQueryDto,
    trendBucket: "day" | "week",
    windowDays: number,
  ): Promise<DeepCleanEstimatorTrendBucketDto[]> {
    const windowStart = new Date();
    windowStart.setUTCHours(0, 0, 0, 0);
    windowStart.setUTCDate(windowStart.getUTCDate() - windowDays);

    const trendWhere: Prisma.BookingDeepCleanProgramCalibrationWhereInput = {
      AND: [
        buildWhere(query),
        {
          OR: [
            { reviewedAt: { gte: windowStart } },
            { AND: [{ reviewedAt: null }, { createdAt: { gte: windowStart } }] },
          ],
        },
      ],
    };

    const trendRaw: CalTrendRow[] = await this.prisma.bookingDeepCleanProgramCalibration.findMany({
      where: trendWhere,
      select: {
        deepCleanEstimatorConfigVersion: true,
        deepCleanEstimatorConfigLabel: true,
        usableForCalibrationAnalysis: true,
        reviewStatus: true,
        durationVarianceMinutes: true,
        durationVariancePercent: true,
        reviewReasonTagsJson: true,
        createdAt: true,
        reviewedAt: true,
      },
    });

    const byBucketVersion = new Map<string, CalTrendRow[]>();
    for (const r of trendRaw) {
      const anchor = trendAnchorDate(r.reviewedAt, r.createdAt);
      const { bucketStartDate } = bucketMetaForAnchor(anchor, trendBucket);
      const vk = versionKey(r.deepCleanEstimatorConfigVersion);
      const key = `${bucketStartDate}\x00${vk}`;
      const list = byBucketVersion.get(key) ?? [];
      list.push(r);
      byBucketVersion.set(key, list);
    }

    const out: DeepCleanEstimatorTrendBucketDto[] = [];
    for (const [, group] of byBucketVersion) {
      const first = group[0];
      if (!first) continue;
      const anchor = trendAnchorDate(first.reviewedAt, first.createdAt);
      const { bucketStartDate, bucketLabel } = bucketMetaForAnchor(anchor, trendBucket);
      const v = first.deepCleanEstimatorConfigVersion ?? null;

      const programCount = group.length;
      const usableProgramCount = group.filter((g) => g.usableForCalibrationAnalysis).length;
      const reviewedProgramCount = group.filter(
        (g) => g.reviewStatus === DeepCleanCalibrationReviewStatus.reviewed,
      ).length;

      const pcts: number[] = [];
      for (const g of group) {
        const p = decToNumber(g.durationVariancePercent);
        if (p != null && Number.isFinite(p)) pcts.push(p);
      }

      let underestimationTagCount = 0;
      let overestimationTagCount = 0;
      for (const g of group) {
        if (g.reviewStatus !== DeepCleanCalibrationReviewStatus.reviewed) continue;
        const tags = parseReviewReasonTagsFromJson(g.reviewReasonTagsJson);
        if (tags.includes("underestimation")) underestimationTagCount += 1;
        if (tags.includes("overestimation")) overestimationTagCount += 1;
      }

      out.push({
        bucketStartDate,
        bucketLabel,
        estimatorConfigVersion: v,
        averageVariancePercent: avg(pcts),
        totalCount: programCount,
        reviewedCount: reviewedProgramCount,
        usableCount: usableProgramCount,
        underCount: underestimationTagCount,
        overCount: overestimationTagCount,
      });
    }

    out.sort((a, b) => {
      const c = a.bucketStartDate.localeCompare(b.bucketStartDate);
      if (c !== 0) return c;
      if (a.estimatorConfigVersion == null && b.estimatorConfigVersion == null) return 0;
      if (a.estimatorConfigVersion == null) return 1;
      if (b.estimatorConfigVersion == null) return -1;
      return a.estimatorConfigVersion - b.estimatorConfigVersion;
    });

    return out;
  }

  private applyVersionLimit(
    rows: DeepCleanEstimatorVersionImpactRowDto[],
    limit?: number,
  ): DeepCleanEstimatorVersionImpactRowDto[] {
    if (limit == null || limit <= 0 || rows.length <= limit) {
      return rows;
    }
    const unknown = rows.filter((r) => r.estimatorConfigVersion == null);
    const numeric = rows.filter((r) => r.estimatorConfigVersion != null) as Array<
      DeepCleanEstimatorVersionImpactRowDto & { estimatorConfigVersion: number }
    >;
    numeric.sort((a, b) => a.estimatorConfigVersion - b.estimatorConfigVersion);
    const tail = numeric.slice(-limit);
    const merged = [...tail, ...unknown];
    merged.sort((a, b) => compareVersion(a.estimatorConfigVersion, b.estimatorConfigVersion));
    return merged;
  }

  private buildComparisons(
    rows: DeepCleanEstimatorVersionImpactRowDto[],
  ): DeepCleanEstimatorVersionComparisonDto[] {
    const numeric = rows.filter(
      (r): r is DeepCleanEstimatorVersionImpactRowDto & { estimatorConfigVersion: number } =>
        r.estimatorConfigVersion != null,
    );
    numeric.sort((a, b) => a.estimatorConfigVersion - b.estimatorConfigVersion);
    const out: DeepCleanEstimatorVersionComparisonDto[] = [];
    for (let i = 0; i < numeric.length - 1; i++) {
      const baseline = numeric[i];
      const comparison = numeric[i + 1];
      const bp = baseline.averageVariancePercent;
      const cp = comparison.averageVariancePercent;
      const bm = baseline.averageVarianceMinutes;
      const cm = comparison.averageVarianceMinutes;
      out.push({
        baselineVersion: baseline.estimatorConfigVersion,
        comparisonVersion: comparison.estimatorConfigVersion,
        baselineAverageVariancePercent: bp,
        comparisonAverageVariancePercent: cp,
        deltaVariancePercent:
          bp != null && cp != null ? Math.round((cp - bp) * 100) / 100 : null,
        baselineAverageVarianceMinutes: bm,
        comparisonAverageVarianceMinutes: cm,
        deltaVarianceMinutes:
          bm != null && cm != null ? Math.round((cm - bm) * 100) / 100 : null,
      });
    }
    return out;
  }
}
