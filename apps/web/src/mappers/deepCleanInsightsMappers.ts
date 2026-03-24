import type {
  DeepCleanEstimatorFeedbackBucketRowApi,
  DeepCleanInsightsSummaryApi,
  DeepCleanProgramTypeInsightRowApi,
  DeepCleanReasonTagInsightRowApi,
} from "@/types/deepCleanInsights";
import { DEEP_CLEAN_REVIEW_TAG_LABELS } from "@/constants/deepCleanReviewTags";

export const DEEP_CLEAN_INSIGHT_BUCKET_LABELS: Record<string, string> = {
  estimator_issue: "Estimator issue",
  operational_issue: "Operational issue",
  scope_issue: "Scope issue",
  data_quality_issue: "Data quality issue",
  mixed: "Mixed",
  other: "Other",
};

export type DeepCleanInsightsSummaryDisplay = DeepCleanInsightsSummaryApi;

export type DeepCleanReasonTagInsightRowDisplay = DeepCleanReasonTagInsightRowApi & {
  reasonTagLabel: string;
};

export type DeepCleanProgramTypeInsightRowDisplay = DeepCleanProgramTypeInsightRowApi & {
  programTypeLabel: string;
};

export type DeepCleanFeedbackBucketDisplay = DeepCleanEstimatorFeedbackBucketRowApi & {
  bucketLabel: string;
};

export function programTypePersistedToLabel(programType: string): string {
  if (programType === "single_visit_deep_clean") return "Single visit";
  if (programType === "phased_deep_clean_program") return "Three visit";
  return programType;
}

export function mapDeepCleanInsightsSummaryApiToDisplay(
  s: DeepCleanInsightsSummaryApi,
): DeepCleanInsightsSummaryDisplay {
  return { ...s };
}

export function mapReasonTagInsightRowApiToDisplay(
  row: DeepCleanReasonTagInsightRowApi,
): DeepCleanReasonTagInsightRowDisplay {
  const label =
    DEEP_CLEAN_REVIEW_TAG_LABELS[row.reasonTag as keyof typeof DEEP_CLEAN_REVIEW_TAG_LABELS] ??
    row.reasonTag;
  return { ...row, reasonTagLabel: label };
}

export function mapProgramTypeInsightRowApiToDisplay(
  row: DeepCleanProgramTypeInsightRowApi,
): DeepCleanProgramTypeInsightRowDisplay {
  return {
    ...row,
    programTypeLabel: programTypePersistedToLabel(row.programType),
  };
}

export function mapFeedbackBucketApiToDisplay(
  row: DeepCleanEstimatorFeedbackBucketRowApi,
): DeepCleanFeedbackBucketDisplay {
  return {
    ...row,
    bucketLabel: DEEP_CLEAN_INSIGHT_BUCKET_LABELS[row.bucket] ?? row.bucket,
  };
}

/**
 * Share of reviewed programs classified as estimator_issue (0–1), from bucket counts.
 */
export function topEstimatorIssueShare(
  buckets: DeepCleanEstimatorFeedbackBucketRowApi[],
  totalReviewed: number,
): number | null {
  if (totalReviewed <= 0) return null;
  const est = buckets.find((b) => b.bucket === "estimator_issue")?.count ?? 0;
  return Math.round((est / totalReviewed) * 1000) / 1000;
}
