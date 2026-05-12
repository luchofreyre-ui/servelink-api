import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import {
  WORKFLOW_APPROVAL_AUDIT_ACTION,
  WORKFLOW_APPROVAL_RECORD_STATE,
  WORKFLOW_APPROVAL_STATE,
  WORKFLOW_APPROVAL_TYPE_BOOKING_TRANSITION_INVOKE_V1,
  WORKFLOW_APPROVAL_TYPE_ORCHESTRATION_GATE_V1,
  WORKFLOW_ENGINE_VERSION,
  WORKFLOW_EXECUTION_STAGE,
  WORKFLOW_EXECUTION_STATE,
  WORKFLOW_STEP_STATE,
  WORKFLOW_STEP_TYPE_RECORD_ORCHESTRATION_APPROVAL_RESOLUTION_V1,
} from "./workflow.constants";
import { WorkflowTimingSchedulerService } from "./workflow-timing-scheduler.service";

function defaultExpiryDate(): Date | null {
  const raw = process.env.WORKFLOW_APPROVAL_DEFAULT_EXPIRY_HOURS?.trim();
  const hours = raw ? Number(raw) : 168;
  if (!Number.isFinite(hours) || hours <= 0) {
    return null;
  }
  return new Date(Date.now() + hours * 3_600_000);
}

