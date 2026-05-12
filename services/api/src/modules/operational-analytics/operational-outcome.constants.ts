/** Phase 23 — closed-loop operational intelligence (observe / compare / evaluate only). */

export const OPERATIONAL_OUTCOME_ENGINE_VERSION =
  "operational_outcome_phase23_v1" as const;

export const WORKFLOW_OUTCOME_EVALUATION_CATEGORY = {
  ACTIVATION_POST_INVOKE_POSTURE_V1: "activation_post_invoke_posture_v1",
} as const;

/** Deterministic posture buckets — not rankings or ML labels. */
export const WORKFLOW_OUTCOME_EVALUATION_RESULT = {
  TERMINAL_SUCCESS_V1: "outcome_terminal_success_v1",
  TERMINAL_FAILURE_V1: "outcome_terminal_failure_v1",
  MIDFLIGHT_NEUTRAL_V1: "outcome_midflight_neutral_v1",
  WAITING_HUMAN_V1: "outcome_waiting_human_v1",
  CANCELLED_CONTEXT_V1: "outcome_cancelled_context_v1",
} as const;

export const SIMULATION_ACCURACY_CATEGORY = {
  PREDICTED_VS_LIVE_ATTENTION_EVAL_V1:
    "predicted_vs_live_attention_eval_v1",
} as const;

export const OPERATIONAL_DRIFT_CATEGORY = {
  WAREHOUSE_METRIC_REFRESH_DELTA_V1: "warehouse_metric_refresh_delta_v1",
} as const;

export const OPERATIONAL_OUTCOME_DRIFT_SEVERITY = {
  INFO: "info",
  ATTENTION: "attention",
} as const;
