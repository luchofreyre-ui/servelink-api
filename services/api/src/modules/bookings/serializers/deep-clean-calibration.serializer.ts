import type {
  BookingDeepCleanProgramCalibration,
  BookingDeepCleanVisitCalibration,
  DeepCleanVisitExecutionStatus,
} from "@prisma/client";
import type { BookingScreenDeepCleanCalibrationDto } from "../dto/booking-screen-response.dto";
import { parseReviewReasonTagsFromJson } from "../deep-clean-review-tags";

function decToNumber(v: { toString(): string } | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

function executionStatusToDto(
  s: DeepCleanVisitExecutionStatus,
): "not_started" | "in_progress" | "completed" {
  if (s === "completed") return "completed";
  if (s === "in_progress") return "in_progress";
  return "not_started";
}

/**
 * Shapes persisted calibration rows for `GET .../screen`. No recompute.
 */
export function serializeDeepCleanCalibrationForScreen(input: {
  program: BookingDeepCleanProgramCalibration;
  visits: BookingDeepCleanVisitCalibration[];
}): BookingScreenDeepCleanCalibrationDto {
  return {
    program: {
      programType: input.program.programType,
      estimatedTotalDurationMinutes: input.program.estimatedTotalDurationMinutes,
      actualTotalDurationMinutes: input.program.actualTotalDurationMinutes,
      durationVarianceMinutes: input.program.durationVarianceMinutes,
      durationVariancePercent: decToNumber(input.program.durationVariancePercent),
      totalVisits: input.program.totalVisits,
      completedVisits: input.program.completedVisits,
      isFullyCompleted: input.program.isFullyCompleted,
      hasAnyOperatorNotes: input.program.hasAnyOperatorNotes,
      usableForCalibrationAnalysis: input.program.usableForCalibrationAnalysis,
      reviewStatus:
        input.program.reviewStatus === "reviewed" ? "reviewed" : "unreviewed",
      reviewedAt: input.program.reviewedAt?.toISOString() ?? null,
      reviewReasonTags: parseReviewReasonTagsFromJson(
        input.program.reviewReasonTagsJson,
      ),
      reviewNote: input.program.reviewNote ?? null,
    },
    visits: [...input.visits]
      .sort((a, b) => a.visitNumber - b.visitNumber)
      .map((v) => ({
        visitNumber: v.visitNumber,
        estimatedDurationMinutes: v.estimatedDurationMinutes,
        actualDurationMinutes: v.actualDurationMinutes,
        durationVarianceMinutes: v.durationVarianceMinutes,
        durationVariancePercent: decToNumber(v.durationVariancePercent),
        executionStatus: executionStatusToDto(v.executionStatus),
        hasOperatorNote: v.hasOperatorNote,
        completedAt: v.completedAt?.toISOString() ?? null,
      })),
  };
}
