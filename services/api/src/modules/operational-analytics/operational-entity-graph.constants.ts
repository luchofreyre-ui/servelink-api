/** Phase 31 — operational entity graph semantics (no autonomous execution). */

export const OPERATIONAL_ENTITY_GRAPH_ENGINE_VERSION =
  "operational_entity_graph_phase31_v1" as const;

export const OPERATIONAL_ENTITY_CATEGORY = {
  COMMAND_SURFACE_ROOT_V1: "command_surface_root_v1",
  WAREHOUSE_BATCH_ANCHOR_V1: "warehouse_batch_anchor_v1",
  ORCHESTRATION_POSTURE_V1: "orchestration_posture_v1",
  APPROVAL_ESCALATION_SURFACE_V1: "approval_escalation_surface_v1",
  WORKFLOW_EXECUTION_OBSERVATION_V1:
    "workflow_execution_observation_v1",
  BALANCING_OBSERVATION_V1: "balancing_observation_v1",
  SIMULATION_LAB_POSTURE_V1: "simulation_lab_posture_v1",
  INTERVENTION_VALIDITY_OBSERVATION_V1:
    "intervention_validity_observation_v1",
  LONGITUDINAL_REPLAY_OBSERVATION_V1:
    "longitudinal_replay_observation_v1",
  OPERATIONAL_INCIDENT_COORDINATION_V1:
    "operational_incident_coordination_v1",
} as const;

export const OPERATIONAL_ENTITY_STATE = {
  OBSERVED_V1: "observed_v1",
} as const;

export const OPERATIONAL_GRAPH_EDGE_CATEGORY = {
  CONTEXTUALIZES_V1: "contextualizes_v1",
  ADMIN_NAVIGATION_HINT_V1: "admin_navigation_hint_v1",
  CORRELATES_WORKFLOW_EXECUTION_V1:
    "correlates_workflow_execution_observation_v1",
  CORRELATES_INCIDENT_COORDINATION_V1:
    "correlates_incident_coordination_observation_v1",
} as const;

export const OPERATIONAL_CHRONOLOGY_CATEGORY = {
  COORDINATION_CONTEXT_OPENED_V1:
    "coordination_context_opened_v1",
  ENTITY_GRAPH_MATERIALIZED_V1:
    "entity_graph_materialized_v1",
  INVESTIGATION_BOUNDARY_DISCLOSED_V1:
    "investigation_boundary_disclosed_v1",
} as const;
