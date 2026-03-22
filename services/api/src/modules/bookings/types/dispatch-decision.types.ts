import {
  BookingStatus,
  DispatchCandidateReasonCode,
  DispatchCandidateStatus,
  DispatchDecisionStatus,
  Prisma,
} from "@prisma/client";

export type DispatchDecisionTrigger =
  | "initial_dispatch"
  | "redispatch_offer_expired"
  | "redispatch_assigned_start_sla"
  | "redispatch_manual"
  | "redispatch_system"
  | "replay"
  | "other";

export type DispatchDecisionCandidateInput = {
  franchiseOwnerId: string;
  candidateStatus: DispatchCandidateStatus;

  baseRank?: number | null;
  finalRank?: number | null;

  baseScore?: Prisma.Decimal | number | string | null;
  finalScore?: Prisma.Decimal | number | string | null;
  distanceMiles?: Prisma.Decimal | number | string | null;

  foLoad?: number | null;

  acceptanceRate?: Prisma.Decimal | number | string | null;
  completionRate?: Prisma.Decimal | number | string | null;
  cancellationRate?: Prisma.Decimal | number | string | null;

  acceptancePenalty?: Prisma.Decimal | number | string | null;
  completionPenalty?: Prisma.Decimal | number | string | null;
  cancellationPenalty?: Prisma.Decimal | number | string | null;
  loadPenalty?: Prisma.Decimal | number | string | null;
  reliabilityBonus?: Prisma.Decimal | number | string | null;
  finalPenalty?: Prisma.Decimal | number | string | null;

  reasonCode?: DispatchCandidateReasonCode | null;
  reasonDetail?: string | null;

  eligibilitySnapshot?: Prisma.InputJsonValue | null;
  scoreBreakdown?: Prisma.InputJsonValue | null;
};

export type RecordDispatchDecisionInput = {
  bookingId: string;
  bookingEventId?: string | null;

  trigger: DispatchDecisionTrigger;
  triggerDetail?: string | null;

  redispatchSequence?: number;
  decisionStatus: DispatchDecisionStatus;

  selectedFranchiseOwnerId?: string | null;
  selectedRank?: number | null;
  selectedScore?: Prisma.Decimal | number | string | null;

  scoringVersion: string;

  idempotencyKey?: string | null;
  correlationKey?: string | null;

  bookingStatusAtDecision?: BookingStatus | null;
  scheduledStart?: Date | string | null;
  estimatedDurationMin?: number | null;

  bookingSnapshot: Prisma.InputJsonValue;
  decisionMeta?: Prisma.InputJsonValue | null;

  candidates: DispatchDecisionCandidateInput[];
};
