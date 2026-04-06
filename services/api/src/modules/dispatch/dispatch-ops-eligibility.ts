import type { DispatchExceptionActionStatus } from "@prisma/client";
import { BookingStatus } from "@prisma/client";
import type { SystemOpsDrilldownEligibilityFields } from "../../common/reliability/dto/system-ops-drilldown.dto";
import {
  isAssignedState,
  isInvalidAssignmentState,
} from "../bookings/utils/assignment-state.util";
import { canTransitionExceptionStatus } from "./dispatch-exception-action-status.util";

export type BookingOpsEligibility = Pick<
  SystemOpsDrilldownEligibilityFields,
  | "canReleaseDispatchLock"
  | "releaseDispatchLockDisabledReason"
  | "canClearReviewRequired"
  | "clearReviewRequiredDisabledReason"
  | "canTriggerRedispatch"
  | "triggerRedispatchDisabledReason"
>;

export type ExceptionOpsEligibility = Pick<
  SystemOpsDrilldownEligibilityFields,
  | "canAssignExceptionToMe"
  | "assignExceptionToMeDisabledReason"
  | "canResolveException"
  | "resolveExceptionDisabledReason"
>;

const bookingShape = (booking: {
  foId: string | null;
  status: BookingStatus;
  dispatchLockedAt: Date | null;
}) => ({
  foId: booking.foId,
  status: booking.status,
});

/**
 * Same preconditions as `DispatchOpsService` (dispatch/dispatch-ops.service.ts)
 * releaseDispatchLock / clearReviewRequired / triggerRedispatch.
 */
export function evaluateBookingOpsEligibility(
  booking: {
    foId: string | null;
    status: BookingStatus;
    dispatchLockedAt: Date | null;
  },
  control: { reviewRequired: boolean } | null | undefined,
): BookingOpsEligibility {
  const b = bookingShape(booking);

  const canReleaseDispatchLock = Boolean(booking.dispatchLockedAt);
  const releaseDispatchLockDisabledReason = canReleaseDispatchLock
    ? null
    : "dispatch_not_locked";

  let canClearReviewRequired = false;
  let clearReviewRequiredDisabledReason: string | null =
    "review_not_required";
  if (isInvalidAssignmentState(b)) {
    clearReviewRequiredDisabledReason = "invalid_assignment_state";
  } else if (!control?.reviewRequired) {
    clearReviewRequiredDisabledReason = "review_not_required";
  } else {
    canClearReviewRequired = true;
    clearReviewRequiredDisabledReason = null;
  }

  let canTriggerRedispatch = false;
  let triggerRedispatchDisabledReason: string | null = "unknown";
  if (isInvalidAssignmentState(b)) {
    triggerRedispatchDisabledReason = "invalid_assignment_state";
  } else if (isAssignedState(b)) {
    triggerRedispatchDisabledReason = "already_assigned";
  } else {
    canTriggerRedispatch = true;
    triggerRedispatchDisabledReason = null;
  }

  return {
    canReleaseDispatchLock,
    releaseDispatchLockDisabledReason,
    canClearReviewRequired,
    clearReviewRequiredDisabledReason,
    canTriggerRedispatch,
    triggerRedispatchDisabledReason,
  };
}

/**
 * Preconditions for system-ops exception POSTs that delegate to
 * `DispatchExceptionActionsService.assignToMe` / `updateStatus(..., resolved)`.
 * Resolve eligibility uses `canTransitionExceptionStatus` (same graph as
 * `assertTransitionAllowed`).
 */
export function evaluateExceptionOpsEligibility(
  action: { status: DispatchExceptionActionStatus } | null,
): ExceptionOpsEligibility {
  if (!action) {
    return {
      canAssignExceptionToMe: false,
      assignExceptionToMeDisabledReason: "exception_action_not_found",
      canResolveException: false,
      resolveExceptionDisabledReason: "exception_action_not_found",
    };
  }

  const canAssignExceptionToMe = true;
  const assignExceptionToMeDisabledReason: string | null = null;

  const canResolveException = canTransitionExceptionStatus(
    action.status,
    "resolved",
  );
  const resolveExceptionDisabledReason = canResolveException
    ? null
    : action.status === "resolved"
      ? "exception_already_resolved"
      : "exception_invalid_transition";

  return {
    canAssignExceptionToMe,
    assignExceptionToMeDisabledReason,
    canResolveException,
    resolveExceptionDisabledReason,
  };
}

/**
 * Authoritative eligibility object for every system-ops drilldown row.
 */
export function buildSystemOpsDrilldownEligibility(
  booking: {
    foId: string | null;
    status: BookingStatus;
    dispatchLockedAt: Date | null;
  },
  control: { reviewRequired: boolean } | null | undefined,
  exceptionAction: { status: DispatchExceptionActionStatus } | null,
): SystemOpsDrilldownEligibilityFields {
  return {
    ...evaluateBookingOpsEligibility(booking, control),
    ...evaluateExceptionOpsEligibility(exceptionAction),
  };
}
