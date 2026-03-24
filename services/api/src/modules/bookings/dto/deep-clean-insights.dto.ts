import { Transform } from "class-transformer";
import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { DEEP_CLEAN_INSIGHT_FEEDBACK_BUCKETS } from "../deep-clean-feedback-buckets";
import { DEEP_CLEAN_REVIEW_TAGS } from "../deep-clean-review-tags";

const REASON_TAGS = DEEP_CLEAN_REVIEW_TAGS as unknown as string[];
const BUCKETS = DEEP_CLEAN_INSIGHT_FEEDBACK_BUCKETS as unknown as string[];

export class DeepCleanInsightsQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") return undefined;
    if (value === false || value === "false" || value === "0") return false;
    return true;
  })
  @IsBoolean()
  /** Default true when omitted: insights focus on reviewed calibrations. */
  reviewedOnly?: boolean;

  @IsOptional()
  @IsIn(["single_visit", "three_visit"])
  programType?: "single_visit" | "three_visit";

  @IsOptional()
  @IsString()
  @IsIn(REASON_TAGS)
  reasonTag?: string;

  @IsOptional()
  @IsString()
  @IsIn(BUCKETS)
  feedbackBucket?: string;

  /** Narrows insights to bookings whose notes start with this string (operational cohort tagging). */
  @IsOptional()
  @IsString()
  @MinLength(1)
  bookingNotesStartsWith?: string;

  @IsOptional()
  @IsDateString()
  reviewedAtFrom?: string;

  @IsOptional()
  @IsDateString()
  reviewedAtTo?: string;
}

export type DeepCleanInsightsSummaryDto = {
  totalReviewedPrograms: number;
  reviewedEstimatorIssuePrograms: number;
  reviewedOperationalIssuePrograms: number;
  reviewedScopeIssuePrograms: number;
  averageReviewedVarianceMinutes: number | null;
  averageReviewedVariancePercent: number | null;
};

export type DeepCleanReasonTagInsightRowDto = {
  reasonTag: string;
  reviewedCount: number;
  averageVarianceMinutes: number | null;
  averageVariancePercent: number | null;
  averageEstimatedTotalDurationMinutes: number | null;
  averageActualTotalDurationMinutes: number | null;
};

export type DeepCleanProgramTypeInsightRowDto = {
  programType: string;
  reviewedCount: number;
  usableCount: number;
  averageVarianceMinutes: number | null;
  averageVariancePercent: number | null;
};

export type DeepCleanEstimatorFeedbackBucketDto = {
  bucket: string;
  count: number;
};

export type DeepCleanInsightsResponseDto = {
  summary: DeepCleanInsightsSummaryDto;
  reasonTagRows: DeepCleanReasonTagInsightRowDto[];
  programTypeRows: DeepCleanProgramTypeInsightRowDto[];
  feedbackBuckets: DeepCleanEstimatorFeedbackBucketDto[];
};
