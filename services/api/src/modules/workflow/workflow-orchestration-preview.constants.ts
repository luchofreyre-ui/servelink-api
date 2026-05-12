/** Phase 19 — orchestration dry-run + recommendation acceptance (non-autonomous). */

export const WORKFLOW_DRY_RUN_PREVIEW_CATEGORY = {
  ORCHESTRATION_SURFACE_ADMIN_V1: "orchestration_surface_admin_v1",
  RECOMMENDATION_IMPACT_V1: "recommendation_impact_v1",
  GOVERNANCE_STEP_SIMULATION_V1: "governance_step_simulation_v1",
} as const;

export const WORKFLOW_DRY_RUN_PREVIEW_STATE = {
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const WORKFLOW_RECOMMENDATION_ACCEPTANCE_STATE = {
  RECORDED: "recorded",
  SUPERSEDED: "superseded",
  REVOKED: "revoked",
} as const;

export const ORCHESTRATION_DRY_RUN_RESULT_VERSION =
  "orchestration_dry_run_v1" as const;
