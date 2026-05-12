/** Phase 26 — longitudinal intelligence / replay alignment / counterfactual-safe scaffolding. */

export const OPERATIONAL_LONGITUDINAL_ENGINE_VERSION =
  "operational_longitudinal_phase26_v1" as const;

export const EXPERIMENT_LINEAGE_CATEGORY = {
  CONSECUTIVE_REFRESH_PAIR_V1: "experiment_consecutive_refresh_pair_v1",
} as const;

export const COUNTERFACTUAL_EVALUATION_CATEGORY = {
  REFRESH_CONTRAST_SCAFFOLD_V1:
    "counterfactual_safe_refresh_contrast_scaffold_v1",
} as const;

export const OPERATIONAL_REPLAY_CATEGORY = {
  LAB_RUN_INVENTORY_ALIGNMENT_V1: "lab_run_inventory_alignment_v1",
  BENCHMARK_INVENTORY_ALIGNMENT_V1: "benchmark_inventory_alignment_v1",
} as const;

export const OPERATIONAL_REPLAY_STATE = {
  INVENTORY_ALIGNED_V1: "replay_inventory_aligned_v1",
  INVENTORY_DIVERGENT_V1: "replay_inventory_divergent_v1",
  NO_PRIOR_BATCH_V1: "replay_no_prior_batch_v1",
} as const;
