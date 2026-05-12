/** Phase 32 — operational replay semantics (no autonomous execution). */

export const OPERATIONAL_GRAPH_HISTORY_ENGINE_VERSION =
  "operational_graph_history_phase32_v1" as const;

export const OPERATIONAL_REPLAY_ENGINE_VERSION =
  "operational_replay_phase32_v1" as const;

export const OPERATIONAL_GRAPH_HISTORY_CATEGORY = {
  ENTITY_GRAPH_BATCH_ARCHIVE_V1:
    "entity_graph_batch_archive_v1",
} as const;

export const OPERATIONAL_REPLAY_CATEGORY = {
  WAREHOUSE_REFRESH_BATCH_V1:
    "warehouse_refresh_batch_replay_seed_v1",
} as const;

export const OPERATIONAL_REPLAY_STATE = {
  MATERIALIZED_V1: "materialized_v1",
} as const;

export const OPERATIONAL_REPLAY_FRAME_CATEGORY = {
  GRAPH_RECONSTRUCTION_DIGEST_V1:
    "graph_reconstruction_digest_v1",
  CHRONOLOGY_REPLAY_DIGEST_V1:
    "chronology_replay_digest_v1",
  INVESTIGATION_BOUNDARY_RECALL_V1:
    "investigation_boundary_recall_v1",
} as const;
