/**
 * UI-facing deep clean program shape. Populated from booking screen / public
 * confirmation API via mappers — components must not depend on raw API JSON.
 */

export type DeepCleanProgramTaskDisplay = {
  taskId: string;
  label: string;
  description: string | null;
  category: string | null;
  effortClass: string | null;
  tags: string[];
};

export type DeepCleanProgramVisitDisplay = {
  visitNumber: number;
  label: string;
  description: string | null;
  priceCents: number;
  taskBundleId: string | null;
  taskBundleLabel: string | null;
  tasks: DeepCleanProgramTaskDisplay[];
};

export type DeepCleanProgramDisplay = {
  programId: string;
  programType: "single_visit" | "three_visit";
  title: string;
  description: string | null;
  totalPriceCents: number;
  visits: DeepCleanProgramVisitDisplay[];
};

/** Execution read model from GET .../screen (authenticated). */
export type BookingScreenDeepCleanExecutionVisitApi = {
  visitNumber: number;
  status: "not_started" | "in_progress" | "completed";
  startedAt: string | null;
  completedAt: string | null;
  actualDurationMinutes: number | null;
  operatorNote: string | null;
};

export type BookingScreenDeepCleanExecutionApi = {
  programStatus: "not_started" | "in_progress" | "completed";
  completedVisits: number;
  totalVisits: number;
  visits: BookingScreenDeepCleanExecutionVisitApi[];
};

export type DeepCleanExecutionVisitDisplay = {
  visitNumber: number;
  programLabel: string;
  programDescription: string | null;
  taskBundleLabel: string | null;
  tasks: DeepCleanProgramTaskDisplay[];
  status: "not_started" | "in_progress" | "completed";
  startedAt: string | null;
  completedAt: string | null;
  actualDurationMinutes: number | null;
  operatorNote: string | null;
};

export type DeepCleanExecutionDisplay = {
  programStatus: "not_started" | "in_progress" | "completed";
  completedVisits: number;
  totalVisits: number;
  visits: DeepCleanExecutionVisitDisplay[];
};

/** Customer-safe execution visit: no operator notes; duration only after completion. */
export type DeepCleanExecutionVisitCustomerDisplay = Omit<
  DeepCleanExecutionVisitDisplay,
  "operatorNote"
>;

export type DeepCleanExecutionCustomerDisplay = {
  programStatus: "not_started" | "in_progress" | "completed";
  completedVisits: number;
  totalVisits: number;
  visits: DeepCleanExecutionVisitCustomerDisplay[];
};

/** Admin inspection uses full execution row incl. operator notes. */
export type DeepCleanExecutionAdminDisplay = DeepCleanExecutionDisplay;

/** Calibration read model from GET .../screen (admin inspection). */
export type BookingScreenDeepCleanCalibrationVisitApi = {
  visitNumber: number;
  estimatedDurationMinutes: number;
  actualDurationMinutes: number | null;
  durationVarianceMinutes: number | null;
  durationVariancePercent: number | null;
  executionStatus: "not_started" | "in_progress" | "completed";
  hasOperatorNote: boolean;
  completedAt: string | null;
};

export type BookingScreenDeepCleanCalibrationProgramApi = {
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

export type BookingScreenDeepCleanCalibrationApi = {
  program: BookingScreenDeepCleanCalibrationProgramApi;
  visits: BookingScreenDeepCleanCalibrationVisitApi[];
};

export type DeepCleanCalibrationVisitAdminDisplay =
  BookingScreenDeepCleanCalibrationVisitApi;

export type DeepCleanCalibrationProgramAdminDisplay =
  BookingScreenDeepCleanCalibrationProgramApi;

export type DeepCleanCalibrationAdminDisplay = {
  program: DeepCleanCalibrationProgramAdminDisplay;
  visits: DeepCleanCalibrationVisitAdminDisplay[];
};

/** Raw API fragment from GET .../screen or public confirmation (stable contract). */
export type BookingScreenDeepCleanProgramApi = {
  programId: string;
  programType: "single_visit" | "three_visit";
  label: string;
  description: string | null;
  totalPriceCents: number;
  visits: Array<{
    visitNumber: number;
    label: string;
    description: string | null;
    priceCents: number;
    taskBundleId: string | null;
    taskBundleLabel: string | null;
    tasks: DeepCleanProgramTaskDisplay[];
  }>;
};
