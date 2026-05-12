/** Phase 30 — incident coordination semantics (no autonomous resolution). */

export const OPERATIONAL_INCIDENT_ENGINE_VERSION =
  "operational_incident_phase30_v1" as const;

export const OPERATIONAL_INCIDENT_CATEGORY = {
  GOVERNANCE_EXECUTION_PRESSURE_V1:
    "governance_execution_pressure_v1",
  APPROVAL_ESCALATION_PRESSURE_V1:
    "approval_escalation_pressure_v1",
  BALANCING_CONGESTION_PRESSURE_V1:
    "balancing_congestion_pressure_v1",
  DELIVERY_RELIABILITY_PRESSURE_V1:
    "delivery_reliability_pressure_v1",
  SIMULATION_LAB_PRESSURE_V1: "simulation_lab_pressure_v1",
  INTERVENTION_VALIDITY_PRESSURE_V1:
    "intervention_validity_pressure_v1",
  POLICY_SURFACE_PRESSURE_V1: "policy_surface_pressure_v1",
} as const;

export const OPERATIONAL_INCIDENT_STATE = {
  OPEN_COORDINATION_OBSERVATION_V1:
    "open_coordination_observation_v1",
} as const;

export const OPERATIONAL_INCIDENT_SEVERITY = {
  INFO: "info",
  ATTENTION: "attention",
} as const;

/** Drilldown edge taxonomy — routes are disclosed hints only; operators navigate explicitly. */
export const OPERATIONAL_INCIDENT_LINK_TYPE = {
  ADMIN_ROUTE_DRILLDOWN_V1: "admin_route_drilldown_v1",
} as const;

export const OPERATIONAL_INVESTIGATION_TRAIL_CATEGORY = {
  COORDINATION_OPENED_V1: "coordination_opened_v1",
  INVESTIGATION_GRAPH_SNAPSHOT_V1:
    "investigation_graph_snapshot_v1",
} as const;
