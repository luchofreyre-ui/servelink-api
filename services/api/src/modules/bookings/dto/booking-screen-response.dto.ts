/**
 * Typed fragments for `GET /api/v1/bookings/:id/screen` (and aligned public read models).
 * Serialized from persisted `BookingDeepCleanProgram` + scope catalog enrichment.
 */

export type BookingScreenDeepCleanTaskDto = {
  taskId: string;
  label: string;
  description: string | null;
  category: string | null;
  effortClass: string | null;
  tags: string[];
};

export type BookingScreenDeepCleanVisitDto = {
  visitNumber: number;
  label: string;
  description: string | null;
  priceCents: number;
  taskBundleId: string | null;
  taskBundleLabel: string | null;
  tasks: BookingScreenDeepCleanTaskDto[];
};

export type BookingScreenDeepCleanProgramDto = {
  programId: string;
  programType: "single_visit" | "three_visit";
  label: string;
  description: string | null;
  totalPriceCents: number;
  visits: BookingScreenDeepCleanVisitDto[];
};

/** Top-level screen payload includes this key (null when no persisted program row). */
export type BookingScreenDeepCleanField = {
  deepCleanProgram: BookingScreenDeepCleanProgramDto | null;
};

export type BookingScreenDeepCleanExecutionVisitDto = {
  visitNumber: number;
  status: "not_started" | "in_progress" | "completed";
  startedAt: string | null;
  completedAt: string | null;
  actualDurationMinutes: number | null;
  operatorNote: string | null;
};

export type BookingScreenDeepCleanExecutionDto = {
  programStatus: "not_started" | "in_progress" | "completed";
  completedVisits: number;
  totalVisits: number;
  visits: BookingScreenDeepCleanExecutionVisitDto[];
};

export type BookingScreenDeepCleanExecutionField = {
  deepCleanExecution: BookingScreenDeepCleanExecutionDto | null;
};

export type BookingScreenDeepCleanCalibrationVisitDto = {
  visitNumber: number;
  estimatedDurationMinutes: number;
  actualDurationMinutes: number | null;
  durationVarianceMinutes: number | null;
  durationVariancePercent: number | null;
  executionStatus: "not_started" | "in_progress" | "completed";
  hasOperatorNote: boolean;
  completedAt: string | null;
};

export type BookingScreenDeepCleanCalibrationProgramDto = {
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
};

export type BookingScreenDeepCleanCalibrationDto = {
  program: BookingScreenDeepCleanCalibrationProgramDto;
  visits: BookingScreenDeepCleanCalibrationVisitDto[];
};

export type BookingScreenDeepCleanCalibrationField = {
  deepCleanCalibration: BookingScreenDeepCleanCalibrationDto | null;
};
