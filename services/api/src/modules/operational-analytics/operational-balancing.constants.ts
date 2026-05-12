/** Phase 22 — deterministic balancing identifiers (observe/explain only). */

export const OPERATIONAL_BALANCING_ENGINE_VERSION =
  "operational_balancing_phase22_v1" as const;

export const WORKFLOW_CONGESTION_ENGINE_VERSION =
  "workflow_congestion_phase22_v1" as const;

export const OPERATIONAL_BALANCING_GOVERNANCE_VERSION =
  "operational_balancing_governance_phase22_v1" as const;

export const BALANCING_SIGNAL_SEVERITY = {
  INFO: "info",
  ATTENTION: "attention",
} as const;

export const BALANCING_CATEGORY = {
  PORTFOLIO_PRESSURE_V1: "portfolio_pressure_v1",
  GOVERNANCE_SATURATION_V1: "governance_saturation_v1",
  TIMER_WAIT_LOAD_V1: "timer_wait_load_v1",
  DELIVERY_RELIABILITY_V1: "delivery_reliability_v1",
  ACTIVATION_SIMULATION_POSTURE_V1: "activation_simulation_posture_v1",
  DRY_RUN_SIMULATION_FAILURE_DENSITY_V1: "dry_run_simulation_failure_density_v1",
} as const;

export const CONGESTION_CATEGORY = {
  STATE_BACKLOG_V1: "state_backlog_v1",
} as const;
