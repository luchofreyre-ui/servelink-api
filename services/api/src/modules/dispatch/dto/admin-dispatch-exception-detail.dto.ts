export type AdminDispatchOperatorNoteDto = {
  id: string;
  bookingId: string;
  adminUserId: string | null;
  note: string;
  createdAt: string;
};

export type AdminDispatchExceptionDetailDto = {
  bookingId: string;
  bookingStatus: string | null;
  scheduledStart: string | null;
  estimatedDurationMin: number | null;

  latestDecisionStatus: string | null;
  latestTrigger: string | null;
  latestTriggerDetail: string | null;
  latestCreatedAt: string | null;

  totalDispatchPasses: number;
  selectedDecisionCount: number;
  noCandidatesCount: number;
  allExcludedCount: number;

  exceptionReasons: string[];
  latestSelectedFranchiseOwnerId: string | null;

  hasManualIntervention: boolean;
  latestManualActionAt: string | null;
  latestManualActionBy: string | null;

  notes: AdminDispatchOperatorNoteDto[];

  decisions: Array<{
    id: string;
    dispatchSequence: number;
    redispatchSequence: number;
    trigger: string;
    triggerDetail: string | null;
    decisionStatus: string;
    selectedFranchiseOwnerId: string | null;
    selectedRank: number | null;
    selectedScore: string | null;
    scoringVersion: string;
    bookingEventId: string | null;
    idempotencyKey: string | null;
    correlationKey: string | null;
    bookingStatusAtDecision: string | null;
    scheduledStart: string | null;
    estimatedDurationMin: number | null;
    bookingSnapshot: unknown;
    decisionMeta: unknown;
    createdAt: string;
    candidates: Array<{
      id: string;
      franchiseOwnerId: string;
      candidateStatus: string;
      baseRank: number | null;
      finalRank: number | null;
      baseScore: string | null;
      finalScore: string | null;
      distanceMiles: string | null;
      foLoad: number | null;
      acceptanceRate: string | null;
      completionRate: string | null;
      cancellationRate: string | null;
      acceptancePenalty: string | null;
      completionPenalty: string | null;
      cancellationPenalty: string | null;
      loadPenalty: string | null;
      reliabilityBonus: string | null;
      finalPenalty: string | null;
      reasonCode: string | null;
      reasonDetail: string | null;
      eligibilitySnapshot: unknown;
      scoreBreakdown: unknown;
      createdAt: string;
    }>;
  }>;
};
