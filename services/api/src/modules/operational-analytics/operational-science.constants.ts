/** Phase 27 — deterministic cohort + sandbox semantics (observe / simulate / compare only). */

export const OPERATIONAL_COHORT_ENGINE_VERSION =
  "operational_cohort_phase27_v1" as const;

export const OPERATIONAL_INTERVENTION_SANDBOX_ENGINE_VERSION =
  "operational_intervention_sandbox_phase27_v1" as const;

export const INTERVENTION_EVALUATION_ENGINE_VERSION =
  "intervention_evaluation_phase27_v1" as const;

export const OPERATIONAL_COHORT_CATEGORY = {
  WORKFLOW_OUTCOME_DISTRIBUTION_V1: "workflow_outcome_distribution_v1",
  BALANCING_SEVERITY_PROFILE_V1: "balancing_severity_profile_v1",
  REPLAY_ALIGNMENT_MIRROR_V1: "replay_alignment_mirror_v1",
} as const;

export const OPERATIONAL_INTERVENTION_SANDBOX_CATEGORY = {
  ACTIVATION_INTERVENTION_OBSERVATION_FRAME_V1:
    "activation_intervention_observation_frame_v1",
} as const;

export const OPERATIONAL_INTERVENTION_SANDBOX_STATE = {
  SANDBOX_OBSERVATION_COMPLETE_V1: "sandbox_observation_complete_v1",
} as const;

export const INTERVENTION_EVALUATION_CATEGORY = {
  OUTCOME_FAILURE_SHARE_V1: "outcome_failure_share_v1",
  SANDBOX_FRAME_INVENTORY_V1: "sandbox_frame_inventory_v1",
} as const;

export const INTERVENTION_EVALUATION_RESULT = {
  COHORT_BASELINE_NOMINAL_V1: "cohort_baseline_nominal_v1",
  COHORT_BASELINE_ATTENTION_V1: "cohort_baseline_attention_v1",
  SANDBOX_INVENTORY_SPARSE_V1: "sandbox_inventory_sparse_v1",
  SANDBOX_INVENTORY_NOMINAL_V1: "sandbox_inventory_nominal_v1",
  SANDBOX_INVENTORY_DENSE_V1: "sandbox_inventory_dense_v1",
} as const;
