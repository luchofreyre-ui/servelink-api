import {
  WORKFLOW_STEP_TYPE_ENRICH_OPERATIONAL_TRACE_V1,
  WORKFLOW_STEP_TYPE_OBSERVE_DELIVERY_PIPELINE,
  WORKFLOW_STEP_TYPE_ORCHESTRATION_APPROVAL_GATE_V1,
  WORKFLOW_STEP_TYPE_RECORD_ORCHESTRATION_APPROVAL_RESOLUTION_V1,
} from "./workflow.constants";

/**
 * Maps runnable step types to operational capability categories for governance checks.
 */
export function capabilityCategoryForStep(stepType: string): string {
  switch (stepType) {
    case WORKFLOW_STEP_TYPE_OBSERVE_DELIVERY_PIPELINE:
      return "delivery_pipeline_observation";
    case WORKFLOW_STEP_TYPE_ENRICH_OPERATIONAL_TRACE_V1:
      return "operational_audit_trace";
    case WORKFLOW_STEP_TYPE_ORCHESTRATION_APPROVAL_GATE_V1:
    case WORKFLOW_STEP_TYPE_RECORD_ORCHESTRATION_APPROVAL_RESOLUTION_V1:
      return "operational_governance_checkpoint";
    default:
      return "unknown_capability";
  }
}
