/**
 * Phase 16 — operational analytics identifiers (deterministic aggregation only).
 */

export const OPERATIONAL_ANALYTICS_ENGINE_VERSION =
  "operational_analytics_phase16_v1" as const;

/** Align analytics snapshots with policy evaluation semantics for audits. */
export const ANALYTICS_POLICY_ENGINE_VERSION_REF =
  "operational_policy_phase15_v1" as const;

export const ANALYTICS_AGGREGATE_TYPE = {
  PLATFORM: "platform",
  BOOKING: "booking",
} as const;

/** Single-row platform scope for global operational metrics. */
export const ANALYTICS_AGGREGATE_ID_GLOBAL = "__global__" as const;

export const ANALYTICS_AGGREGATE_WINDOW = {
  AS_OF_NOW: "as_of_now",
  ROLLING_24H: "rolling_24h",
  ROLLING_7D: "rolling_7d",
} as const;

export const ANALYTICS_METRIC_CATEGORY = {
  ORCHESTRATION: "orchestration",
  GOVERNANCE: "governance",
  APPROVAL: "approval",
  POLICY: "policy",
  DELIVERY: "delivery",
  PAYMENT: "payment",
  RECURRING: "recurring",
  WORKFLOW_STEP: "workflow_step",
} as const;

export const ORCHESTRATION_ANALYTICS_CATEGORY = {
  EXECUTION_POSTURE: "execution_posture",
  PORTFOLIO_SIGNALS: "portfolio_signals",
} as const;

/** Stable metric keys for snapshots (flat warehouse semantics). */
export const ANALYTICS_METRIC_KEY = {
  WORKFLOW_WAITING_APPROVAL: "workflow.waiting_approval.count",
  WORKFLOW_GOVERNANCE_BLOCKED: "workflow.governance_blocked.count",
  WORKFLOW_COMPLETED: "workflow.completed.count",
  WORKFLOW_FAILED: "workflow.failed.count",
  WORKFLOW_RUNNING: "workflow.running.count",
  WORKFLOW_CANCELLED: "workflow.cancelled.count",
  APPROVAL_PENDING: "approval.pending.count",
  ESCALATION_OPEN: "escalation.open.count",
  POLICY_ATTENTION_EVALUATIONS: "policy.attention_evaluations.count",
  DELIVERY_ATTEMPTS_24H: "delivery.attempts_24h.count",
  DELIVERY_SUCCESS_24H: "delivery.success_24h.count",
  PAYMENT_ATTENTION_BOOKINGS: "payment.attention_bookings.count",
  BOOKINGS_WITH_RECURRING_PLAN: "recurring.bookings_with_plan.count",
  WORKFLOW_STEPS_GOVERNANCE_BLOCKED_7D:
    "governance.step_blocked_7d.count",
} as const;

export const ANALYTICS_WORKFLOW_ROLLUP_ALL = "__all_workflows__" as const;
