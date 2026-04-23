export type PublicBookingWindow = {
  foId: string;
  foDisplayName: string | null;
  startAt: string;
  endAt: string;
};

export type PublicBookingCrewCapacityMeta = {
  requiredLaborMinutes: number;
  recommendedCrewSize: number | null;
  assignedCrewSize: number;
  serviceMaxCrewSize: number;
  serviceSegment: "residential" | "commercial";
};

/** Ranked team option for public Step 3 (max 2–3 by service type). */
export type PublicBookingTeamOption = {
  id: string;
  displayName: string;
  shortLabel?: string;
  isRecommended?: boolean;
  assignedCrewSize?: number;
  estimatedDurationMinutes?: number;
  crewCapacityMeta?: PublicBookingCrewCapacityMeta;
};

/** Selected team on slot availability responses — extends identity with crew metadata. */
export type PublicBookingSelectedTeam = {
  id: string;
  displayName: string;
  assignedCrewSize?: number;
  estimatedDurationMinutes?: number;
  crewCapacityMeta?: PublicBookingCrewCapacityMeta;
};

export type PublicBookingUnavailableReason = {
  code: string;
  message: string;
};
