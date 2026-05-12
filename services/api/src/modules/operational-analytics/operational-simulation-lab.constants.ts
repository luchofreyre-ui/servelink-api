/** Phase 25 — simulation lab / certification / associative attribution (observe-only). */

export const OPERATIONAL_SIM_LAB_ENGINE_VERSION =
  "operational_sim_lab_phase25_v1" as const;

export const EXPERIMENT_CERTIFICATION_ENGINE_VERSION =
  "experiment_certification_phase25_v1" as const;

export const CAUSAL_ATTRIBUTION_ENGINE_VERSION =
  "causal_attribution_phase25_v1" as const;

export const OPERATIONAL_SIM_LAB_CATEGORY = {
  /** Frames one persisted benchmark row as a reproducible lab observation. */
  BENCHMARK_MULTISCENARIO_FRAME_V1: "benchmark_multiscenario_frame_v1",
} as const;

export const OPERATIONAL_SIM_LAB_STATE = {
  COMPLETED: "completed",
  SKIPPED: "skipped",
} as const;

export const EXPERIMENT_CERTIFICATION_STATE = {
  CERTIFIED_OBSERVATIONAL_V1: "certified_observational_v1",
  REQUIRES_HUMAN_REVIEW_V1: "requires_human_review_v1",
} as const;

/** Associative patterns only — payloads must restate non-causal semantics. */
export const CAUSAL_ATTRIBUTION_CATEGORY = {
  ACTIVATION_SIMULATION_ASSOCIATIVE_V1:
    "activation_simulation_associative_v1",
  WAREHOUSE_DELTA_ACTIVATION_ASSOCIATIVE_V1:
    "warehouse_delta_activation_associative_v1",
} as const;

export const CAUSAL_ATTRIBUTION_RESULT = {
  NO_ASSOCIATIVE_SIGNAL_V1: "no_associative_signal_v1",
  JOINT_ATTENTION_ASSOCIATIVE_V1: "joint_attention_associative_v1",
  METRIC_SHIFT_WITH_ACTIVATION_STRESS_V1:
    "metric_shift_with_activation_stress_v1",
} as const;
