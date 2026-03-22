export type DispatchExplainerCandidateDto = {
  providerId: string | null;
  foId: string | null;
  baseRank: number | null;
  effectiveRank: number | null;
  selected: boolean;
  excluded: boolean;
  exclusionReason: string | null;
  factors: {
    loadPenalty: number;
    acceptancePenalty: number;
    completionPenalty: number;
    cancellationPenalty: number;
    reliabilityBonus: number;
    responseSpeedAdjustment: number;
    multiPassPenalty: number;
  };
  explanation: string[];
};

export type DispatchExplainerResponseDto = {
  booking: {
    id: string;
    status: string;
    scheduledStart: string | null;
    foId: string | null;
  };
  scoringVersion: string;
  configVersion: number | null;
  selectedCandidateId: string | null;
  selectedFoId: string | null;
  dispatchSequence: number | null;
  trigger: string | null;
  summary: string;
  candidates: DispatchExplainerCandidateDto[];
  notes: string[];
};
