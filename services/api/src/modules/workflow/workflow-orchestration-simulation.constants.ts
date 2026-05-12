/** Phase 21 — deterministic orchestration simulation (non-executing). */

export const WORKFLOW_SIMULATION_SCENARIO_CATEGORY = {
  ORCHESTRATION_SAFETY_SNAPSHOT_V1: "orchestration_safety_snapshot_v1",
  ACTIVATION_FOCUS_V1: "activation_focus_v1",
} as const;

export const WORKFLOW_SIMULATION_STATE = {
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const OPERATIONAL_SAFETY_EVALUATION_CATEGORY = {
  WORKFLOW_POSTURE: "workflow_posture",
  ACTIVATION_CHAIN: "activation_chain",
  APPROVAL_INVENTORY: "approval_inventory",
  TIMER_WAIT_PRESSURE: "timer_wait_pressure",
  POLICY_SIGNAL: "policy_signal",
  DELIVERY_MIRROR: "delivery_mirror",
} as const;

/** Deterministic labels — not numeric scores. */
export const OPERATIONAL_SAFETY_SEVERITY = {
  INFO: "info",
  ATTENTION: "attention",
} as const;

export const ORCHESTRATION_SIMULATION_RESULT_VERSION =
  "orchestration_simulation_v1" as const;
