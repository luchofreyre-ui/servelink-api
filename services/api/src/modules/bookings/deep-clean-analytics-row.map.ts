import { DeepCleanCalibrationReviewStatus, Prisma } from "@prisma/client";
import type { DeepCleanAnalyticsBookingRowDto } from "./dto/deep-clean-analytics.dto";
import { parseReviewReasonTagsFromJson } from "./deep-clean-review-tags";

function decToNumber(v: Prisma.Decimal | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

/** Persisted program calibration + booking.createdAt for analytics row DTOs. */
export type ProgramCalibrationAnalyticsSource = {
  bookingId: string;
  programId: string;
  programType: string;
  estimatedTotalDurationMinutes: number;
  actualTotalDurationMinutes: number | null;
  durationVarianceMinutes: number | null;
  durationVariancePercent: Prisma.Decimal | null;
  totalVisits: number;
  completedVisits: number;
  isFullyCompleted: boolean;
  hasAnyOperatorNotes: boolean;
  usableForCalibrationAnalysis: boolean;
  reviewStatus: DeepCleanCalibrationReviewStatus;
  reviewedAt: Date | null;
  reviewReasonTagsJson: Prisma.JsonValue | null;
  reviewNote: string | null;
  updatedAt: Date;
  booking: { createdAt: Date; updatedAt: Date };
};

export function mapProgramCalibrationToAnalyticsBookingRowDto(
  r: ProgramCalibrationAnalyticsSource,
): DeepCleanAnalyticsBookingRowDto {
  const rs =
    r.reviewStatus === DeepCleanCalibrationReviewStatus.reviewed
      ? "reviewed"
      : "unreviewed";
  return {
    bookingId: r.bookingId,
    programId: r.programId,
    programType: r.programType,
    estimatedTotalDurationMinutes: r.estimatedTotalDurationMinutes,
    actualTotalDurationMinutes: r.actualTotalDurationMinutes,
    durationVarianceMinutes: r.durationVarianceMinutes,
    durationVariancePercent: decToNumber(r.durationVariancePercent),
    totalVisits: r.totalVisits,
    completedVisits: r.completedVisits,
    isFullyCompleted: r.isFullyCompleted,
    hasAnyOperatorNotes: r.hasAnyOperatorNotes,
    usableForCalibrationAnalysis: r.usableForCalibrationAnalysis,
    reviewStatus: rs,
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    reviewReasonTags: parseReviewReasonTagsFromJson(r.reviewReasonTagsJson),
    reviewNote: r.reviewNote ?? null,
    createdAt: r.booking.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
