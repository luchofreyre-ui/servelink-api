/**
 * Canonical execution contract: booking intent → assignment constraints → capacity evaluation.
 * Human narrative: `apps/web/src/lib/booking/BOOKING_PRODUCT_TRUTH.md` (assignment / capacity section).
 */

export type SchedulingConstraintMode = "preference_only" | "slot_selection";

export type CleanerPreferenceMode = "none" | "preferred_cleaner";

export type AssignmentDecisionStatus =
  | "assignable"
  | "needs_review"
  | "deferred"
  | "unassignable";

export type AssignmentConstraintSet = {
  bookingId?: string | null;
  intakeId?: string | null;

  scheduling: {
    mode: SchedulingConstraintMode;
    preferredTime?: string | null;
    preferredDayWindow?: string | null;
    flexibilityNotes?: string | null;
    selectedSlotId?: string | null;
    selectedSlotLabel?: string | null;
    selectedSlotFoId?: string | null;
    selectedSlotWindowStart?: string | null;
    selectedSlotWindowEnd?: string | null;
    selectedSlotDate?: string | null;
    holdId?: string | null;
    holdExpiresAt?: string | null;
    slotHoldConfirmed?: boolean;
    selectedSlotSource?: "preferred_provider" | "candidate_provider";
    selectedSlotProviderLabel?: string | null;
  };

  cleanerPreference: {
    mode: CleanerPreferenceMode;
    cleanerId?: string | null;
    cleanerLabel?: string | null;
    hardRequirement?: boolean;
    notes?: string | null;
  };

  recurring: {
    pathKind: "one_time" | "recurring";
    cadence?: string | null;
    authRequiredAtConfirm?: boolean;
  };
};

import type {
  RankedCandidatePersistence,
  RecommendationConfidence,
} from "./provider-ranking.contract";

export type CapacityEvaluationResult = {
  status: AssignmentDecisionStatus;
  reasonCodes: string[];
  recommendedCleanerId?: string | null;
  recommendedCleanerLabel?: string | null;
  matchedPreferredCleaner?: boolean;
  recurringContinuityCandidate?: boolean;
  notesForOps?: string[];
  /** How strong the recommendation is; may force `needs_review` when low. */
  recommendationConfidence?: RecommendationConfidence;
  /** Short operator-readable lines (also mirrored in admin UI). */
  recommendationReasonSummary?: string[];
  /** Top ranked candidates (bounded); see `PROVIDER_RANKING_PERSIST_TOP_N`. */
  rankedCandidates?: RankedCandidatePersistence[];
};

export const ASSIGNMENT_REASON_CODES = {
  MISSING_SCHEDULING_INTENT: "missing_scheduling_intent",
  PREFERRED_CLEANER_UNAVAILABLE: "preferred_cleaner_unavailable",
  HARD_CLEANER_REQUIREMENT_UNMET: "hard_cleaner_requirement_unmet",
  RECURRING_CONTINUITY_UNAVAILABLE: "recurring_continuity_unavailable",
  CAPACITY_UNKNOWN: "capacity_unknown",
  SLOT_NOT_ENFORCEABLE_YET: "slot_not_enforceable_yet",
  SELECTED_SLOT_PROVIDER_NOT_ON_ROSTER: "selected_slot_provider_not_on_roster",
  SELECTED_SLOT_VS_HARD_PREFERRED_CLEANER_CONFLICT:
    "selected_slot_vs_hard_preferred_cleaner_conflict",
  MANUAL_REVIEW_REQUIRED: "manual_review_required",
  LOW_RANKING_CONFIDENCE: "low_ranking_confidence",
} as const;

export type AssignmentReasonCode =
  (typeof ASSIGNMENT_REASON_CODES)[keyof typeof ASSIGNMENT_REASON_CODES];
