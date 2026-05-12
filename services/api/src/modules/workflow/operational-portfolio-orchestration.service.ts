import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma";
import {
  WORKFLOW_ACTIVATION_STATE,
} from "./workflow-execution-activation.constants";
import { ESCALATION_STATE } from "./operational-policy.constants";
import {
  WORKFLOW_APPROVAL_RECORD_STATE,
  WORKFLOW_EXECUTION_STAGE,
  WORKFLOW_EXECUTION_STATE,
} from "./workflow.constants";
import {
  WORKFLOW_TIMER_STATE,
  WORKFLOW_WAIT_STATE,
} from "./workflow-timing.constants";
import {
  OPERATIONAL_SAFETY_SEVERITY,
  WORKFLOW_SIMULATION_STATE,
} from "./workflow-orchestration-simulation.constants";
import {
  WORKFLOW_DRY_RUN_PREVIEW_STATE,
} from "./workflow-orchestration-preview.constants";

/** Phase 21 — deterministic orchestration safety pressure mirrors (counts only). */
export type OrchestrationSafetyPortfolioCounts = {
  activationsRegistered: number;
  activationsApprovedForInvoke: number;
  activationsFailed: number;
  dryRunsFailedLast24h: number;
  safetyEvaluationsAttentionLast24h: number;
  simulationsCompletedLast24h: number;
  deliveryAttemptsLast24h: number | null;
  deliverySuccessesLast24h: number | null;
};

/** Phase 18 — extended deterministic portfolio posture (no prioritization). */
export type AdminPortfolioOrchestrationSummary = {
  workflowsWaitingApproval: number;
  workflowsGovernanceBlocked: number;
  pendingApprovals: number;
  openEscalations: number;
  policyAttentionEvaluations: number;
  workflowsRunning: number;
  workflowsPendingState: number;
  waitingApprovalWorkflowsAged24hPlus: number;
  waitingApprovalWorkflowsAged72hPlus: number;
  oldestPendingApprovalRequestedAt: string | null;
  pendingApprovalsAged48hPlus: number;
  openEscalationsAged24hPlus: number;
  pendingWorkflowTimers: number;
  overdueWorkflowTimers: number;
  activeWorkflowWaits: number;
  bookingsWithRecurringPlan: number;
  orchestrationSafety: OrchestrationSafetyPortfolioCounts;
};

export type FoPortfolioOrchestrationSummary = AdminPortfolioOrchestrationSummary;

function emptyOrchestrationSafetyPortfolio(
  includeDeliveryMirror: boolean,
): OrchestrationSafetyPortfolioCounts {
  return {
    activationsRegistered: 0,
    activationsApprovedForInvoke: 0,
    activationsFailed: 0,
    dryRunsFailedLast24h: 0,
    safetyEvaluationsAttentionLast24h: 0,
    simulationsCompletedLast24h: 0,
    deliveryAttemptsLast24h: includeDeliveryMirror ? 0 : null,
    deliverySuccessesLast24h: includeDeliveryMirror ? 0 : null,
  };
}

export function emptyPortfolioOrchestrationSummary(): AdminPortfolioOrchestrationSummary {
  return {
    workflowsWaitingApproval: 0,
    workflowsGovernanceBlocked: 0,
    pendingApprovals: 0,
    openEscalations: 0,
    policyAttentionEvaluations: 0,
    workflowsRunning: 0,
    workflowsPendingState: 0,
    waitingApprovalWorkflowsAged24hPlus: 0,
    waitingApprovalWorkflowsAged72hPlus: 0,
    oldestPendingApprovalRequestedAt: null,
    pendingApprovalsAged48hPlus: 0,
    openEscalationsAged24hPlus: 0,
    pendingWorkflowTimers: 0,
    overdueWorkflowTimers: 0,
    activeWorkflowWaits: 0,
    bookingsWithRecurringPlan: 0,
    orchestrationSafety: emptyOrchestrationSafetyPortfolio(false),
  };
}

