import { Injectable, Logger } from "@nestjs/common";
import { Prisma, type OperationalOutboxEvent } from "@prisma/client";
import { PrismaService } from "../../prisma";
import {
  WORKFLOW_APPROVAL_STATE,
  WORKFLOW_CONTRACT_VERSION,
  WORKFLOW_ENGINE_VERSION,
  WORKFLOW_EXECUTION_STAGE,
  WORKFLOW_EXECUTION_STATE,
  WORKFLOW_STEP_STATE,
  WORKFLOW_STEP_TYPE_ENRICH_OPERATIONAL_TRACE_V1,
  WORKFLOW_STEP_TYPE_OBSERVE_DELIVERY_PIPELINE,
  WORKFLOW_STEP_TYPE_ORCHESTRATION_APPROVAL_GATE_V1,
  WORKFLOW_STEP_TYPE_RECORD_ORCHESTRATION_APPROVAL_RESOLUTION_V1,
  WORKFLOW_TYPE_BOOKING_DELIVERY_OBSERVE_V1,
} from "./workflow.constants";
import {
  OBSERVE_ONLY_WORKFLOW_CATEGORIES,
  WORKFLOW_GOVERNANCE_VERSION,
} from "./workflow-governance";
import { WorkflowExecutionCoordinatorService } from "./workflow-execution-coordinator.service";
import {
  WORKFLOW_EXECUTION_MODE,
  resolveWorkflowEngineExecutionMode,
} from "./workflow-execution-modes";
import { interpretBookingOutboxForWorkflow } from "./workflow-state.interpreter";

/**
 * Persisted workflow executions — Phase 12 uses governed coordinator + step runners (observe/audit only).
 */
@Injectable()
export class WorkflowExecutionService {
  private readonly log = new Logger(WorkflowExecutionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coordinator: WorkflowExecutionCoordinatorService,
  ) {}

  /**
   * Replay-safe: one workflow execution per `OperationalOutboxEvent` (`triggeringOutboxEventId` unique).
   * Errors are swallowed so delivery commits remain authoritative.
   */
  async recordObserveOnlyFromDeliveredOutbox(
    outboxRow: OperationalOutboxEvent,
    pipelineResult: Record<string, unknown>,
  ): Promise<void> {
    try {
      const existing = await this.prisma.workflowExecution.findUnique({
        where: { triggeringOutboxEventId: outboxRow.id },
        select: { id: true },
      });
      if (existing) {
        return;
      }

      const interpreted = interpretBookingOutboxForWorkflow({
        aggregateType: outboxRow.aggregateType,
        aggregateId: outboxRow.aggregateId,
        correlationId: outboxRow.correlationId,
        eventType: outboxRow.eventType,
        dedupeKey: outboxRow.dedupeKey,
        lifecycleCategory: outboxRow.lifecycleCategory,
        operationalEventCategory: outboxRow.operationalEventCategory,
      });

      const executionMode = resolveWorkflowEngineExecutionMode();

      const wfId = await this.prisma.$transaction(async (tx) => {
        const wf = await tx.workflowExecution.create({
          data: {
            workflowType: WORKFLOW_TYPE_BOOKING_DELIVERY_OBSERVE_V1,
            workflowVersion: 1,
            aggregateType: outboxRow.aggregateType,
            aggregateId: outboxRow.aggregateId,
            correlationId: outboxRow.correlationId,
            triggeringOutboxEventId: outboxRow.id,
            state: WORKFLOW_EXECUTION_STATE.RUNNING,
            executionStage: WORKFLOW_EXECUTION_STAGE.COORDINATOR_STARTED,
            executionMode,
            approvalState: WORKFLOW_APPROVAL_STATE.NOT_REQUIRED,
            payloadJson: interpreted as unknown as Prisma.InputJsonValue,
            metadataJson: {
              governanceVersion: WORKFLOW_GOVERNANCE_VERSION,
              workflowContractVersion: WORKFLOW_CONTRACT_VERSION,
              workflowEngineVersion: WORKFLOW_ENGINE_VERSION,
              observeOnlyCategories: [...OBSERVE_ONLY_WORKFLOW_CATEGORIES],
              note: "Phase13 governed execution — observe runners + optional approval gate + mutation adapters behind explicit approvals.",
            } as Prisma.InputJsonValue,
          },
        });

        await tx.workflowExecutionStep.create({
          data: {
            workflowExecutionId: wf.id,
            stepType: WORKFLOW_STEP_TYPE_OBSERVE_DELIVERY_PIPELINE,
            stepVersion: 1,
            state: WORKFLOW_STEP_STATE.PENDING,
            payloadJson: { pipelineResult } as Prisma.InputJsonValue,
          },
        });

        await tx.workflowExecutionStep.create({
          data: {
            workflowExecutionId: wf.id,
            stepType: WORKFLOW_STEP_TYPE_ENRICH_OPERATIONAL_TRACE_V1,
            stepVersion: 1,
            state: WORKFLOW_STEP_STATE.PENDING,
          },
        });

        if (executionMode === WORKFLOW_EXECUTION_MODE.APPROVAL_REQUIRED) {
          await tx.workflowExecutionStep.create({
            data: {
              workflowExecutionId: wf.id,
              stepType: WORKFLOW_STEP_TYPE_ORCHESTRATION_APPROVAL_GATE_V1,
              stepVersion: 1,
              state: WORKFLOW_STEP_STATE.PENDING,
            },
          });
          await tx.workflowExecutionStep.create({
            data: {
              workflowExecutionId: wf.id,
              stepType:
                WORKFLOW_STEP_TYPE_RECORD_ORCHESTRATION_APPROVAL_RESOLUTION_V1,
              stepVersion: 1,
              state: WORKFLOW_STEP_STATE.PENDING,
            },
          });
        }

        return wf.id;
      });

      await this.coordinator.executeWorkflowUntilComplete(wfId);
    } catch (e: unknown) {
      this.log.warn({
        msg: "WORKFLOW_OBSERVATION_PERSIST_FAILED",
        outboxId: outboxRow.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
}
