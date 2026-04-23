export type DispatchCandidate = {
  providerId: string;
  providerType: string;
  providerStatus: string;
  providerUserId: string;

  foId: string | null;
  foStatus: string | null;

  displayName: string | null;
  photoUrl: string | null;
  bio: string | null;

  yearsExperience: number | null;
  completedJobsCount: number | null;
  teamSize: number | null;

  providerReliabilityScore: number;
  foReliabilityScore: number;
  travelMinutes: number;
  baseRank: number;

  acceptanceRate: number;
  completionRate: number;
  cancellationRate: number;
  activeAssignedCount: number;
  activeInProgressCount: number;

  canReceiveDispatch: boolean;
  ineligibilityReasons: string[];
};

export type DispatchCandidateInput = {
  lat: number;
  lng: number;
  squareFootage: number;
  estimatedLaborMinutes: number;
  recommendedTeamSize: number;
  /** Defaults when omitted — matches public booking / estimator defaults. */
  serviceType?: string;
  serviceSegment?: "residential" | "commercial";
  limit?: number;
};

export type RankedDispatchCandidate = DispatchCandidate & {
  acceptancePenalty: number;
  completionPenalty: number;
  cancellationPenalty: number;
  loadPenalty: number;
  reliabilityBonus: number;
  dispatchPenalty: number;
  effectiveRank: number;
};
