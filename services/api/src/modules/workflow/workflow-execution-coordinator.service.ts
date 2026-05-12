import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import type { WorkflowExecutionMode } from "./workflow-execution-modes";
import { WorkflowGovernanceExecutionGuard } from "./workflow-governance-execution.guard";
import { WorkflowStepRunnerRegistry } from "./workflow-step-runner.registry";
import type { WorkflowStepRunContext } from "./workflow-step-execution.contract";
import { OperationalPolicyEvaluationService } from "./operational-policy-evaluation.service";
import {
  WORKFLOW_APPROVAL_STATE,
  WORKFLOW_ENGINE_VERSION,
  WORKFLOW_EXECUTION_STAGE,
  WORKFLOW_EXECUTION_STATE,
  WORKFLOW_GOVERNANCE_OUTCOME_STEP,
  WORKFLOW_STEP_STATE,
} from "./workflow.constants";

const MAX_ENGINE_STEPS_PER_RUN = 32;

function truncateMessage(e: unknown, max: number): string {
  const s = e instanceof Error ? e.message : String(e ?? "unknown");
  return s.length <= max ? s : s.slice(0, max);
}

/**
 * Deterministic step dispatcher — guarded transitions, replay-safe pending-step ordering.
 */
@Injectable()
export class WorkflowExecutionCoordinatorService {
  private readonly log = new Logger(WorkflowExecutionCoordinatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: WorkflowStepRunnerRegistry,
    private readonly governance: WorkflowGovernanceExecutionGuard,
    private readonly operationalPolicy: OperationalPolicyEvaluationService,
  ) {}

  async executeWorkflowUntilComplete(executionId: string): Promise<void> {
    try {
      for (let i = 0; i < MAX_ENGINE_STEPS_PER_RUN; i++) {
        const wf = await this.prisma.workflowExecution.findUnique({
          where: { id: executionId },
        });
        if (!wf) return;

        if (
          wf.state === WORKFLOW_EXECUTION_STATE.COMPLETED ||
          wf.state === WORKFLOW_EXECUTION_STATE.FAILED ||
          wf.state === WORKFLOW_EXECUTION_STATE.CANCELLED
        ) {
          return;
        }

        if (wf.state === WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL) {
          await this.persistOperationalPolicySnapshot(executionId);
          return;
        }

        const pending = await this.prisma.workflowExecutionStep.findFirst({
          where: {
            workflowExecutionId: executionId,
            state: WORKFLOW_STEP_STATE.PENDING,
          },
          orderBy: { createdAt: "asc" },
        });

        if (!pending) {
          await this.prisma.workflowExecution.update({
            where: { id: executionId },
            data: {
              state: WORKFLOW_EXECUTION_STATE.COMPLETED,
              executionStage: WORKFLOW_EXECUTION_STAGE.ALL_STEPS_COMPLETED,
              completedAt: new Date(),
              approvalState:
                wf.approvalState ?? WORKFLOW_APPROVAL_STATE.NOT_REQUIRED,
            },
          });
          await this.persistOperationalPolicySnapshot(executionId);
          return;
        }

        const mode = wf.executionMode as WorkflowExecutionMode;

        const guardResult = this.governance.evaluate({
          mode,
          stepType: pending.stepType,
          approvalState: wf.approvalState,
        });

        if (!guardResult.ok) {
          await this.prisma.workflowExecutionStep.update({
            where: { id: pending.id },
            data: {
              state: WORKFLOW_STEP_STATE.FAILED,
              failedAt: new Date(),
              governanceOutcome: WORKFLOW_GOVERNANCE_OUTCOME_STEP.BLOCKED,
              runnerKey: "governance_guard",
              resultJson: {
                reason: guardResult.reason ?? "governance_blocked",
                workflowEngineVersion: WORKFLOW_ENGINE_VERSION,
              } as Prisma.InputJsonValue,
            },
          });
          await this.prisma.workflowExecution.update({
            where: { id: executionId },
            data: {
              state: WORKFLOW_EXECUTION_STATE.FAILED,
              executionStage: WORKFLOW_EXECUTION_STAGE.GOVERNANCE_BLOCKED,
              failedAt: new Date(),
              failureReason: `GOVERNANCE_BLOCK:${guardResult.reason ?? "blocked"}`,
              approvalState: WORKFLOW_APPROVAL_STATE.BLOCKED_GOVERNANCE,
            },
          });
          await this.persistOperationalPolicySnapshot(executionId);
          return;
        }

        const runner = this.registry.resolve(pending.stepType, pending.stepVersion);
        if (!runner) {
          await this.failStepAndWorkflow(
            pending.id,
            executionId,
            "runner_not_registered",
          );
          return;
        }

        const dryRun = this.governance.isDryRunMode(mode);

        await this.prisma.workflowExecutionStep.update({
          where: { id: pending.id },
          data: {
            state: WORKFLOW_STEP_STATE.RUNNING,
            startedAt: new Date(),
            runnerKey: runner.runnerKey,
            governanceOutcome: guardResult.outcome,
          },
        });

        await this.prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            executionStage: `running_step:${pending.stepType}`,
          },
        });

