/**
 * Appended to every row returned by `/api/v1/system/ops/**` drilldown list endpoints.
 * Computed in `buildSystemOpsDrilldownEligibility` (dispatch-ops-eligibility.ts).
 */
export interface SystemOpsDrilldownEligibilityFields {
  canReleaseDispatchLock: boolean;
  releaseDispatchLockDisabledReason: string | null;
  canClearReviewRequired: boolean;
  clearReviewRequiredDisabledReason: string | null;
  canTriggerRedispatch: boolean;
  triggerRedispatchDisabledReason: string | null;
  canAssignExceptionToMe: boolean;
  assignExceptionToMeDisabledReason: string | null;
  canResolveException: boolean;
  resolveExceptionDisabledReason: string | null;
}
