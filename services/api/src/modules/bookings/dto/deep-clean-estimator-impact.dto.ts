import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

/** Default lookback when `trendWindowDays` is omitted (see query DTO). */
export const DEEP_CLEAN_ESTIMATOR_DEFAULT_TREND_WINDOW_DAYS = 60;

export class DeepCleanEstimatorImpactQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") return undefined;
    if (value === false || value === "false" || value === "0") return false;
    return true;
  })
  @IsBoolean()
  /** Default true when omitted. */
  reviewedOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") return undefined;
    if (value === false || value === "false" || value === "0") return false;
    return true;
  })
  @IsBoolean()
  /** Default true when omitted. */
  usableOnly?: boolean;

  @IsOptional()
  @IsIn(["single_visit", "three_visit"])
  programType?: "single_visit" | "three_visit";

  /** Filter to a single estimator config version (integer string), or "null" for unknown. */
  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" || value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  /** Max number of version buckets returned (highest version numbers kept). */
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") return undefined;
    if (value === false || value === "false" || value === "0" || value === 0) return false;
    if (value === true || value === "true" || value === "1" || value === 1) return true;
    return false;
  })
  @IsBoolean()
  /** When true, response includes trendRows (time-bucket aggregates). */
  includeTrend?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value === "" || value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(365)
  /** Ignored unless includeTrend is true. Clamped server-side to 1–365; default 60. */
  trendWindowDays?: number;

  @IsOptional()
  @IsIn(["day", "week"])
  /** Ignored unless includeTrend is true. Default week (Monday-start UTC). */
  trendBucket?: "day" | "week";
}

export type DeepCleanEstimatorVersionImpactRowDto = {
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

export type DeepCleanEstimatorTrendBucketDto = {
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

export type DeepCleanEstimatorVersionComparisonDto = {
  baselineVersion: number;
  comparisonVersion: number;
  baselineAverageVariancePercent: number | null;
  comparisonAverageVariancePercent: number | null;
  deltaVariancePercent: number | null;
  baselineAverageVarianceMinutes: number | null;
  comparisonAverageVarianceMinutes: number | null;
  deltaVarianceMinutes: number | null;
};

export type DeepCleanEstimatorImpactResponseDto = {
  rows: DeepCleanEstimatorVersionImpactRowDto[];
  comparisons: DeepCleanEstimatorVersionComparisonDto[];
  /** Present only when includeTrend was requested. */
  trendRows?: DeepCleanEstimatorTrendBucketDto[];
};
