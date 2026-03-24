/** GET /api/v1/admin/deep-clean/insights */

export type DeepCleanInsightsFeedbackBucketApi =
  | "estimator_issue"
  | "operational_issue"
  | "scope_issue"
  | "data_quality_issue"
  | "mixed"
  | "other";

export type DeepCleanInsightsQueryParamsApi = {
  reviewedOnly?: boolean;
  programType?: "single_visit" | "three_visit";
  reasonTag?: string;
  feedbackBucket?: DeepCleanInsightsFeedbackBucketApi;
  bookingNotesStartsWith?: string;
  reviewedAtFrom?: string;
  reviewedAtTo?: string;
};

export type DeepCleanInsightsSummaryApi = {
  totalReviewedPrograms: number;
  reviewedEstimatorIssuePrograms: number;
  reviewedOperationalIssuePrograms: number;
  reviewedScopeIssuePrograms: number;
  averageReviewedVarianceMinutes: number | null;
  averageReviewedVariancePercent: number | null;
};

export type DeepCleanReasonTagInsightRowApi = {
  reasonTag: string;
  reviewedCount: number;
  averageVarianceMinutes: number | null;
  averageVariancePercent: number | null;
  averageEstimatedTotalDurationMinutes: number | null;
  averageActualTotalDurationMinutes: number | null;
};

export type DeepCleanProgramTypeInsightRowApi = {
  programType: string;
  reviewedCount: number;
  usableCount: number;
  averageVarianceMinutes: number | null;
  averageVariancePercent: number | null;
};

export type DeepCleanEstimatorFeedbackBucketRowApi = {
  bucket: string;
  count: number;
};

export type DeepCleanInsightsResponseApi = {
  kind: "deep_clean_insights";
  summary: DeepCleanInsightsSummaryApi;
  reasonTagRows: DeepCleanReasonTagInsightRowApi[];
  programTypeRows: DeepCleanProgramTypeInsightRowApi[];
  feedbackBuckets: DeepCleanEstimatorFeedbackBucketRowApi[];
};