        const ctx: WorkflowStepRunContext = {
          executionId,
          stepId: pending.id,
          aggregateType: wf.aggregateType,
          aggregateId: wf.aggregateId,
          correlationId: wf.correlationId,
          executionPayloadJson: wf.payloadJson,
          stepPayloadJson: pending.payloadJson,
          executionMode: mode,
          dryRun,
        };

        let stepOutcome;
        try {
          stepOutcome = await runner.run(ctx);
        } catch (err: unknown) {
          const msg = truncateMessage(err, 500);
          await this.prisma.workflowExecutionStep.update({
            where: { id: pending.id },
            data: {
              state: WORKFLOW_STEP_STATE.FAILED,
              failedAt: new Date(),
              resultJson: { error: msg } as Prisma.InputJsonValue,
            },
          });
          await this.prisma.workflowExecution.update({
            where: { id: executionId },
            data: {
              state: WORKFLOW_EXECUTION_STATE.FAILED,
              failedAt: new Date(),
              failureReason: msg,
            },
          });
          await this.persistOperationalPolicySnapshot(executionId);
          return;
        }

        await this.prisma.workflowExecutionStep.update({
          where: { id: pending.id },
          data: {
            state: stepOutcome.success
              ? WORKFLOW_STEP_STATE.COMPLETED
              : WORKFLOW_STEP_STATE.FAILED,
            completedAt: stepOutcome.success ? new Date() : undefined,
            failedAt: stepOutcome.success ? undefined : new Date(),
            resultJson: stepOutcome.resultJson as Prisma.InputJsonValue,
            governanceOutcome:
              stepOutcome.governanceOutcome ?? guardResult.outcome,
          },
        });

        if (!stepOutcome.success) {
          await this.prisma.workflowExecution.update({
            where: { id: executionId },
            data: {
              state: WORKFLOW_EXECUTION_STATE.FAILED,
              failedAt: new Date(),
              failureReason: String(
                (stepOutcome.resultJson as { error?: unknown }).error ??
                  "step_failed",
              ),
            },
          });
          await this.persistOperationalPolicySnapshot(executionId);
          return;
        }

        await this.prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            executionStage: `step_completed:${pending.stepType}`,
          },
        });
      }

      await this.prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          state: WORKFLOW_EXECUTION_STATE.FAILED,
          failedAt: new Date(),
          failureReason: "WORKFLOW_ENGINE_STEP_LIMIT_EXCEEDED",
        },
      });
      await this.persistOperationalPolicySnapshot(executionId);
    } catch (e: unknown) {
      this.log.error({
        msg: "WORKFLOW_COORDINATOR_FATAL",
        executionId,
        error: truncateMessage(e, 500),
      });
      await this.prisma.workflowExecution
        .update({
          where: { id: executionId },
          data: {
            state: WORKFLOW_EXECUTION_STATE.FAILED,
            failedAt: new Date(),
            failureReason: truncateMessage(e, 500),
          },
        })
        .catch(() => undefined);
      await this.persistOperationalPolicySnapshot(executionId);
    }
  }

  private async persistOperationalPolicySnapshot(
    executionId: string,
  ): Promise<void> {
    try {
      await this.operationalPolicy.persistSnapshot(executionId);
    } catch (err: unknown) {
      this.log.warn({
        msg: "OPERATIONAL_POLICY_SNAPSHOT_COORDINATOR_FAILED",
        executionId,
        error: truncateMessage(err, 300),
      });
    }
  }

  private async failStepAndWorkflow(
    stepId: string,
    executionId: string,
    reason: string,
  ): Promise<void> {
    await this.prisma.workflowExecutionStep.update({
      where: { id: stepId },
      data: {
        state: WORKFLOW_STEP_STATE.FAILED,
        failedAt: new Date(),
        governanceOutcome: WORKFLOW_GOVERNANCE_OUTCOME_STEP.BLOCKED,
        resultJson: { reason } as Prisma.InputJsonValue,
      },
    });
    await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        state: WORKFLOW_EXECUTION_STATE.FAILED,
        failedAt: new Date(),
        failureReason: reason,
      },
    });
    await this.persistOperationalPolicySnapshot(executionId);
  }
}
