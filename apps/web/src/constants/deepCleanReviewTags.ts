/** Must match API `DEEP_CLEAN_REVIEW_TAGS` (admin calibration review). */
export const DEEP_CLEAN_REVIEW_TAGS = [
  "underestimation",
  "overestimation",
  "scope_anomaly",
  "operator_inefficiency",
  "customer_interference",
  "task_bundle_mismatch",
  "note_follow_up_required",
  "incomplete_execution_data",
  "other",
] as const;

export type DeepCleanReviewTag = (typeof DEEP_CLEAN_REVIEW_TAGS)[number];

export const DEEP_CLEAN_REVIEW_TAG_LABELS: Record<DeepCleanReviewTag, string> = {
  underestimation: "Underestimation",
  overestimation: "Overestimation",
  scope_anomaly: "Scope anomaly",
  operator_inefficiency: "Operator inefficiency",
  customer_interference: "Customer interference",
  task_bundle_mismatch: "Task bundle mismatch",
  note_follow_up_required: "Note requires follow-up",
  incomplete_execution_data: "Incomplete execution data",
  other: "Other",
};
