/** GET /api/v1/admin/deep-clean/estimator-impact */

export type DeepCleanEstimatorImpactProgramTypeApi = "single_visit" | "three_visit";

export type DeepCleanEstimatorImpactTrendBucketRowApi = {
  bucketStartDate: string;
  bucketLabel: string;
  estimatorConfigVersion: number | null;
  averageVariancePercent: number | null;
  totalCount: number;
  reviewedCount: number;
  usableCount: number;
  underCount: number;
  overCount: number;
};

export type DeepCleanEstimatorImpactQueryParamsApi = {
  /** Omit for API default (strict reviewed-only). */
  reviewedOnly?: boolean;
  /** Omit for API default (strict usable-only). */
  usableOnly?: boolean;
  programType?: DeepCleanEstimatorImpactProgramTypeApi;
  /** Integer string, or "null" for unknown version bucket. */
  version?: string;
  limit?: number;
  /** When true, API includes trendRows (time buckets). */
  includeTrend?: boolean;
  trendWindowDays?: number;
  trendBucket?: "day" | "week";
};

export type DeepCleanEstimatorVersionImpactRowApi = {
  estimatorConfigVersion: number | null;
  estimatorConfigLabel: string | null;
  programCount: number;
  usableProgramCount: number;
  reviewedProgramCount: number;
  averageVarianceMinutes: number | null;
  averageVariancePercent: number | null;
  underestimationTagCount: number;
  overestimationTagCount: number;
  estimatorIssueCount: number;
  operationalIssueCount: number;
  scopeIssueCount: number;
  dataQualityIssueCount: number;
  mixedIssueCount: number;
  otherIssueCount: number;
};

/** Alias for per-version impact aggregates (used by decision selectors). */
export type DeepCleanEstimatorImpactVersionRow = DeepCleanEstimatorVersionImpactRowApi;

export type DeepCleanEstimatorVersionComparisonApi = {
  baselineVersion: number;
  comparisonVersion: number;
  baselineAverageVariancePercent: number | null;
  comparisonAverageVariancePercent: number | null;
  deltaVariancePercent: number | null;
  baselineAverageVarianceMinutes: number | null;
  comparisonAverageVarianceMinutes: number | null;
  deltaVarianceMinutes: number | null;
};

export type DeepCleanEstimatorImpactResponseApi = {
  kind: "deep_clean_estimator_impact";
  rows: DeepCleanEstimatorVersionImpactRowApi[];
  comparisons: DeepCleanEstimatorVersionComparisonApi[];
  trendRows?: DeepCleanEstimatorImpactTrendBucketRowApi[];
};
