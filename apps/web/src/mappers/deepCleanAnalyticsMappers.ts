import type {
  DeepCleanAnalyticsRowApi,
  DeepCleanAnalyticsSummaryApi,
} from "@/types/deepCleanAnalytics";

export type DeepCleanAnalyticsSeverity = "normal" | "watch" | "high";

export type DeepCleanAnalyticsSummaryDisplay = DeepCleanAnalyticsSummaryApi;

export type DeepCleanAnalyticsRowDisplay = DeepCleanAnalyticsRowApi & {
  severity: DeepCleanAnalyticsSeverity | null;
  programTypeLabel: string;
  /** True when row merits admin attention and is not yet reviewed. */
  needsReview: boolean;
};

export function programTypeToLabel(programType: string): string {
  if (programType === "single_visit_deep_clean") return "Single visit";
  if (programType === "phased_deep_clean_program") return "Three visit";
  return programType;
}

export function variancePercentToSeverity(
  durationVariancePercent: number | null,
): DeepCleanAnalyticsSeverity | null {
  if (durationVariancePercent == null || !Number.isFinite(durationVariancePercent)) {
    return null;
  }
  const abs = Math.abs(durationVariancePercent);
  if (abs >= 25) return "high";
  if (abs >= 10) return "watch";
  return "normal";
}

export function mapDeepCleanAnalyticsSummaryApiToDisplay(
  summary: DeepCleanAnalyticsSummaryApi,
): DeepCleanAnalyticsSummaryDisplay {
  return { ...summary };
}

function normalizeAnalyticsRowApi(row: DeepCleanAnalyticsRowApi): DeepCleanAnalyticsRowApi {
  return {
    ...row,
    reviewStatus: row.reviewStatus === "reviewed" ? "reviewed" : "unreviewed",
    reviewedAt: row.reviewedAt ?? null,
    reviewReasonTags: Array.isArray(row.reviewReasonTags) ? row.reviewReasonTags : [],
    reviewNote: row.reviewNote ?? null,
  };
}

/** Operational attention (excludes rows already marked reviewed). */
export function computeOperationalNeedsReview(row: DeepCleanAnalyticsRowApi): boolean {
  const r = normalizeAnalyticsRowApi(row);
  if (r.reviewStatus === "reviewed") return false;
  const unusableCompleted =
    r.usableForCalibrationAnalysis === false && r.isFullyCompleted === true;
  if (unusableCompleted) return true;
  if (r.hasAnyOperatorNotes) return true;
  const p = r.durationVariancePercent;
  if (p != null && Number.isFinite(p) && Math.abs(p) >= 25) return true;
  return false;
}

export function mapDeepCleanAnalyticsRowApiToDisplay(
  row: DeepCleanAnalyticsRowApi,
): DeepCleanAnalyticsRowDisplay {
  const base = normalizeAnalyticsRowApi(row);
  return {
    ...base,
    programTypeLabel: programTypeToLabel(base.programType),
    severity: variancePercentToSeverity(base.durationVariancePercent),
    needsReview: computeOperationalNeedsReview(base),
  };
}

export function mapDeepCleanAnalyticsRowsApiToDisplay(
  rows: DeepCleanAnalyticsRowApi[],
): DeepCleanAnalyticsRowDisplay[] {
  return rows.map(mapDeepCleanAnalyticsRowApiToDisplay);
}