@Injectable()
export class OperationalPortfolioOrchestrationService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminPortfolioOrchestrationSummary(): Promise<AdminPortfolioOrchestrationSummary> {
    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const since48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const since72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    const [
      workflowsWaitingApproval,
      workflowsGovernanceBlocked,
      pendingApprovals,
      openEscalations,
      policyAttentionEvaluations,
      workflowsRunning,
      workflowsPendingState,
      waitingApprovalWorkflowsAged24hPlus,
      waitingApprovalWorkflowsAged72hPlus,
      oldestPendingApproval,
      pendingApprovalsAged48hPlus,
      openEscalationsAged24hPlus,
      pendingWorkflowTimers,
      overdueWorkflowTimers,
      activeWorkflowWaits,
      bookingsWithRecurringPlan,
    ] = await Promise.all([
      this.prisma.workflowExecution.count({
        where: { state: WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL },
      }),
      this.prisma.workflowExecution.count({
        where: {
          state: WORKFLOW_EXECUTION_STATE.FAILED,
          executionStage: WORKFLOW_EXECUTION_STAGE.GOVERNANCE_BLOCKED,
        },
      }),
      this.prisma.workflowApproval.count({
        where: { approvalState: WORKFLOW_APPROVAL_RECORD_STATE.PENDING },
      }),
      this.prisma.workflowApprovalEscalation.count({
        where: { escalationState: ESCALATION_STATE.OPEN },
      }),
      this.prisma.operationalPolicyEvaluation.count({
        where: {
          severity: { in: ["medium", "high"] },
          evaluationResult: { not: "pass" },
        },
      }),
      this.prisma.workflowExecution.count({
        where: { state: WORKFLOW_EXECUTION_STATE.RUNNING },
      }),
      this.prisma.workflowExecution.count({
        where: { state: WORKFLOW_EXECUTION_STATE.PENDING },
      }),
      this.prisma.workflowExecution.count({
        where: {
          state: WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL,
          updatedAt: { lt: since24h },
        },
      }),
      this.prisma.workflowExecution.count({
        where: {
          state: WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL,
          updatedAt: { lt: since72h },
        },
      }),
      this.prisma.workflowApproval.findFirst({
        where: { approvalState: WORKFLOW_APPROVAL_RECORD_STATE.PENDING },
        orderBy: { requestedAt: "asc" },
        select: { requestedAt: true },
      }),
      this.prisma.workflowApproval.count({
        where: {
          approvalState: WORKFLOW_APPROVAL_RECORD_STATE.PENDING,
          requestedAt: { lt: since48h },
        },
      }),
      this.prisma.workflowApprovalEscalation.count({
        where: {
          escalationState: ESCALATION_STATE.OPEN,
          triggeredAt: { lt: since24h },
        },
      }),
      this.prisma.workflowTimer.count({
        where: { timerState: WORKFLOW_TIMER_STATE.PENDING },
      }),
      this.prisma.workflowTimer.count({
        where: {
          timerState: WORKFLOW_TIMER_STATE.PENDING,
          wakeAt: { lte: now },
        },
      }),
      this.prisma.workflowWaitState.count({
        where: { waitState: WORKFLOW_WAIT_STATE.ACTIVE },
      }),
      this.prisma.booking.count({
        where: { recurringPlans: { some: {} } },
      }),
    ]);

    const orchestrationSafety =
      await this.getAdminOrchestrationSafetyPortfolio(since24h);

