/** Phase 24 — governed benchmarking / experimentation (observe / compare / evaluate only). */

export const WORKFLOW_BENCHMARK_ENGINE_VERSION =
  "workflow_benchmark_phase24_v1" as const;

export const OPERATIONAL_EXPERIMENT_ENGINE_VERSION =
  "operational_experiment_phase24_v1" as const;

export const WORKFLOW_BENCHMARK_CATEGORY = {
  SIMULATION_ATTENTION_ALIGNMENT_BENCHMARK_V1:
    "simulation_attention_alignment_benchmark_v1",
} as const;

export const WORKFLOW_BENCHMARK_STATE = {
  COMPLETED: "completed",
  SKIPPED: "skipped",
} as const;

export const OPERATIONAL_EXPERIMENT_CATEGORY = {
  PORTFOLIO_BENCHMARK_DIGEST_V1: "portfolio_benchmark_digest_v1",
  ORCHESTRATION_METRIC_EXPERIMENT_V1:
    "orchestration_metric_experiment_v1",
} as const;

/** Deterministic experiment posture labels — not ML verdicts. */
export const OPERATIONAL_EXPERIMENT_EVALUATION_RESULT = {
  INFO_POSTURE_V1: "experiment_info_posture_v1",
  ATTENTION_POSTURE_V1: "experiment_attention_posture_v1",
  NEUTRAL_BASELINE_V1: "experiment_neutral_baseline_v1",
} as const;
