import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { PrismaService } from "../../prisma";
import {
  WORKFLOW_TIMER_STATE,
  WORKFLOW_TIMER_TYPE,
  WORKFLOW_TIMING_ENGINE_VERSION,
  WORKFLOW_WAIT_CATEGORY,
  WORKFLOW_WAIT_STATE,
  workflowTimerDedupeKeyApprovalExpiryVisibility,
} from "./workflow-timing.constants";

type Db = Prisma.TransactionClient | PrismaService;

@Injectable()
export class WorkflowTimingSchedulerService {
  /**
   * Idempotent: ensures wait row + expiry visibility timer for a pending approval (replay-safe).
   */
  async ensureApprovalWaitStateAndTimer(
    db: Db,
    params: {
      workflowExecutionId: string;
      workflowApprovalId: string;
      expiresAt: Date | null;
    },
  ): Promise<void> {
    const existingWait = await db.workflowWaitState.findFirst({
      where: {
        workflowExecutionId: params.workflowExecutionId,
        waitingOn: params.workflowApprovalId,
      },
    });
    if (!existingWait) {
      await db.workflowWaitState.create({
        data: {
          workflowExecutionId: params.workflowExecutionId,
          waitCategory: WORKFLOW_WAIT_CATEGORY.APPROVAL_PENDING,
          waitState: WORKFLOW_WAIT_STATE.ACTIVE,
          waitingOn: params.workflowApprovalId,
          expiresAt: params.expiresAt,
          payloadJson: {
            timingEngineVersion: WORKFLOW_TIMING_ENGINE_VERSION,
            kind: "approval_pending_wait",
          } as Prisma.InputJsonValue,
        },
      });
    }

    if (!params.expiresAt) {
      return;
    }

    const dedupeKey = workflowTimerDedupeKeyApprovalExpiryVisibility(
      params.workflowApprovalId,
    );

    const existingTimer = await db.workflowTimer.findUnique({
      where: {
        workflowExecutionId_dedupeKey: {
          workflowExecutionId: params.workflowExecutionId,
          dedupeKey,
        },
      },
    });
    if (existingTimer) {
      return;
    }

    await db.workflowTimer.create({
      data: {
        workflowExecutionId: params.workflowExecutionId,
        timerType: WORKFLOW_TIMER_TYPE.APPROVAL_EXPIRATION_VISIBILITY_V1,
        timerState: WORKFLOW_TIMER_STATE.PENDING,
        wakeAt: params.expiresAt,
        dedupeKey,
        payloadJson: {
          workflowApprovalId: params.workflowApprovalId,
          timingEngineVersion: WORKFLOW_TIMING_ENGINE_VERSION,
        } as Prisma.InputJsonValue,
      },
    });
  }

  /** Cancels pending expiry timers and resolves active wait rows when an approval completes. */
  async resolveApprovalWaitAndTimers(
    db: Db,
    params: {
      workflowExecutionId: string;
      workflowApprovalId: string;
    },
  ): Promise<void> {
    const dedupeKey = workflowTimerDedupeKeyApprovalExpiryVisibility(
      params.workflowApprovalId,
    );

    await db.workflowTimer.updateMany({
      where: {
        workflowExecutionId: params.workflowExecutionId,
        dedupeKey,
        timerState: WORKFLOW_TIMER_STATE.PENDING,
      },
      data: {
        timerState: WORKFLOW_TIMER_STATE.CANCELLED,
        metadataJson: {
          cancelledReason: "approval_resolved",
        } as Prisma.InputJsonValue,
      },
    });

    await db.workflowWaitState.updateMany({
      where: {
        workflowExecutionId: params.workflowExecutionId,
        waitingOn: params.workflowApprovalId,
        waitState: WORKFLOW_WAIT_STATE.ACTIVE,
      },
      data: {
        waitState: WORKFLOW_WAIT_STATE.RESOLVED,
        resolvedAt: new Date(),
      },
    });
  }
}
