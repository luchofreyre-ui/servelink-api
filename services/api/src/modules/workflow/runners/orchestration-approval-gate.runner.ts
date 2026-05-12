import { Injectable } from "@nestjs/common";
import { WORKFLOW_EXECUTION_MODE } from "../workflow-execution-modes";
import {
  WORKFLOW_ENGINE_VERSION,
  WORKFLOW_GOVERNANCE_OUTCOME_STEP,
  WORKFLOW_STEP_TYPE_ORCHESTRATION_APPROVAL_GATE_V1,
} from "../workflow.constants";
import { WorkflowApprovalService } from "../workflow-approval.service";
import type {
  WorkflowStepRunContext,
  WorkflowStepRunResult,
  WorkflowStepRunner,
} from "../workflow-step-execution.contract";

@Injectable()
export class OrchestrationApprovalGateRunner implements WorkflowStepRunner {
  readonly runnerKey = "orchestration_approval_gate_v1";
  readonly stepType = WORKFLOW_STEP_TYPE_ORCHESTRATION_APPROVAL_GATE_V1;
  readonly stepVersion = 1;

  constructor(private readonly approvals: WorkflowApprovalService) {}

  async run(ctx: WorkflowStepRunContext): Promise<WorkflowStepRunResult> {
    if (ctx.executionMode !== WORKFLOW_EXECUTION_MODE.APPROVAL_REQUIRED) {
      return {
        success: true,
        resultJson: {
          skipped: true,
          reason: "execution_mode_not_approval_required",
          workflowEngineVersion: WORKFLOW_ENGINE_VERSION,
        },
        governanceOutcome: WORKFLOW_GOVERNANCE_OUTCOME_STEP.ALLOWED,
      };
    }

    const gate = await this.approvals.ensureOrchestrationGateApproval({
      workflowExecutionId: ctx.executionId,
      aggregateType: ctx.aggregateType,
      aggregateId: ctx.aggregateId,
      correlationId: ctx.correlationId,
      gateStepId: ctx.stepId,
    });

    const governanceOutcome = ctx.dryRun
      ? WORKFLOW_GOVERNANCE_OUTCOME_STEP.DRY_RUN_SIMULATED
      : WORKFLOW_GOVERNANCE_OUTCOME_STEP.ALLOWED;

    return {
      success: true,
      resultJson: {
        workflowApprovalId: gate.workflowApprovalId,
        replayed: gate.replayed,
        workflowEngineVersion: WORKFLOW_ENGINE_VERSION,
        awaitingHumanApproval: true,
      },
      governanceOutcome,
    };
  }
}
