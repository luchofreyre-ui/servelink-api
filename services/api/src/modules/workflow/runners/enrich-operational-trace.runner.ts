import { Injectable } from "@nestjs/common";
import {
  WORKFLOW_ENGINE_VERSION,
  WORKFLOW_GOVERNANCE_OUTCOME_STEP,
  WORKFLOW_STEP_TYPE_ENRICH_OPERATIONAL_TRACE_V1,
} from "../workflow.constants";
import type {
  WorkflowStepRunContext,
  WorkflowStepRunResult,
  WorkflowStepRunner,
} from "../workflow-step-execution.contract";
import type { WorkflowInterpretationPayload } from "../workflow-state.interpreter";

@Injectable()
export class EnrichOperationalTraceRunner implements WorkflowStepRunner {
  readonly runnerKey = "enrich_operational_trace_v1";
  readonly stepType = WORKFLOW_STEP_TYPE_ENRICH_OPERATIONAL_TRACE_V1;
  readonly stepVersion = 1;

  async run(ctx: WorkflowStepRunContext): Promise<WorkflowStepRunResult> {
    const interpreted = ctx.executionPayloadJson as WorkflowInterpretationPayload;

    const governanceOutcome = ctx.dryRun
      ? WORKFLOW_GOVERNANCE_OUTCOME_STEP.DRY_RUN_SIMULATED
      : WORKFLOW_GOVERNANCE_OUTCOME_STEP.ALLOWED;

    return {
      success: true,
      resultJson: {
        workflowEngineVersion: WORKFLOW_ENGINE_VERSION,
        enrichedAt: new Date().toISOString(),
        operationalSignals: interpreted?.operationalSignals ?? null,
        contractVersion: interpreted?.contractVersion ?? null,
        dryRun: ctx.dryRun,
      },
      governanceOutcome,
    };
  }
}
