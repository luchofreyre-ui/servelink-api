/**
 * Phase 17 — deterministic workflow timing identifiers (governed orchestration substrate).
 */

export const WORKFLOW_TIMING_ENGINE_VERSION =
  "workflow_timing_phase17_v1" as const;

export const WORKFLOW_TIMER_TYPE = {
  /** Fires at approval `expiresAt` — visibility / escalation only (no auto-deny). */
  APPROVAL_EXPIRATION_VISIBILITY_V1:
    "approval_expiration_visibility_v1",
} as const;

export const WORKFLOW_TIMER_STATE = {
  PENDING: "pending",
  CANCELLED: "cancelled",
  TRIGGERED: "triggered",
  SUPERSEDED: "superseded",
} as const;

export const WORKFLOW_WAIT_CATEGORY = {
  APPROVAL_PENDING: "approval_pending",
} as const;

export const WORKFLOW_WAIT_STATE = {
  ACTIVE: "active",
  RESOLVED: "resolved",
  /** Timer crossed expiry while approval still pending — operational visibility only. */
  EXPIRED_VISIBILITY: "expired_visibility",
} as const;

export function workflowTimerDedupeKeyApprovalExpiryVisibility(
  workflowApprovalId: string,
): string {
  return `approval_expiry_visibility:${workflowApprovalId}`;
}
