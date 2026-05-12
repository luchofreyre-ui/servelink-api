/** Contract marker embedded in workflow payloads / metadata (increment when semantics change). */
export const WORKFLOW_CONTRACT_VERSION = "workflow_runtime_v1" as const;

/** Phase 13 — approval runtime + governed orchestration adapters (metadata / step results). */
export const WORKFLOW_ENGINE_VERSION = "workflow_engine_phase13_v1" as const;

/** Observe-only workflow: records delivery pipeline outcome for an outbox row — no booking mutations. */
export const WORKFLOW_TYPE_BOOKING_DELIVERY_OBSERVE_V1 =
  "booking_delivery_observe_v1" as const;

export const WORKFLOW_EXECUTION_STATE = {
  PENDING: "pending",
  RUNNING: "running",
  WAITING_APPROVAL: "waiting_approval",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export const WORKFLOW_STEP_STATE = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  SKIPPED: "skipped",
} as const;

export const WORKFLOW_EXECUTION_STAGE = {
  INITIALIZED: "initialized",
  COORDINATOR_STARTED: "coordinator_started",
  PIPELINE_OBSERVED: "pipeline_observed",
  AWAITING_APPROVAL: "awaiting_approval",
  ALL_STEPS_COMPLETED: "all_steps_completed",
  GOVERNANCE_BLOCKED: "governance_blocked",
} as const;

export const WORKFLOW_STEP_TYPE_OBSERVE_DELIVERY_PIPELINE =
  "observe_delivery_pipeline_v1" as const;

/** Non-mutating audit enrichment after pipeline observation. */
export const WORKFLOW_STEP_TYPE_ENRICH_OPERATIONAL_TRACE_V1 =
  "enrich_operational_trace_v1" as const;

/** Human checkpoint — persists `WorkflowApproval` and pauses coordinator until approve/deny. */
export const WORKFLOW_STEP_TYPE_ORCHESTRATION_APPROVAL_GATE_V1 =
  "orchestration_approval_gate_v1" as const;

/** Append-only resolution record after approval (does not mutate bookings directly). */
export const WORKFLOW_STEP_TYPE_RECORD_ORCHESTRATION_APPROVAL_RESOLUTION_V1 =
  "record_orchestration_approval_resolution_v1" as const;

/** Approval row kind — orchestration gate tied to workflow progression. */
export const WORKFLOW_APPROVAL_TYPE_ORCHESTRATION_GATE_V1 =
  "orchestration_gate_v1" as const;

/** Explicit booking transition invoke proposal — approved before guarded adapter runs. */
export const WORKFLOW_APPROVAL_TYPE_BOOKING_TRANSITION_INVOKE_V1 =
  "booking_transition_invoke_v1" as const;

/** Durably persisted approval outcome on `WorkflowApproval`. */
export const WORKFLOW_APPROVAL_RECORD_STATE = {
  PENDING: "pending",
  APPROVED: "approved",
  DENIED: "denied",
  EXPIRED: "expired",
} as const;

export const WORKFLOW_APPROVAL_AUDIT_ACTION = {
  REQUESTED: "requested",
  APPROVED: "approved",
  DENIED: "denied",
  INVOKE_ATTEMPTED: "invoke_attempted",
  INVOKE_COMPLETED: "invoke_completed",
  INVOKE_BLOCKED: "invoke_blocked",
  INVOKE_IDEMPOTENT_REPLAY: "invoke_idempotent_replay",
} as const;

export const WORKFLOW_APPROVAL_STATE = {
  NOT_REQUIRED: "not_required",
  PENDING: "pending",
  APPROVED: "approved",
  DENIED: "denied",
  BLOCKED_GOVERNANCE: "blocked_governance",
} as const;

export const WORKFLOW_GOVERNANCE_OUTCOME_STEP = {
  ALLOWED: "allowed",
  BLOCKED: "blocked",
  DRY_RUN_SIMULATED: "dry_run_simulated",
} as const;
