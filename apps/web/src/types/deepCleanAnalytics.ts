/** Query + response shapes for GET /api/v1/admin/deep-clean/analytics */

export type DeepCleanAnalyticsSortByApi =
  | "variance_minutes_desc"
  | "variance_minutes_asc"
  | "variance_percent_desc"
  | "variance_percent_asc"
  | "createdAt_desc";

export type DeepCleanAnalyticsQueryParamsApi = {
  usableOnly?: boolean;
  withOperatorNotesOnly?: boolean;
  fullyCompletedOnly?: boolean;
  programType?: "single_visit" | "three_visit";
  sortBy?: DeepCleanAnalyticsSortByApi;
  limit?: number;
  reviewStatus?: "reviewed" | "unreviewed";
  reasonTag?: string;
};

export type UpdateDeepCleanCalibrationReviewRequestApi = {
  reviewStatus: "unreviewed" | "reviewed";
  reviewReasonTags?: string[];
  reviewNote?: string | null;
};

export type DeepCleanCalibrationReviewUpdatedResponseApi = {
  kind: "deep_clean_calibration_review_updated";
  row: DeepCleanAnalyticsRowApi;
};

export type DeepCleanAnalyticsSummaryApi = {
  totalProgramCalibrations: number;
  usableProgramCalibrations: number;
  fullyCompletedPrograms: number;
  programsWithOperatorNotes: number;
  averageVarianceMinutes: number | null;
  averageVariancePercent: number | null;
  averageEstimatedTotalDurationMinutes: number | null;
  averageActualTotalDurationMinutes: number | null;
};

export type DeepCleanAnalyticsRowApi = {
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

export type DeepCleanAnalyticsResponseApi = {
  kind: "deep_clean_analytics";
  summary: DeepCleanAnalyticsSummaryApi;
  rows: DeepCleanAnalyticsRowApi[];
};
