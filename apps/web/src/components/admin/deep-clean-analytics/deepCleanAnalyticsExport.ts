import type { DeepCleanAnalyticsRowDisplay } from "@/mappers/deepCleanAnalyticsMappers";

export type DeepCleanAnalyticsExportRow = {
  bookingId: string;
  programId: string;
  programType: string;
  programTypeLabel: string;
  estimatedTotalDurationMinutes: number;
  actualTotalDurationMinutes: number | null;
  durationVarianceMinutes: number | null;
  durationVariancePercent: number | null;
  totalVisits: number;
  completedVisits: number;
  isFullyCompleted: boolean;
  hasAnyOperatorNotes: boolean;
  usableForCalibrationAnalysis: boolean;
  severity: string | null;
  reviewStatus: string;
  reviewedAt: string | null;
  reviewReasonTags: string[];
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export function buildDeepCleanAnalyticsExportRows(
  rows: DeepCleanAnalyticsRowDisplay[],
): DeepCleanAnalyticsExportRow[] {
  return rows.map((r) => ({
    bookingId: r.bookingId,
    programId: r.programId,
    programType: r.programType,
    programTypeLabel: r.programTypeLabel,
    estimatedTotalDurationMinutes: r.estimatedTotalDurationMinutes,
    actualTotalDurationMinutes: r.actualTotalDurationMinutes,
    durationVarianceMinutes: r.durationVarianceMinutes,
    durationVariancePercent: r.durationVariancePercent,
    totalVisits: r.totalVisits,
    completedVisits: r.completedVisits,
    isFullyCompleted: r.isFullyCompleted,
    hasAnyOperatorNotes: r.hasAnyOperatorNotes,
    usableForCalibrationAnalysis: r.usableForCalibrationAnalysis,
    severity: r.severity,
    reviewStatus: r.reviewStatus,
    reviewedAt: r.reviewedAt,
    reviewReasonTags: r.reviewReasonTags,
    reviewNote: r.reviewNote,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}