@Injectable()
export class WorkflowApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly timingScheduler: WorkflowTimingSchedulerService,
  ) {}

  /**
   * Idempotent gate row — replays must not mint duplicate pending approvals for the same execution.
   */
  async ensureOrchestrationGateApproval(params: {
    workflowExecutionId: string;
    aggregateType: string;
    aggregateId: string;
    correlationId: string;
    gateStepId: string;
  }): Promise<{ workflowApprovalId: string; replayed: boolean }> {
    const existing = await this.prisma.workflowApproval.findFirst({
      where: {
        workflowExecutionId: params.workflowExecutionId,
        approvalType: WORKFLOW_APPROVAL_TYPE_ORCHESTRATION_GATE_V1,
        approvalState: WORKFLOW_APPROVAL_RECORD_STATE.PENDING,
      },
      select: { id: true },
    });
    if (existing) {
      const existingFull = await this.prisma.workflowApproval.findUnique({
        where: { id: existing.id },
        select: { id: true, expiresAt: true, workflowExecutionId: true },
      });
      await this.prisma.$transaction(async (tx) => {
        await tx.workflowExecution.update({
          where: { id: params.workflowExecutionId },
          data: {
            state: WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL,
            approvalState: WORKFLOW_APPROVAL_STATE.PENDING,
            executionStage: WORKFLOW_EXECUTION_STAGE.AWAITING_APPROVAL,
          },
        });
        if (existingFull) {
          await this.timingScheduler.ensureApprovalWaitStateAndTimer(tx, {
            workflowExecutionId: params.workflowExecutionId,
            workflowApprovalId: existingFull.id,
            expiresAt: existingFull.expiresAt,
          });
        }
      });
      return { workflowApprovalId: existing.id, replayed: true };
    }

    const expiresAt = defaultExpiryDate();

    return await this.prisma.$transaction(async (tx) => {
      const approval = await tx.workflowApproval.create({
        data: {
          workflowExecutionId: params.workflowExecutionId,
          approvalType: WORKFLOW_APPROVAL_TYPE_ORCHESTRATION_GATE_V1,
          approvalState: WORKFLOW_APPROVAL_RECORD_STATE.PENDING,
          payloadJson: {
            gateKind: "booking_delivery_observe_checkpoint",
            aggregateType: params.aggregateType,
            aggregateId: params.aggregateId,
            correlationId: params.correlationId,
            gateStepId: params.gateStepId,
            workflowEngineVersion: WORKFLOW_ENGINE_VERSION,
          },
          expiresAt,
        },
      });

      await tx.workflowApprovalAudit.create({
        data: {
          workflowApprovalId: approval.id,
          actionType: WORKFLOW_APPROVAL_AUDIT_ACTION.REQUESTED,
          result: WORKFLOW_APPROVAL_RECORD_STATE.PENDING,
          payloadJson: { via: "orchestration_approval_gate_runner" },
        },
      });

      await tx.workflowExecution.update({
        where: { id: params.workflowExecutionId },
        data: {
          state: WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL,
          approvalState: WORKFLOW_APPROVAL_STATE.PENDING,
          executionStage: WORKFLOW_EXECUTION_STAGE.AWAITING_APPROVAL,
        },
      });

      await this.timingScheduler.ensureApprovalWaitStateAndTimer(tx, {
        workflowExecutionId: params.workflowExecutionId,
        workflowApprovalId: approval.id,
        expiresAt: approval.expiresAt,
      });

      return { workflowApprovalId: approval.id, replayed: false };
    });
  }

  async requestBookingTransitionInvokeApproval(params: {
    workflowExecutionId: string;
    bookingId: string;
    transition: string;
    note?: string;
    idempotencyKey?: string | null;
    requestedByUserId: string;
  }): Promise<{ workflowApprovalId: string }> {
    const wf = await this.prisma.workflowExecution.findUnique({
      where: { id: params.workflowExecutionId },
      select: {
        id: true,
        aggregateType: true,
        aggregateId: true,
      },
    });
    if (!wf) {
      throw new NotFoundException("WORKFLOW_EXECUTION_NOT_FOUND");
    }
    if (wf.aggregateType !== "booking" || wf.aggregateId !== params.bookingId) {
      throw new BadRequestException(
        "WORKFLOW_EXECUTION_AGGREGATE_MISMATCH_BOOKING",
      );
    }

    const dedupeKey =
      params.idempotencyKey?.trim() ||
      `${params.bookingId}:${params.transition}:manual`;

    const pendingDupes = await this.prisma.workflowApproval.findMany({
      where: {
        workflowExecutionId: params.workflowExecutionId,
        approvalType: WORKFLOW_APPROVAL_TYPE_BOOKING_TRANSITION_INVOKE_V1,
        approvalState: WORKFLOW_APPROVAL_RECORD_STATE.PENDING,
      },
      select: { id: true, payloadJson: true, expiresAt: true },
    });
    const dup = pendingDupes.find((row) => {
      const pj = row.payloadJson as { idempotencyKey?: string };
      return pj?.idempotencyKey === dedupeKey;
    });
    if (dup) {
      await this.timingScheduler.ensureApprovalWaitStateAndTimer(this.prisma, {
        workflowExecutionId: params.workflowExecutionId,
        workflowApprovalId: dup.id,
        expiresAt: dup.expiresAt,
      });
      return { workflowApprovalId: dup.id };
    }

    const expiresAt = defaultExpiryDate();

    return await this.prisma.$transaction(async (tx) => {
      const approval = await tx.workflowApproval.create({
        data: {
          workflowExecutionId: params.workflowExecutionId,
          approvalType: WORKFLOW_APPROVAL_TYPE_BOOKING_TRANSITION_INVOKE_V1,
          approvalState: WORKFLOW_APPROVAL_RECORD_STATE.PENDING,
          requestedByUserId: params.requestedByUserId,
          payloadJson: {
            bookingId: params.bookingId,
            transition: params.transition,
            note: params.note ?? null,
            idempotencyKey: dedupeKey,
            workflowEngineVersion: WORKFLOW_ENGINE_VERSION,
          },
          expiresAt,
        },
      });

      await tx.workflowApprovalAudit.create({
        data: {
          workflowApprovalId: approval.id,
          actionType: WORKFLOW_APPROVAL_AUDIT_ACTION.REQUESTED,
          actorUserId: params.requestedByUserId,
          result: WORKFLOW_APPROVAL_RECORD_STATE.PENDING,
        },
      });

      await this.timingScheduler.ensureApprovalWaitStateAndTimer(tx, {
        workflowExecutionId: params.workflowExecutionId,
        workflowApprovalId: approval.id,
        expiresAt: approval.expiresAt,
      });

      return { workflowApprovalId: approval.id };
    });
  }

  async approve(params: {
    workflowApprovalId: string;
    actorUserId: string;
  }): Promise<{
    workflowExecutionId: string;
    resumeWorkflowExecution: boolean;
    approvalType: string;
  }> {
    return await this.prisma.$transaction(async (tx) => {
      const row = await tx.workflowApproval.findUnique({
        where: { id: params.workflowApprovalId },
      });
      if (!row) {
        throw new NotFoundException("WORKFLOW_APPROVAL_NOT_FOUND");
      }
      if (row.approvalState !== WORKFLOW_APPROVAL_RECORD_STATE.PENDING) {
        throw new ConflictException("WORKFLOW_APPROVAL_NOT_PENDING");
      }
      if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
        await tx.workflowApproval.update({
          where: { id: row.id },
          data: { approvalState: WORKFLOW_APPROVAL_RECORD_STATE.EXPIRED },
        });
        throw new BadRequestException("WORKFLOW_APPROVAL_EXPIRED");
      }

      await this.timingScheduler.resolveApprovalWaitAndTimers(tx, {
        workflowExecutionId: row.workflowExecutionId,
        workflowApprovalId: row.id,
      });

      await tx.workflowApproval.update({
        where: { id: row.id },
        data: {
          approvalState: WORKFLOW_APPROVAL_RECORD_STATE.APPROVED,
          approvedByUserId: params.actorUserId,
          approvedAt: new Date(),
        },
      });

      await tx.workflowApprovalAudit.create({
        data: {
          workflowApprovalId: row.id,
          actionType: WORKFLOW_APPROVAL_AUDIT_ACTION.APPROVED,
          actorUserId: params.actorUserId,
          result: WORKFLOW_APPROVAL_RECORD_STATE.APPROVED,
        },
      });

      if (row.approvalType === WORKFLOW_APPROVAL_TYPE_ORCHESTRATION_GATE_V1) {
        await tx.workflowExecution.update({
          where: { id: row.workflowExecutionId },
          data: {
            state: WORKFLOW_EXECUTION_STATE.RUNNING,
            approvalState: WORKFLOW_APPROVAL_STATE.APPROVED,
          },
        });

        await tx.workflowExecutionStep.updateMany({
          where: {
            workflowExecutionId: row.workflowExecutionId,
            stepType:
              WORKFLOW_STEP_TYPE_RECORD_ORCHESTRATION_APPROVAL_RESOLUTION_V1,
            state: WORKFLOW_STEP_STATE.PENDING,
          },
          data: {
            payloadJson: {
              workflowApprovalId: row.id,
              approvedByUserId: params.actorUserId,
              approvedAt: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        });

        return {
          workflowExecutionId: row.workflowExecutionId,
          resumeWorkflowExecution: true,
          approvalType: row.approvalType,
        };
      }

      return {
        workflowExecutionId: row.workflowExecutionId,
        resumeWorkflowExecution: false,
        approvalType: row.approvalType,
      };
    });
  }

  async deny(params: {
    workflowApprovalId: string;
    actorUserId: string;
    reason?: string;
  }): Promise<{ workflowExecutionId: string }> {
    return await this.prisma.$transaction(async (tx) => {
      const row = await tx.workflowApproval.findUnique({
        where: { id: params.workflowApprovalId },
      });
      if (!row) {
        throw new NotFoundException("WORKFLOW_APPROVAL_NOT_FOUND");
      }
      if (row.approvalState !== WORKFLOW_APPROVAL_RECORD_STATE.PENDING) {
        throw new ConflictException("WORKFLOW_APPROVAL_NOT_PENDING");
      }

      await this.timingScheduler.resolveApprovalWaitAndTimers(tx, {
        workflowExecutionId: row.workflowExecutionId,
        workflowApprovalId: row.id,
      });

      await tx.workflowApproval.update({
        where: { id: row.id },
        data: {
          approvalState: WORKFLOW_APPROVAL_RECORD_STATE.DENIED,
          deniedByUserId: params.actorUserId,
          deniedAt: new Date(),
        },
      });

      await tx.workflowApprovalAudit.create({
        data: {
          workflowApprovalId: row.id,
          actionType: WORKFLOW_APPROVAL_AUDIT_ACTION.DENIED,
          actorUserId: params.actorUserId,
          result: WORKFLOW_APPROVAL_RECORD_STATE.DENIED,
          payloadJson: params.reason
            ? ({ reason: params.reason } as Prisma.InputJsonValue)
            : undefined,
        },
      });

      if (row.approvalType === WORKFLOW_APPROVAL_TYPE_ORCHESTRATION_GATE_V1) {
        await this.skipPendingResolutionSteps(tx, row.workflowExecutionId);
        await tx.workflowExecution.update({
          where: { id: row.workflowExecutionId },
          data: {
            state: WORKFLOW_EXECUTION_STATE.FAILED,
            failedAt: new Date(),
            failureReason: "APPROVAL_DENIED_ORCHESTRATION_GATE",
            approvalState: WORKFLOW_APPROVAL_STATE.DENIED,
          },
        });
      }

      return { workflowExecutionId: row.workflowExecutionId };
    });
  }

  private async skipPendingResolutionSteps(
    tx: Prisma.TransactionClient,
    workflowExecutionId: string,
  ): Promise<void> {
    await tx.workflowExecutionStep.updateMany({
      where: {
        workflowExecutionId,
        stepType:
          WORKFLOW_STEP_TYPE_RECORD_ORCHESTRATION_APPROVAL_RESOLUTION_V1,
        state: WORKFLOW_STEP_STATE.PENDING,
      },
      data: {
        state: WORKFLOW_STEP_STATE.SKIPPED,
        completedAt: new Date(),
        resultJson: {
          skippedReason: "orchestration_gate_denied",
          workflowEngineVersion: WORKFLOW_ENGINE_VERSION,
        } as Prisma.InputJsonValue,
      },
    });
  }
}
