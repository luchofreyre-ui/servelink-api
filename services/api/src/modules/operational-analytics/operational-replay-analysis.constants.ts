/** Phase 33 — replay analysis semantics (no autonomous optimization). */

export const OPERATIONAL_REPLAY_ANALYSIS_ENGINE_VERSION =
  "operational_replay_analysis_phase33_v1" as const;

export const OPERATIONAL_REPLAY_DIFF_CATEGORY = {
  CONSECUTIVE_WAREHOUSE_BATCH_V1:
    "consecutive_warehouse_batch_graph_diff_v1",
  /** Mega Phase A — arbitrary deterministic pairing (older/newer ordered by batch ISO). */
  EXPLICIT_ADMIN_SELECTED_PAIR_V1:
    "explicit_admin_selected_pair_graph_diff_v1",
} as const;

export const OPERATIONAL_CHRONOLOGY_DELTA_CATEGORY = {
  AGGREGATED_SEQUENCE_COMPARISON_V1:
    "aggregated_chronology_sequence_comparison_v1",
} as const;

export const REPLAY_INTERPRETATION_CATEGORY = {
  DETERMINISTIC_TEMPLATE_NARRATIVE_V1:
    "deterministic_template_narrative_v1",
} as const;
