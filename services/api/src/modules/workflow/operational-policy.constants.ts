/**
 * Phase 15 — deterministic operational policy layer (no autonomous mutation authority).
 */

export const OPERATIONAL_POLICY_ENGINE_VERSION =
  "operational_policy_phase15_v1" as const;

export const POLICY_CATEGORY = {
  WORKFLOW_POSTURE: "workflow_posture",
  GOVERNANCE: "governance",
  APPROVAL_HYGIENE: "approval_hygiene",
  ESCALATION_SIGNAL: "escalation_signal",
} as const;

export const POLICY_EVALUATION_RESULT = {
  PASS: "pass",
  INFO: "info",
  ATTENTION: "attention",
  BLOCKED_SIGNAL: "blocked_signal",
} as const;

export const POLICY_SEVERITY = {
  NONE: "none",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

/** Stable keys for upsert + observability — deterministic rule identifiers. */
export const POLICY_KEY = {
  WORKFLOW_WAITING_APPROVAL: "workflow.waiting_on_approval",
  WORKFLOW_GOVERNANCE_BLOCKED: "workflow.governance_blocked",
  WORKFLOW_STEP_FAILURE: "workflow.step_failure_non_governance",
  WORKFLOW_COMPLETED_OBSERVE: "workflow.completed_observe_trail",
  APPROVAL_PENDING_TTL_PRESSURE: "approval.pending_ttl_pressure",
  APPROVAL_BOOKING_INVOKE_STALE: "approval.booking_transition_invoke_not_invoked",
  EXECUTION_MODE_APPROVAL_REQUIRED_ACTIVE: "workflow.mode.approval_required_active",
} as const;

export const APPROVAL_ESCALATION_CATEGORY = {
  OPERATOR_REVIEW: "operator_review",
  SLA_RISK: "sla_risk",
  CUSTOMER_VISIBLE_DELAY: "customer_visible_delay",
  OTHER: "other",
} as const;

export const ESCALATION_STATE = {
  OPEN: "open",
  ACKNOWLEDGED: "acknowledged",
  RESOLVED: "resolved",
} as const;
