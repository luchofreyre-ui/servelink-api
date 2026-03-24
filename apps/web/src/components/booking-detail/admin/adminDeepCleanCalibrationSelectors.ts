import type { DeepCleanCalibrationAdminDisplay } from "@/types/deepCleanProgram";

/** Flat rows for future CSV / BI export (no raw operator note text). */
export type AdminDeepCleanCalibrationExportRow = {
  scope: "program" | "visit";
  bookingId: string;
  visitNumber: number | null;
  programType: string;
  estimatedDurationMinutes: number | null;
  actualDurationMinutes: number | null;
  durationVarianceMinutes: number | null;
  durationVariancePercent: number | null;
  executionStatus: string | null;
  operatorNotePresent: boolean | null;
  completedAt: string | null;
  isFullyCompleted: boolean | null;
  completedVisits: number | null;
  totalVisits: number | null;
  usableForCalibrationAnalysis: boolean | null;
};

export function buildAdminDeepCleanCalibrationExportRows(args: {
  bookingId: string;
  calibration: DeepCleanCalibrationAdminDisplay;
}): AdminDeepCleanCalibrationExportRow[] {
  const { bookingId, calibration } = args;
  const p = calibration.program;
  const programRow: AdminDeepCleanCalibrationExportRow = {
    scope: "program",
    bookingId,
    visitNumber: null,
    programType: p.programType,
    estimatedDurationMinutes: p.estimatedTotalDurationMinutes,
    actualDurationMinutes: p.actualTotalDurationMinutes,
    durationVarianceMinutes: p.durationVarianceMinutes,
    durationVariancePercent: p.durationVariancePercent,
    executionStatus: null,
    operatorNotePresent: p.hasAnyOperatorNotes,
    completedAt: null,
    isFullyCompleted: p.isFullyCompleted,
    completedVisits: p.completedVisits,
    totalVisits: p.totalVisits,
    usableForCalibrationAnalysis: p.usableForCalibrationAnalysis,
  };
  const visitRows: AdminDeepCleanCalibrationExportRow[] =
    calibration.visits.map((v) => ({
      scope: "visit",
      bookingId,
      visitNumber: v.visitNumber,
      programType: p.programType,
      estimatedDurationMinutes: v.estimatedDurationMinutes,
      actualDurationMinutes: v.actualDurationMinutes,
      durationVarianceMinutes: v.durationVarianceMinutes,
      durationVariancePercent: v.durationVariancePercent,
      executionStatus: v.executionStatus,
      operatorNotePresent: v.hasOperatorNote,
      completedAt: v.completedAt,
      isFullyCompleted: null,
      completedVisits: null,
      totalVisits: null,
      usableForCalibrationAnalysis: null,
    }));
  return [programRow, ...visitRows];
}
