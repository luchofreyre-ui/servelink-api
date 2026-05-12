/** Phase 28 — intervention assignment + holdout semantics (labels only; no autonomous optimization). */

export const OPERATIONAL_INTERVENTION_ASSIGNMENT_ENGINE_VERSION =
  "operational_intervention_assignment_phase28_v1" as const;

export const OPERATIONAL_VALIDITY_CERT_ENGINE_VERSION =
  "operational_validity_cert_phase28_v1" as const;

export const CONTROL_COHORT_ENGINE_VERSION = "control_cohort_phase28_v1" as const;

export const INTERVENTION_ASSIGNMENT_CATEGORY = {
  DETERMINISTIC_PARTITION_FROM_SANDBOX_V1:
    "deterministic_partition_from_sandbox_v1",
} as const;

export const INTERVENTION_COHORT_TYPE = {
  CONTROL_HOLDOUT_V1: "control_holdout_v1",
  INTERVENTION_MIRROR_V1: "intervention_mirror_v1",
} as const;

export const INTERVENTION_ASSIGNMENT_STATE = {
  CLASSIFIED_OBSERVATION_ONLY_V1: "classified_observation_only_v1",
} as const;

export const CONTROL_COHORT_CATEGORY = {
  CONTROL_HOLDOUT_INVENTORY_V1: "control_holdout_inventory_v1",
  INTERVENTION_MIRROR_INVENTORY_V1: "intervention_mirror_inventory_v1",
} as const;

export const VALIDITY_CERTIFICATION_CATEGORY = {
  ASSIGNMENT_BALANCE_V1: "assignment_balance_v1",
  REPRODUCIBILITY_MANIFEST_V1: "reproducibility_manifest_v1",
} as const;

export const VALIDITY_CERTIFICATION_STATE = {
  VALID_V1: "valid_v1",
  ATTENTION_SKEW_V1: "attention_skew_v1",
  INSUFFICIENT_SAMPLE_V1: "insufficient_sample_v1",
  MANIFEST_COMPLETE_V1: "manifest_complete_v1",
} as const;
