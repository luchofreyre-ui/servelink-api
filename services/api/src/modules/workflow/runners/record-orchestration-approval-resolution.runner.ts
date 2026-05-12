import { Injectable } from "@nestjs/common";
import {
  WORKFLOW_ENGINE_VERSION,
  WORKFLOW_GOVERNANCE_OUTCOME_STEP,
  WORKFLOW_STEP_TYPE_RECORD_ORCHESTRATION_APPROVAL_RESOLUTION_V1,
} from "../workflow.constants";
import type {
  WorkflowStepRunContext,
  WorkflowStepRunResult,
  WorkflowStepRunner,
} from "../workflow-step-execution.contract";

@Injectable()
export class RecordOrchestrationApprovalResolutionRunner
  implements WorkflowStepRunner
{
  readonly runnerKey = "record_orchestration_approval_resolution_v1";
  readonly stepType =
    WORKFLOW_STEP_TYPE_RECORD_ORCHESTRATION_APPROVAL_RESOLUTION_V1;
  readonly stepVersion = 1;

  async run(ctx: WorkflowStepRunContext): Promise<WorkflowStepRunResult> {
    const governanceOutcome = ctx.dryRun
      ? WORKFLOW_GOVERNANCE_OUTCOME_STEP.DRY_RUN_SIMULATED
      : WORKFLOW_GOVERNANCE_OUTCOME_STEP.ALLOWED;

    return {
      success: true,
      resultJson: {
        workflowEngineVersion: WORKFLOW_ENGINE_VERSION,
        recordedAt: new Date().toISOString(),
        resolutionPayload: ctx.stepPayloadJson ?? null,
        dryRun: ctx.dryRun,
      },
      governanceOutcome,
    };
  }
}