    return {
      workflowsWaitingApproval,
      workflowsGovernanceBlocked,
      pendingApprovals,
      openEscalations,
      policyAttentionEvaluations,
      workflowsRunning,
      workflowsPendingState,
      waitingApprovalWorkflowsAged24hPlus,
      waitingApprovalWorkflowsAged72hPlus,
      oldestPendingApprovalRequestedAt:
        oldestPendingApproval?.requestedAt?.toISOString() ?? null,
      pendingApprovalsAged48hPlus,
      openEscalationsAged24hPlus,
      pendingWorkflowTimers,
      overdueWorkflowTimers,
      activeWorkflowWaits,
      bookingsWithRecurringPlan,
      orchestrationSafety,
    };
  }

  async getFoPortfolioOrchestrationSummary(
    franchiseOwnerId: string,
  ): Promise<FoPortfolioOrchestrationSummary> {
    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const since48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const since72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    const bookings = await this.prisma.booking.findMany({
      where: { foId: franchiseOwnerId },
      select: { id: true },
      take: 500,
    });
    const bookingIds = bookings.map((b) => b.id);
    if (bookingIds.length === 0) {
      return {
        workflowsWaitingApproval: 0,
        workflowsGovernanceBlocked: 0,
        pendingApprovals: 0,
        openEscalations: 0,
        policyAttentionEvaluations: 0,
        workflowsRunning: 0,
        workflowsPendingState: 0,
        waitingApprovalWorkflowsAged24hPlus: 0,
        waitingApprovalWorkflowsAged72hPlus: 0,
        oldestPendingApprovalRequestedAt: null,
        pendingApprovalsAged48hPlus: 0,
        openEscalationsAged24hPlus: 0,
        pendingWorkflowTimers: 0,
        overdueWorkflowTimers: 0,
        activeWorkflowWaits: 0,
        bookingsWithRecurringPlan: 0,
        orchestrationSafety: emptyOrchestrationSafetyPortfolio(false),
      };
    }

    const execScoped = {
      aggregateType: "booking" as const,
      aggregateId: { in: bookingIds },
    };

    const execIds = await this.prisma.workflowExecution.findMany({
      where: execScoped,
      select: { id: true },
      take: 800,
    });
    const wid = execIds.map((r) => r.id);

    const bookingRecurring = await this.prisma.booking.count({
      where: {
        id: { in: bookingIds },
        recurringPlans: { some: {} },
      },
    });

    const [
      workflowsWaitingApproval,
      workflowsGovernanceBlocked,
      pendingApprovals,
      openEscalations,
      policyAttentionEvaluations,
      workflowsRunning,
      workflowsPendingState,
      waitingApprovalWorkflowsAged24hPlus,
      waitingApprovalWorkflowsAged72hPlus,
      oldestPendingApproval,
      pendingApprovalsAged48hPlus,
      openEscalationsAged24hPlus,
      pendingWorkflowTimers,
      overdueWorkflowTimers,
      activeWorkflowWaits,
    ] = await Promise.all([
      this.prisma.workflowExecution.count({
        where: {
          ...execScoped,
          state: WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL,
        },
      }),
      this.prisma.workflowExecution.count({
        where: {
          ...execScoped,
          state: WORKFLOW_EXECUTION_STATE.FAILED,
          executionStage: WORKFLOW_EXECUTION_STAGE.GOVERNANCE_BLOCKED,
        },
      }),
      wid.length === 0
        ? Promise.resolve(0)
        : this.prisma.workflowApproval.count({
            where: {
              workflowExecutionId: { in: wid },
              approvalState: WORKFLOW_APPROVAL_RECORD_STATE.PENDING,
            },
          }),
      wid.length === 0
        ? Promise.resolve(0)
        : this.prisma.workflowApprovalEscalation.count({
            where: {
              escalationState: ESCALATION_STATE.OPEN,
              approval: { workflowExecutionId: { in: wid } },
            },
          }),
      wid.length === 0
        ? Promise.resolve(0)
        : this.prisma.operationalPolicyEvaluation.count({
            where: {
              workflowExecutionId: { in: wid },
              severity: { in: ["medium", "high"] },
              evaluationResult: { not: "pass" },
            },
          }),
      this.prisma.workflowExecution.count({
        where: {
          ...execScoped,
          state: WORKFLOW_EXECUTION_STATE.RUNNING,
        },
      }),
      this.prisma.workflowExecution.count({
        where: {
          ...execScoped,
          state: WORKFLOW_EXECUTION_STATE.PENDING,
        },
      }),
      this.prisma.workflowExecution.count({
        where: {
          ...execScoped,
          state: WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL,
          updatedAt: { lt: since24h },
        },
      }),
      this.prisma.workflowExecution.count({
        where: {
          ...execScoped,
          state: WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL,
          updatedAt: { lt: since72h },
        },
      }),
      wid.length === 0
        ? Promise.resolve(null)
        : this.prisma.workflowApproval.findFirst({
            where: {
              workflowExecutionId: { in: wid },
              approvalState: WORKFLOW_APPROVAL_RECORD_STATE.PENDING,
            },
            orderBy: { requestedAt: "asc" },
            select: { requestedAt: true },
          }),
      wid.length === 0
        ? Promise.resolve(0)
        : this.prisma.workflowApproval.count({
            where: {
              workflowExecutionId: { in: wid },
              approvalState: WORKFLOW_APPROVAL_RECORD_STATE.PENDING,
              requestedAt: { lt: since48h },
            },
          }),
      wid.length === 0
        ? Promise.resolve(0)
        : this.prisma.workflowApprovalEscalation.count({
            where: {
              escalationState: ESCALATION_STATE.OPEN,
              triggeredAt: { lt: since24h },
              approval: { workflowExecutionId: { in: wid } },
            },
          }),
      wid.length === 0
        ? Promise.resolve(0)
        : this.prisma.workflowTimer.count({
            where: {
              timerState: WORKFLOW_TIMER_STATE.PENDING,
              execution: execScoped,
            },
          }),
      wid.length === 0
        ? Promise.resolve(0)
        : this.prisma.workflowTimer.count({
            where: {
              timerState: WORKFLOW_TIMER_STATE.PENDING,
              wakeAt: { lte: now },
              execution: execScoped,
            },
          }),
      wid.length === 0
        ? Promise.resolve(0)
        : this.prisma.workflowWaitState.count({
            where: {
              waitState: WORKFLOW_WAIT_STATE.ACTIVE,
              execution: execScoped,
            },
          }),
    ]);

    const orchestrationSafety =
      await this.getFoOrchestrationSafetyPortfolio(wid, since24h);

    return {
      workflowsWaitingApproval,
      workflowsGovernanceBlocked,
      pendingApprovals,
      openEscalations,
      policyAttentionEvaluations,
      workflowsRunning,
      workflowsPendingState,
      waitingApprovalWorkflowsAged24hPlus,
      waitingApprovalWorkflowsAged72hPlus,
      oldestPendingApprovalRequestedAt:
        oldestPendingApproval?.requestedAt?.toISOString() ?? null,
      pendingApprovalsAged48hPlus,
      openEscalationsAged24hPlus,
      pendingWorkflowTimers,
      overdueWorkflowTimers,
      activeWorkflowWaits,
      bookingsWithRecurringPlan: bookingRecurring,
      orchestrationSafety,
    };
  }

  private async getAdminOrchestrationSafetyPortfolio(
    since24h: Date,
  ): Promise<OrchestrationSafetyPortfolioCounts> {
    const [
      activationsRegistered,
      activationsApprovedForInvoke,
      activationsFailed,
      dryRunsFailedLast24h,
      safetyEvaluationsAttentionLast24h,
      simulationsCompletedLast24h,
      deliveryAttemptsLast24h,
      deliverySuccessesLast24h,
    ] = await Promise.all([
      this.prisma.workflowExecutionActivation.count({
        where: {
          activationState: WORKFLOW_ACTIVATION_STATE.REGISTERED,
        },
      }),
      this.prisma.workflowExecutionActivation.count({
        where: {
          activationState: WORKFLOW_ACTIVATION_STATE.APPROVED_FOR_INVOKE,
        },
      }),
      this.prisma.workflowExecutionActivation.count({
        where: {
          activationState: WORKFLOW_ACTIVATION_STATE.FAILED,
        },
      }),
      this.prisma.workflowDryRunExecution.count({
        where: {
          previewState: WORKFLOW_DRY_RUN_PREVIEW_STATE.FAILED,
          createdAt: { gte: since24h },
        },
      }),
      this.prisma.operationalSafetyEvaluation.count({
        where: {
          severity: OPERATIONAL_SAFETY_SEVERITY.ATTENTION,
          createdAt: { gte: since24h },
        },
      }),
      this.prisma.workflowSimulationScenario.count({
        where: {
          simulationState: WORKFLOW_SIMULATION_STATE.COMPLETED,
          createdAt: { gte: since24h },
        },
      }),
      this.prisma.operationalOutboxDeliveryAttempt.count({
        where: { createdAt: { gte: since24h } },
      }),
      this.prisma.operationalOutboxDeliveryAttempt.count({
        where: { createdAt: { gte: since24h }, success: true },
      }),
    ]);

    return {
      activationsRegistered,
      activationsApprovedForInvoke,
      activationsFailed,
      dryRunsFailedLast24h,
      safetyEvaluationsAttentionLast24h,
      simulationsCompletedLast24h,
      deliveryAttemptsLast24h,
      deliverySuccessesLast24h,
    };
  }

  private async getFoOrchestrationSafetyPortfolio(
    workflowExecutionIds: string[],
    since24h: Date,
  ): Promise<OrchestrationSafetyPortfolioCounts> {
    const empty = emptyOrchestrationSafetyPortfolio(false);
    if (workflowExecutionIds.length === 0) {
      return empty;
    }

    const execScope = { workflowExecutionId: { in: workflowExecutionIds } };

    const [
      activationsRegistered,
      activationsApprovedForInvoke,
      activationsFailed,
      dryRunsFailedLast24h,
      safetyEvaluationsAttentionLast24h,
      simulationsCompletedLast24h,
    ] = await Promise.all([
      this.prisma.workflowExecutionActivation.count({
        where: {
          ...execScope,
          activationState: WORKFLOW_ACTIVATION_STATE.REGISTERED,
        },
      }),
      this.prisma.workflowExecutionActivation.count({
        where: {
          ...execScope,
          activationState: WORKFLOW_ACTIVATION_STATE.APPROVED_FOR_INVOKE,
        },
      }),
      this.prisma.workflowExecutionActivation.count({
        where: {
          ...execScope,
          activationState: WORKFLOW_ACTIVATION_STATE.FAILED,
        },
      }),
      this.prisma.workflowDryRunExecution.count({
        where: {
          ...execScope,
          previewState: WORKFLOW_DRY_RUN_PREVIEW_STATE.FAILED,
          createdAt: { gte: since24h },
        },
      }),
      this.prisma.operationalSafetyEvaluation.count({
        where: {
          ...execScope,
          severity: OPERATIONAL_SAFETY_SEVERITY.ATTENTION,
          createdAt: { gte: since24h },
        },
      }),
      this.prisma.workflowSimulationScenario.count({
        where: {
          ...execScope,
          simulationState: WORKFLOW_SIMULATION_STATE.COMPLETED,
          createdAt: { gte: since24h },
        },
      }),
    ]);

    return {
      activationsRegistered,
      activationsApprovedForInvoke,
      activationsFailed,
      dryRunsFailedLast24h,
      safetyEvaluationsAttentionLast24h,
      simulationsCompletedLast24h,
      deliveryAttemptsLast24h: null,
      deliverySuccessesLast24h: null,
    };
  }
}
