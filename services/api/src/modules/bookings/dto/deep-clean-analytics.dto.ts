import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { DEEP_CLEAN_REVIEW_TAGS } from "../deep-clean-review-tags";

const REASON_TAG_QUERY_LIST = DEEP_CLEAN_REVIEW_TAGS as unknown as string[];

export type DeepCleanAnalyticsSortBy =
  | "variance_minutes_desc"
  | "variance_minutes_asc"
  | "variance_percent_desc"
  | "variance_percent_asc"
  | "createdAt_desc";

export class DeepCleanAnalyticsQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true" || value === "1")
  @IsBoolean()
  usableOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true" || value === "1")
  @IsBoolean()
  withOperatorNotesOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true" || value === "1")
  @IsBoolean()
  fullyCompletedOnly?: boolean;

  /** Maps to persisted `programType`: single_visit → single_visit_deep_clean, three_visit → phased_deep_clean_program */
  @IsOptional()
  @IsIn(["single_visit", "three_visit"])
  programType?: "single_visit" | "three_visit";

  @IsOptional()
  @IsString()
  @IsIn([
    "variance_minutes_desc",
    "variance_minutes_asc",
    "variance_percent_desc",
    "variance_percent_asc",
    "createdAt_desc",
  ])
  sortBy?: DeepCleanAnalyticsSortBy;

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === "") return undefined;
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : undefined;
  })
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsIn(["reviewed", "unreviewed"])
  reviewStatus?: "reviewed" | "unreviewed";

  @IsOptional()
  @IsString()
  @IsIn(REASON_TAG_QUERY_LIST)
  reasonTag?: string;
}

export type DeepCleanAnalyticsSummaryDto = {
  totalProgramCalibrations: number;
  usableProgramCalibrations: number;
  fullyCompletedPrograms: number;
  programsWithOperatorNotes: number;
  averageVarianceMinutes: number | null;
  averageVariancePercent: number | null;
  averageEstimatedTotalDurationMinutes: number | null;
  averageActualTotalDurationMinutes: number | null;
};

export type DeepCleanAnalyticsBookingRowDto = {
  bookingId: string;
  programId: string;
  programType: string;
  estimatedTotalDurationMinutes: number;
  actualTotalDurationMinutes: number | null;
  durationVarianceMinutes: number | null;
  durationVariancePercent: number | null;
  totalVisits: number;
  completedVisits: number;
  isFullyCompleted: boolean;
  hasAnyOperatorNotes: boolean;
  usableForCalibrationAnalysis: boolean;
  reviewStatus: "unreviewed" | "reviewed";
  reviewedAt: string | null;
  reviewReasonTags: string[];
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeepCleanAnalyticsResponseDto = {
  summary: DeepCleanAnalyticsSummaryDto;
  rows: DeepCleanAnalyticsBookingRowDto[];
};
