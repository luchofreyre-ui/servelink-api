import { isDeepCleanReviewTag, type DeepCleanReviewTag } from "./deep-clean-review-tags";

/**
 * High-level estimator / ops feedback buckets derived deterministically from review tags.
 */
export const DEEP_CLEAN_INSIGHT_FEEDBACK_BUCKETS = [
  "estimator_issue",
  "operational_issue",
  "scope_issue",
  "data_quality_issue",
  "mixed",
  "other",
] as const;

export type DeepCleanInsightFeedbackBucket =
  (typeof DEEP_CLEAN_INSIGHT_FEEDBACK_BUCKETS)[number];

const TAG_TO_BUCKET: Record<DeepCleanReviewTag, Exclude<DeepCleanInsightFeedbackBucket, "mixed">> = {
  underestimation: "estimator_issue",
  overestimation: "estimator_issue",
  task_bundle_mismatch: "estimator_issue",
  operator_inefficiency: "operational_issue",
  customer_interference: "operational_issue",
  scope_anomaly: "scope_issue",
  incomplete_execution_data: "data_quality_issue",
  note_follow_up_required: "data_quality_issue",
  other: "other",
};

/**
 * Classify a reviewed booking from its persisted reason tags.
 * Multiple underlying bucket classes → `mixed`. No tags → `other`.
 */
export function classifyBookingFeedbackBucket(tags: string[]): DeepCleanInsightFeedbackBucket {
  const normalized = tags.map((t) => String(t).trim()).filter(Boolean);
  if (normalized.length === 0) {
    return "other";
  }
  const buckets = new Set<Exclude<DeepCleanInsightFeedbackBucket, "mixed">>();
  for (const t of normalized) {
    if (!isDeepCleanReviewTag(t)) {
      buckets.add("other");
      continue;
    }
    buckets.add(TAG_TO_BUCKET[t]);
  }
  if (buckets.size > 1) {
    return "mixed";
  }
  return [...buckets][0] ?? "other";
}
