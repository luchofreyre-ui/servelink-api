import {
  ASSIGNMENT_REASON_CODES,
  type AssignmentConstraintSet,
  type AssignmentDecisionStatus,
  type CapacityEvaluationResult,
} from "./assignment-capacity.contract";
import {
  buildRecommendationReasonSummary,
  deriveRecommendationConfidence,
  rankProviderCandidates,
  toRankedCandidatesPersistence,
  type RankProviderAvailableCleaner,
} from "./provider-ranking.service";

export type AvailableCleanerRow = RankProviderAvailableCleaner;

function statusRank(s: AssignmentDecisionStatus): number {
  switch (s) {
    case "assignable":
      return 0;
    case "needs_review":
      return 1;
    case "deferred":
      return 2;
    case "unassignable":
      return 3;
    default:
      return 0;
  }
}

function worse(
  a: AssignmentDecisionStatus,
  b: AssignmentDecisionStatus,
): AssignmentDecisionStatus {
  return statusRank(a) >= statusRank(b) ? a : b;
}

/**
 * First-pass deterministic capacity / assignment outcome from constraints.
 * Provider recommendation uses scored ranking (`rankProviderCandidates`) instead of raw id order.
 */
export function evaluateAssignmentCapacity(input: {
  constraints: AssignmentConstraintSet;
  availableCleaners?: AvailableCleanerRow[];
  recurringContext?: {
    priorCleanerId?: string | null;
    priorCleanerLabel?: string | null;
  };
  /** Optional ZIP5 when booking/intake exposes it; otherwise ranking skips service-area match. */
  intentServiceZip5?: string | null;
}): CapacityEvaluationResult {
  const { constraints, availableCleaners, recurringContext, intentServiceZip5 } =
    input;
  const reasonCodes: string[] = [];
  const notesForOps: string[] = [];
  let status: AssignmentDecisionStatus = "assignable";
  let recommendedCleanerId: string | null | undefined;
  let recommendedCleanerLabel: string | null | undefined;
  let matchedPreferredCleaner = false;
  let recurringContinuityCandidate = false;

  const pushCode = (code: string) => {
    if (!reasonCodes.includes(code)) reasonCodes.push(code);
  };

  const sched = constraints.scheduling;
  const hasSchedulingIntent =
    Boolean(sched.preferredTime?.trim()) ||
    Boolean(sched.preferredDayWindow?.trim()) ||
    Boolean(sched.flexibilityNotes?.trim()) ||
    Boolean(sched.selectedSlotId?.trim()) ||
    Boolean(sched.selectedSlotLabel?.trim());

  if (!hasSchedulingIntent) {
    pushCode(ASSIGNMENT_REASON_CODES.MISSING_SCHEDULING_INTENT);
    pushCode(ASSIGNMENT_REASON_CODES.MANUAL_REVIEW_REQUIRED);
    status = worse(status, "needs_review");
  }

  if (sched.mode === "slot_selection" && sched.selectedSlotId?.trim()) {
    pushCode(ASSIGNMENT_REASON_CODES.SLOT_NOT_ENFORCEABLE_YET);
    pushCode(ASSIGNMENT_REASON_CODES.MANUAL_REVIEW_REQUIRED);
    notesForOps.push(
      "slot_selection with selectedSlotId: platform cannot yet verify which franchise owner holds that slot — manual review.",
    );
    status = worse(status, "needs_review");
  }

  const rosterDefined = availableCleaners !== undefined;
  const rosterEmpty = rosterDefined && availableCleaners.length === 0;
  if (rosterEmpty) {
    pushCode(ASSIGNMENT_REASON_CODES.CAPACITY_UNKNOWN);
    pushCode(ASSIGNMENT_REASON_CODES.MANUAL_REVIEW_REQUIRED);
    notesForOps.push(
      "No active franchise owners with linked providers matched the roster query — capacity unknown.",
    );
    status = worse(status, "needs_review");
  }

  const cleaners = rosterDefined ? availableCleaners! : null;

  const findCleaner = (id: string | null | undefined) => {
    if (!id?.trim() || !cleaners) return undefined;
    const t = id.trim();
    return cleaners.find((c) => {
      const active = c.isActive === undefined || c.isActive !== false;
      if (!active) return false;
      if (c.cleanerId === t) return true;
      if (c.providerId != null && c.providerId.trim() === t) return true;
      return false;
    });
  };

  const cp = constraints.cleanerPreference;
  if (cp.mode === "preferred_cleaner") {
    if (!cleaners) {
      pushCode(ASSIGNMENT_REASON_CODES.MANUAL_REVIEW_REQUIRED);
      status = worse(status, "needs_review");
    } else if (cp.cleanerId?.trim()) {
      const found = findCleaner(cp.cleanerId);
      if (found) {
        recommendedCleanerId = found.cleanerId;
        recommendedCleanerLabel = found.cleanerLabel;
        matchedPreferredCleaner = true;
      } else if (cp.hardRequirement === true) {
        pushCode(ASSIGNMENT_REASON_CODES.HARD_CLEANER_REQUIREMENT_UNMET);
        status = worse(status, "deferred");
      } else {
        pushCode(ASSIGNMENT_REASON_CODES.PREFERRED_CLEANER_UNAVAILABLE);
        pushCode(ASSIGNMENT_REASON_CODES.MANUAL_REVIEW_REQUIRED);
        status = worse(status, "needs_review");
      }
    } else {
      pushCode(ASSIGNMENT_REASON_CODES.PREFERRED_CLEANER_UNAVAILABLE);
      pushCode(ASSIGNMENT_REASON_CODES.MANUAL_REVIEW_REQUIRED);
      status = worse(status, "needs_review");
    }
  }

  if (
    constraints.recurring.pathKind === "recurring" &&
    recurringContext?.priorCleanerId?.trim()
  ) {
    if (!cleaners) {
      pushCode(ASSIGNMENT_REASON_CODES.RECURRING_CONTINUITY_UNAVAILABLE);
      status = worse(status, "needs_review");
    } else {
      const prior = findCleaner(recurringContext.priorCleanerId);
      if (prior) {
        recurringContinuityCandidate = true;
        if (!recommendedCleanerId) {
          recommendedCleanerId = prior.cleanerId;
          recommendedCleanerLabel = prior.cleanerLabel;
        }
      } else {
        pushCode(ASSIGNMENT_REASON_CODES.RECURRING_CONTINUITY_UNAVAILABLE);
        status = worse(status, "needs_review");
      }
    }
  }

  const ranked =
    cleaners && cleaners.length > 0
      ? rankProviderCandidates({
          constraints,
          availableCleaners: cleaners,
          recurringContext,
          intentServiceZip5: intentServiceZip5 ?? null,
        })
      : [];

  const rankedPersist = ranked.length ? toRankedCandidatesPersistence(ranked) : undefined;

  if (
    status === "assignable" &&
    sched.mode === "preference_only" &&
    hasSchedulingIntent &&
    cleaners &&
    cleaners.length > 0 &&
    cp.mode === "none" &&
    !recommendedCleanerId
  ) {
    const top = ranked[0];
    if (top) {
      recommendedCleanerId = top.cleanerId;
      recommendedCleanerLabel = top.cleanerLabel;
      notesForOps.push(
        "No explicit cleaner preference; recommendation is top scored roster candidate (deterministic ranking — not a guaranteed dispatch assignment).",
      );
    }
  }

  if (
    status === "assignable" &&
    sched.mode === "preference_only" &&
    hasSchedulingIntent
  ) {
    notesForOps.push(
      "Preference-only scheduling: exact slot enforcement is not active for this evaluation pass.",
    );
  }

  const topRanked = ranked[0];
  const recommendationConfidence = deriveRecommendationConfidence({
    matchedPreferredCleaner,
    recurringContinuityCandidate,
    topRanked,
  });

  const recommendationReasonSummary = buildRecommendationReasonSummary({
    confidence: recommendationConfidence,
    matchedPreferredCleaner,
    recurringContinuityCandidate,
    topRanked,
  });

  if (
    status === "assignable" &&
    recommendedCleanerId &&
    !matchedPreferredCleaner &&
    !recurringContinuityCandidate &&
    recommendationConfidence === "low"
  ) {
    pushCode(ASSIGNMENT_REASON_CODES.LOW_RANKING_CONFIDENCE);
    pushCode(ASSIGNMENT_REASON_CODES.MANUAL_REVIEW_REQUIRED);
    status = worse(status, "needs_review");
    recommendedCleanerId = undefined;
    recommendedCleanerLabel = undefined;
    notesForOps.push(
      "Ranking confidence is low (thin roster signals only); forcing needs_review instead of a hard assignable recommendation.",
    );
  }

  const result: CapacityEvaluationResult = {
    status,
    reasonCodes,
    notesForOps: notesForOps.length ? notesForOps : undefined,
    recommendationConfidence,
    recommendationReasonSummary,
  };

  if (rankedPersist?.length) {
    result.rankedCandidates = rankedPersist;
  }

  if (matchedPreferredCleaner) {
    result.matchedPreferredCleaner = true;
  }
  if (recurringContinuityCandidate) {
    result.recurringContinuityCandidate = true;
  }
  if (recommendedCleanerId != null && recommendedCleanerId !== "") {
    result.recommendedCleanerId = recommendedCleanerId;
    result.recommendedCleanerLabel = recommendedCleanerLabel ?? null;
  }
  return result;
}
