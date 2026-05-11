import type { EstimateGovernanceSummary } from "../../../modules/estimate/estimate-snapshot-metadata.read";

/**
 * Appended to every row returned by `/api/v1/system/ops/**` drilldown list endpoints.
 * Computed in `buildSystemOpsDrilldownEligibility` (dispatch-ops-eligibility.ts).
 *
 * When estimate snapshots expose governance V1, `governanceSummary` may be present
 * (compact lane derived server-side from snapshot output JSON).
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
  governanceSummary?: EstimateGovernanceSummary | null;
}
