/**
 * Assignment Engine v1 — recommendation + scoring (deterministic, no randomness).
 * Geography uses honest placeholders unless real routing exists; never fake mileage in product copy.
 */

export type AssignmentReasonCode =
  | "workload_active_assigned"
  | "workload_in_progress"
  | "same_day_scheduled_load"
  | "current_owner_preference"
  | "placeholder_region_match"
  | "placeholder_service_area_fit"
  | "placeholder_geography_score"
  | "coverage_fit_from_coordinates"
  | "capacity_balance";

export type AssignmentReason = {
  code: AssignmentReasonCode;
  message: string;
};

export type AssignmentWorkloadSnapshot = {
  /** Bookings in `assigned` for this FO (excluding this booking). */
  activeAssignedCount: number;
  /** Bookings in en_route, in_progress, or active (excluding this booking). */
  inProgressPipelineCount: number;
  /** Same calendar day (UTC) as target booking’s scheduled day: accepted/assigned/en_route/in_progress/active. */
  todayScheduledCount: number;
};

export type AssignmentCandidate = {
  foUserId: string;
  foId: string;
  displayName: string;
  workload: AssignmentWorkloadSnapshot;
  /** 0–100 — higher is more capacity headroom (inverse of penalized load). */
  capacityScore: number;
  /** 0–1 placeholder until region directory exists. */
  regionMatchScore: number;
  /** 0–1 placeholder or derived from coordinate band when lat/lng exist (not travel time). */
  serviceAreaFitScore: number;
  /** 0–1 honest placeholder when no geo; otherwise normalized distance band. */
  geographyPlaceholderScore: number;
  finalRecommendationScore: number;
  reasons: AssignmentReason[];
};

export type AssignmentRecommendation = {
  rank: number;
  recommended: boolean;
  candidate: AssignmentCandidate;
};

export type BookingAssignedEventPayload = {
  kind: "booking_assigned";
  assignmentSource: "manual" | "recommended";
  actorUserId: string;
  actorRole: string;
  selectedFoId: string;
  recommendationSummary: Record<string, unknown> | null;
};
