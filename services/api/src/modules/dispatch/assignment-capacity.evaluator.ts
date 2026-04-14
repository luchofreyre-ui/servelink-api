import {
  ASSIGNMENT_REASON_CODES,
  type AssignmentConstraintSet,
  type AssignmentDecisionStatus,
  type CapacityEvaluationResult,
} from "./assignment-capacity.contract";

export type AvailableCleanerRow = {
  cleanerId: string;
  cleanerLabel: string;
  isActive?: boolean;
  supportsRecurring?: boolean;
};

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
 * When `availableCleaners` is omitted, roster-based checks are skipped (intake bridge default)
 * except where explicit cleaner id matching requires a roster.
 */
export function evaluateAssignmentCapacity(input: {
  constraints: AssignmentConstraintSet;
  availableCleaners?: AvailableCleanerRow[];
  recurringContext?: {
    priorCleanerId?: string | null;
    priorCleanerLabel?: string | null;
  };
}): CapacityEvaluationResult {
  const { constraints, availableCleaners, recurringContext } = input;
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

  const rosterDefined = availableCleaners !== undefined;
  const rosterEmpty = rosterDefined && availableCleaners.length === 0;
  if (rosterEmpty) {
    pushCode(ASSIGNMENT_REASON_CODES.CAPACITY_UNKNOWN);
    status = worse(status, "needs_review");
  }

  const cleaners = rosterDefined ? availableCleaners! : null;

  const findCleaner = (id: string | null | undefined) => {
    if (!id?.trim() || !cleaners) return undefined;
    return cleaners.find(
      (c) =>
        c.cleanerId === id.trim() &&
        (c.isActive === undefined || c.isActive !== false),
    );
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

  if (
    status === "assignable" &&
    sched.mode === "preference_only" &&
    hasSchedulingIntent
  ) {
    notesForOps.push(
      "Preference-only scheduling: exact slot enforcement is not active for this evaluation pass.",
    );
  }

  const result: CapacityEvaluationResult = {
    status,
    reasonCodes,
    notesForOps: notesForOps.length ? notesForOps : undefined,
  };
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
