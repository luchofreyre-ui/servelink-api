import { Injectable } from "@nestjs/common";
import {
  WORKFLOW_ENGINE_VERSION,
  WORKFLOW_GOVERNANCE_OUTCOME_STEP,
  WORKFLOW_STEP_TYPE_OBSERVE_DELIVERY_PIPELINE,
} from "../workflow.constants";
import type {
  WorkflowStepRunContext,
  WorkflowStepRunResult,
  WorkflowStepRunner,
} from "../workflow-step-execution.contract";

@Injectable()
export class ObserveDeliveryPipelineRunner implements WorkflowStepRunner {
  readonly runnerKey = "observe_delivery_pipeline_v1";
  readonly stepType = WORKFLOW_STEP_TYPE_OBSERVE_DELIVERY_PIPELINE;
  readonly stepVersion = 1;

  async run(ctx: WorkflowStepRunContext): Promise<WorkflowStepRunResult> {
    const payload = ctx.stepPayloadJson as { pipelineResult?: unknown } | null;
    const pipelineResult = payload?.pipelineResult ?? null;

    const governanceOutcome = ctx.dryRun
      ? WORKFLOW_GOVERNANCE_OUTCOME_STEP.DRY_RUN_SIMULATED
      : WORKFLOW_GOVERNANCE_OUTCOME_STEP.ALLOWED;

    return {
      success: true,
      resultJson: {
        workflowEngineVersion: WORKFLOW_ENGINE_VERSION,
        observed: true,
        pipelineResultSummary:
          pipelineResult != null ? JSON.stringify(pipelineResult).slice(0, 4000) : null,
        dryRun: ctx.dryRun,
      },
      governanceOutcome,
    };
  }
}
