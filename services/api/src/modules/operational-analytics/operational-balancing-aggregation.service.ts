import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { OperationalPortfolioOrchestrationService } from "../workflow/operational-portfolio-orchestration.service";
import { WORKFLOW_DRY_RUN_PREVIEW_STATE } from "../workflow/workflow-orchestration-preview.constants";
import {
  WORKFLOW_SIMULATION_STATE,
} from "../workflow/workflow-orchestration-simulation.constants";
import {
  WORKFLOW_EXECUTION_STATE,
} from "../workflow/workflow.constants";
import {
  BALANCING_CATEGORY,
  BALANCING_SIGNAL_SEVERITY,
  CONGESTION_CATEGORY,
  OPERATIONAL_BALANCING_ENGINE_VERSION,
  WORKFLOW_CONGESTION_ENGINE_VERSION,
  OPERATIONAL_BALANCING_GOVERNANCE_VERSION,
} from "./operational-balancing.constants";

/**
 * Persists deterministic balancing + congestion snapshots — replaces rows per engine + window.
 * Does not rank bookings, dispatch crews, or mutate orchestration.
 */
@Injectable()
export class OperationalBalancingAggregationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portfolio: OperationalPortfolioOrchestrationService,
  ) {}

  async refreshOperationalBalancingSnapshots(options: {
    aggregateWindow: string;
  }): Promise<{ balancingWritten: number; congestionWritten: number }> {
    const BAL_ENGINE = OPERATIONAL_BALANCING_ENGINE_VERSION;
    const CONG_ENGINE = WORKFLOW_CONGESTION_ENGINE_VERSION;
    const windowKey = options.aggregateWindow;
    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      portfolio,
      wfGroups,
      dryRunsFailed24h,
      simulationsFailed24h,
      deliveryAttempts24h,
      deliverySuccess24h,
    ] = await Promise.all([
      this.portfolio.getAdminPortfolioOrchestrationSummary(),
      this.prisma.workflowExecution.groupBy({
        by: ["workflowType", "state"],
        _count: { _all: true },
      }),
      this.prisma.workflowDryRunExecution.count({
        where: {
          previewState: WORKFLOW_DRY_RUN_PREVIEW_STATE.FAILED,
          createdAt: { gte: since24h },
        },
      }),
      this.prisma.workflowSimulationScenario.count({
        where: {
          simulationState: WORKFLOW_SIMULATION_STATE.FAILED,
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

    const os = portfolio.orchestrationSafety;
    const meta = {
      balancingGovernanceVersion: OPERATIONAL_BALANCING_GOVERNANCE_VERSION,
      computedAtIso: now.toISOString(),
      nonAutonomous: true,
      explainOnly: true,
    } satisfies Prisma.InputJsonObject;

    const balancingRows: Prisma.OperationalBalancingSnapshotCreateManyInput[] =
      [];

    const portfolioPressureAttention =
      portfolio.waitingApprovalWorkflowsAged72hPlus > 0 ||
      portfolio.pendingApprovalsAged48hPlus >= 3 ||
      portfolio.openEscalationsAged24hPlus > 0 ||
      portfolio.pendingApprovals >= 12;

    balancingRows.push({
      balancingEngineVersion: BAL_ENGINE,
      balancingCategory: BALANCING_CATEGORY.PORTFOLIO_PRESSURE_V1,
      aggregateWindow: windowKey,
      severity:
        portfolioPressureAttention ?
          BALANCING_SIGNAL_SEVERITY.ATTENTION
        : BALANCING_SIGNAL_SEVERITY.INFO,
      payloadJson: {
        ...meta,
        signals: {
          workflowsWaitingApproval: portfolio.workflowsWaitingApproval,
          pendingApprovals: portfolio.pendingApprovals,
          pendingApprovalsAged48hPlus: portfolio.pendingApprovalsAged48hPlus,
          waitingApprovalWorkflowsAged72hPlus:
            portfolio.waitingApprovalWorkflowsAged72hPlus,
          openEscalationsAged24hPlus: portfolio.openEscalationsAged24hPlus,
          openEscalations: portfolio.openEscalations,
        },
        explanation:
          "Portfolio approval + escalation aging breadth — deterministic pressure mirror only (no queue reordering).",
      },
      createdAt: now,
    });

    const govAttention =
      portfolio.workflowsGovernanceBlocked > 0 ||
      portfolio.policyAttentionEvaluations >= 5;

    balancingRows.push({
      balancingEngineVersion: BAL_ENGINE,
      balancingCategory: BALANCING_CATEGORY.GOVERNANCE_SATURATION_V1,
      aggregateWindow: windowKey,
      severity:
        govAttention ?
          BALANCING_SIGNAL_SEVERITY.ATTENTION
        : BALANCING_SIGNAL_SEVERITY.INFO,
      payloadJson: {
        ...meta,
        signals: {
          workflowsGovernanceBlocked: portfolio.workflowsGovernanceBlocked,
          policyAttentionEvaluations: portfolio.policyAttentionEvaluations,
        },
        explanation:
          "Governance-blocked executions + policy attention evaluations — saturation indicator only.",
      },
      createdAt: now,
    });

    const timerAttention =
      portfolio.overdueWorkflowTimers > 0 ||
      portfolio.activeWorkflowWaits >= 10 ||
      portfolio.pendingWorkflowTimers >= 25;

    balancingRows.push({
      balancingEngineVersion: BAL_ENGINE,
      balancingCategory: BALANCING_CATEGORY.TIMER_WAIT_LOAD_V1,
      aggregateWindow: windowKey,
      severity:
        timerAttention ?
          BALANCING_SIGNAL_SEVERITY.ATTENTION
        : BALANCING_SIGNAL_SEVERITY.INFO,
      payloadJson: {
        ...meta,
        signals: {
          pendingWorkflowTimers: portfolio.pendingWorkflowTimers,
          overdueWorkflowTimers: portfolio.overdueWorkflowTimers,
          activeWorkflowWaits: portfolio.activeWorkflowWaits,
        },
        explanation:
          "Timer + wait posture backlog — wake queues remain human-governed (no autonomous ticking here).",
      },
      createdAt: now,
    });

    const delRatio =
      deliveryAttempts24h > 0 ? deliverySuccess24h / deliveryAttempts24h : null;
    const deliveryAttention =
      deliveryAttempts24h >= 12 &&
      delRatio != null &&
      delRatio < 0.85;

    balancingRows.push({
      balancingEngineVersion: BAL_ENGINE,
      balancingCategory: BALANCING_CATEGORY.DELIVERY_RELIABILITY_V1,
      aggregateWindow: windowKey,
      severity:
        deliveryAttention ?
          BALANCING_SIGNAL_SEVERITY.ATTENTION
        : BALANCING_SIGNAL_SEVERITY.INFO,
      payloadJson: {
        ...meta,
        signals: {
          attempts24h: deliveryAttempts24h,
          successes24h: deliverySuccess24h,
          successRatioApprox: delRatio,
        },
        explanation:
          "Delivery attempt ratio (24h) — operational channel degradation mirror only.",
      },
      createdAt: now,
    });

    const activationAttention =
      os.activationsFailed > 0 ||
      simulationsFailed24h > 0 ||
      os.safetyEvaluationsAttentionLast24h >= 3 ||
      os.activationsApprovedForInvoke >= 8;

    balancingRows.push({
      balancingEngineVersion: BAL_ENGINE,
      balancingCategory:
        BALANCING_CATEGORY.ACTIVATION_SIMULATION_POSTURE_V1,
      aggregateWindow: windowKey,
      severity:
        activationAttention ?
          BALANCING_SIGNAL_SEVERITY.ATTENTION
        : BALANCING_SIGNAL_SEVERITY.INFO,
      payloadJson: {
        ...meta,
        signals: {
          activationsRegistered: os.activationsRegistered,
          activationsApprovedForInvoke: os.activationsApprovedForInvoke,
          activationsFailed: os.activationsFailed,
          dryRunsFailedLast24h: os.dryRunsFailedLast24h,
          simulationsCompletedLast24h: os.simulationsCompletedLast24h,
          simulationsFailed24h,
          safetyEvaluationsAttentionLast24h:
            os.safetyEvaluationsAttentionLast24h,
        },
        explanation:
          "Activation + simulation posture — backlog/seam visibility without invoking orchestration.",
      },
      createdAt: now,
    });

    const failureDensityAttention =
      dryRunsFailed24h >= 3 || simulationsFailed24h >= 2;

    balancingRows.push({
      balancingEngineVersion: BAL_ENGINE,
      balancingCategory:
        BALANCING_CATEGORY.DRY_RUN_SIMULATION_FAILURE_DENSITY_V1,
      aggregateWindow: windowKey,
      severity:
        failureDensityAttention ?
          BALANCING_SIGNAL_SEVERITY.ATTENTION
        : BALANCING_SIGNAL_SEVERITY.INFO,
      payloadJson: {
        ...meta,
        signals: {
          dryRunsFailedLast24hGlobal: dryRunsFailed24h,
          simulationsFailedLast24hGlobal: simulationsFailed24h,
        },
        explanation:
          "Platform-wide dry-run + simulation failure density — deterministic friction indicator.",
      },
      createdAt: now,
    });

    const byType = new Map<string, Partial<Record<string, number>>>();
    for (const row of wfGroups) {
      const t = row.workflowType;
      const st = row.state;
      const cur = byType.get(t) ?? {};
      cur[st] = (cur[st] ?? 0) + row._count._all;
      byType.set(t, cur);
    }

    const congestionRows: Prisma.WorkflowCongestionSnapshotCreateManyInput[] =
      [];

    for (const [workflowType, byState] of byType) {
      const waiting =
        byState[WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL] ?? 0;
      const pending = byState[WORKFLOW_EXECUTION_STATE.PENDING] ?? 0;
      const backlog = waiting + pending;
      if (backlog < 1) continue;

      const severity =
        waiting >= 3 || backlog >= 8 ?
          BALANCING_SIGNAL_SEVERITY.ATTENTION
        : BALANCING_SIGNAL_SEVERITY.INFO;

      congestionRows.push({
        congestionEngineVersion: CONG_ENGINE,
        workflowType,
        congestionCategory: CONGESTION_CATEGORY.STATE_BACKLOG_V1,
        aggregateWindow: windowKey,
        severity,
        payloadJson: {
          ...meta,
          backlogSignals: {
            waitingApprovalCount: waiting,
            pendingExecutionCount: pending,
            backlogSum: backlog,
            byState,
          },
          explanation:
            "Waiting + pending execution breadth by workflow type — not an auto-priority ranking.",
        },
        createdAt: now,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.operationalBalancingSnapshot.deleteMany({
        where: {
          balancingEngineVersion: BAL_ENGINE,
          aggregateWindow: windowKey,
        },
      });
      await tx.workflowCongestionSnapshot.deleteMany({
        where: {
          congestionEngineVersion: CONG_ENGINE,
          aggregateWindow: windowKey,
        },
      });

      await tx.operationalBalancingSnapshot.createMany({
        data: balancingRows,
      });
      if (congestionRows.length > 0) {
        await tx.workflowCongestionSnapshot.createMany({
          data: congestionRows,
        });
      }
    });

    return {
      balancingWritten: balancingRows.length,
      congestionWritten: congestionRows.length,
    };
  }
}
