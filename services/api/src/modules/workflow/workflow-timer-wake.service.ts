import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import {
  APPROVAL_ESCALATION_CATEGORY,
  ESCALATION_STATE,
} from "./operational-policy.constants";
import { OperationalPolicyEvaluationService } from "./operational-policy-evaluation.service";
import {
  WORKFLOW_TIMER_STATE,
  WORKFLOW_TIMER_TYPE,
  WORKFLOW_WAIT_STATE,
} from "./workflow-timing.constants";
import { WORKFLOW_APPROVAL_RECORD_STATE } from "./workflow.constants";

/**
 * Processes due workflow timers — observe / record / escalate visibility only (Phase 17).
 */
@Injectable()
export class WorkflowTimerWakeService {
  private readonly log = new Logger(WorkflowTimerWakeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly operationalPolicy: OperationalPolicyEvaluationService,
  ) {}

  async processDueTimers(options?: { limit?: number }): Promise<{
    examined: number;
    triggered: number;
  }> {
    const limit = options?.limit ?? 25;
    const now = new Date();

    const due = await this.prisma.workflowTimer.findMany({
      where: {
        timerState: WORKFLOW_TIMER_STATE.PENDING,
        wakeAt: { lte: now },
      },
      orderBy: { wakeAt: "asc" },
      take: limit,
    });

    let triggered = 0;
    for (const row of due) {
      const ok = await this.processTimerRow(row.id);
      if (ok) triggered += 1;
    }

    return { examined: due.length, triggered };
  }

  /** Claim-and-handle one timer by id (admin process-once path). */
  async processTimerRow(timerId: string): Promise<boolean> {
    const row = await this.prisma.workflowTimer.findUnique({
      where: { id: timerId },
    });
    if (!row || row.timerState !== WORKFLOW_TIMER_STATE.PENDING) {
      return false;
    }

    if (row.timerType === WORKFLOW_TIMER_TYPE.APPROVAL_EXPIRATION_VISIBILITY_V1) {
      await this.handleApprovalExpirationVisibility(row);
      return true;
    }

    this.log.warn({
      msg: "WORKFLOW_TIMER_UNKNOWN_TYPE",
      timerId: row.id,
      timerType: row.timerType,
    });
    return false;
  }

  private async handleApprovalExpirationVisibility(timer: {
    id: string;
    workflowExecutionId: string;
    timerType: string;
    payloadJson: Prisma.JsonValue | null;
  }): Promise<void> {
    const approvalId =
      typeof timer.payloadJson === "object" &&
      timer.payloadJson !== null &&
      "workflowApprovalId" in timer.payloadJson &&
      typeof (timer.payloadJson as { workflowApprovalId?: unknown })
        .workflowApprovalId === "string"
        ? (timer.payloadJson as { workflowApprovalId: string }).workflowApprovalId
        : null;

    if (!approvalId) {
      await this.prisma.workflowTimer.updateMany({
        where: {
          id: timer.id,
          timerState: WORKFLOW_TIMER_STATE.PENDING,
        },
        data: {
          timerState: WORKFLOW_TIMER_STATE.TRIGGERED,
          triggeredAt: new Date(),
          metadataJson: {
            noopReason: "missing_workflowApprovalId_payload",
          } as Prisma.InputJsonValue,
        },
      });
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.workflowTimer.updateMany({
        where: {
          id: timer.id,
          timerState: WORKFLOW_TIMER_STATE.PENDING,
        },
        data: {
          timerState: WORKFLOW_TIMER_STATE.TRIGGERED,
          triggeredAt: new Date(),
        },
      });
      if (claimed.count === 0) {
        return;
      }

      const approval = await tx.workflowApproval.findUnique({
        where: { id: approvalId },
      });

      if (
        !approval ||
        approval.approvalState !== WORKFLOW_APPROVAL_RECORD_STATE.PENDING
      ) {
        await tx.workflowTimer.update({
          where: { id: timer.id },
          data: {
            metadataJson: {
              noopReason: "approval_not_pending_at_wake",
              approvalState: approval?.approvalState ?? null,
            } as Prisma.InputJsonValue,
          },
        });
        return;
      }

      await tx.workflowWaitState.updateMany({
        where: {
          workflowExecutionId: timer.workflowExecutionId,
          waitingOn: approvalId,
          waitState: WORKFLOW_WAIT_STATE.ACTIVE,
        },
        data: {
          waitState: WORKFLOW_WAIT_STATE.EXPIRED_VISIBILITY,
          payloadJson: {
            via: "approval_expiration_visibility_timer",
            timerId: timer.id,
            observedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      const existingEscalation =
        await tx.workflowApprovalEscalation.findFirst({
          where: {
            workflowApprovalId: approvalId,
            escalationCategory: APPROVAL_ESCALATION_CATEGORY.SLA_RISK,
            escalationState: ESCALATION_STATE.OPEN,
          },
        });

      if (!existingEscalation) {
        await tx.workflowApprovalEscalation.create({
          data: {
            workflowApprovalId: approvalId,
            escalationCategory: APPROVAL_ESCALATION_CATEGORY.SLA_RISK,
            escalationState: ESCALATION_STATE.OPEN,
            triggeredByUserId: null,
            payloadJson: {
              via: "workflow_timer_wake_phase17",
              timerId: timer.id,
              semantics: "approval_expired_visibility_not_auto_denied",
            } as Prisma.InputJsonValue,
          },
        });
      }

      await tx.workflowTimer.update({
        where: { id: timer.id },
        data: {
          metadataJson: {
            handled: "approval_expiration_visibility",
            workflowApprovalId: approvalId,
          } as Prisma.InputJsonValue,
        },
      });
    });

    try {
      await this.operationalPolicy.persistSnapshot(timer.workflowExecutionId);
    } catch {
      /* best-effort policy refresh after visibility transition */
    }
  }
}
