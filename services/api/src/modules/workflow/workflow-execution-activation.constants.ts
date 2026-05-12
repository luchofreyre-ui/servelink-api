/** Phase 20 — guided orchestration activation (non-autonomous). */

export const WORKFLOW_ACTIVATION_CATEGORY = {
  BOOKING_TRANSITION_INVOKE_V1: "booking_transition_invoke_v1",
} as const;

export const WORKFLOW_ACTIVATION_STATE = {
  REGISTERED: "registered",
  APPROVED_FOR_INVOKE: "approved_for_invoke",
  INVOKED: "invoked",
  FAILED: "failed",
  CANCELLED: "cancelled",
  SUPERSEDED: "superseded",
} as const;

/** Must match deterministic digest recommendation id for approved invoke proposals. */
export const WORKFLOW_ACTIVATION_BOOKING_TRANSITION_RECOMMENDATION_KEY =
  "approved_invoke_pending" as const;
