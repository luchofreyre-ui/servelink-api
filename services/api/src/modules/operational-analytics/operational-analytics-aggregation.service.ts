import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { ESCALATION_STATE } from "../workflow/operational-policy.constants";
import {
  WORKFLOW_APPROVAL_RECORD_STATE,
  WORKFLOW_EXECUTION_STATE,
  WORKFLOW_EXECUTION_STAGE,
  WORKFLOW_GOVERNANCE_OUTCOME_STEP,
} from "../workflow/workflow.constants";
import {
  ANALYTICS_AGGREGATE_ID_GLOBAL,
  ANALYTICS_AGGREGATE_TYPE,
  ANALYTICS_AGGREGATE_WINDOW,
  ANALYTICS_METRIC_CATEGORY,
  ANALYTICS_METRIC_KEY,
  ANALYTICS_POLICY_ENGINE_VERSION_REF,
  ANALYTICS_WORKFLOW_ROLLUP_ALL,
  OPERATIONAL_ANALYTICS_ENGINE_VERSION,
  ORCHESTRATION_ANALYTICS_CATEGORY,
} from "./operational-analytics.constants";
import { OperationalBalancingAggregationService } from "./operational-balancing-aggregation.service";
import { OperationalOutcomeAggregationService } from "./operational-outcome-aggregation.service";
import { OperationalBenchmarkAggregationService } from "./operational-benchmark-aggregation.service";
import { OperationalSimulationLabAggregationService } from "./operational-simulation-lab-aggregation.service";
import { OperationalLongitudinalAggregationService } from "./operational-longitudinal-aggregation.service";
import { OperationalScienceAggregationService } from "./operational-science-aggregation.service";
import { OperationalInterventionValidityAggregationService } from "./operational-intervention-validity-aggregation.service";
import { OperationalIncidentCommandAggregationService } from "./operational-incident-command-aggregation.service";
import { OperationalEntityGraphAggregationService } from "./operational-entity-graph-aggregation.service";

const PAYMENT_ATTENTION_STATUSES = [
  "unpaid",
  "checkout_created",
  "payment_pending",
  "failed",
] as const;

/**
 * Persists deterministic operational analytics snapshots — replaces rows per engine + window (explicit refresh).
 */
@Injectable()
export class OperationalAnalyticsAggregationService {
  private readonly log = new Logger(OperationalAnalyticsAggregationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly balancing: OperationalBalancingAggregationService,
    private readonly outcome: OperationalOutcomeAggregationService,
    private readonly benchmark: OperationalBenchmarkAggregationService,
    private readonly simulationLab: OperationalSimulationLabAggregationService,
    private readonly longitudinal: OperationalLongitudinalAggregationService,
    private readonly operationalScience: OperationalScienceAggregationService,
    private readonly interventionValidity: OperationalInterventionValidityAggregationService,
    private readonly incidentCommand: OperationalIncidentCommandAggregationService,
    private readonly entityGraph: OperationalEntityGraphAggregationService,
  ) {}

  async refreshPlatformOperationalSnapshots(options?: {
    aggregateWindow?: string;
  }): Promise<{
    snapshotsWritten: number;
    aggregatesWritten: number;
    balancingSnapshotsWritten: number;
    workflowCongestionSnapshotsWritten: number;
    workflowOutcomeEvaluationsWritten: number;
    simulationAccuracySnapshotsWritten: number;
    operationalDriftSnapshotsWritten: number;
    workflowBenchmarkScenariosWritten: number;
    operationalExperimentSnapshotsWritten: number;
    simulationLabRunsWritten: number;
    experimentCertificationsWritten: number;
    causalAttributionSnapshotsWritten: number;
    experimentLineageWritten: number;
    counterfactualSnapshotsWritten: number;
    replayAlignmentsWritten: number;
    cohortSnapshotsWritten: number;
    interventionSandboxesWritten: number;
    interventionEvaluationsWritten: number;
    interventionAssignmentsWritten: number;
    controlCohortSnapshotsWritten: number;
    validityCertificationsWritten: number;
    operationalIncidentsWritten: number;
    operationalIncidentLinksWritten: number;
    operationalInvestigationTrailsWritten: number;
    operationalEntityNodesWritten: number;
    operationalEntityEdgesWritten: number;
    operationalChronologyFramesWritten: number;
    operationalGraphHistoryWritten: number;
    operationalReplaySessionsWritten: number;
    operationalReplayFramesWritten: number;
    operationalReplayDiffsWritten: number;
    operationalChronologyDeltasWritten: number;
    replayInterpretationSnapshotsWritten: number;
    operationalReplayPairingsWritten: number;
    operationalChronologySemanticAlignmentsWritten: number;
    operationalReplayTopologySnapshotsWritten: number;
    operationalReplayInterventionBridgesWritten: number;
  }> {
    const ENGINE = OPERATIONAL_ANALYTICS_ENGINE_VERSION;
    const windowKey =
      options?.aggregateWindow ?? ANALYTICS_AGGREGATE_WINDOW.AS_OF_NOW;
    const platform = ANALYTICS_AGGREGATE_TYPE.PLATFORM;
    const globalId = ANALYTICS_AGGREGATE_ID_GLOBAL;

    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      workflowsWaitingApproval,
      workflowsGovernanceBlocked,
      workflowsCompleted,
      workflowsFailed,
      workflowsRunning,
      workflowsCancelled,
      pendingApprovals,
      openEscalations,
      policyAttentionEvaluations,
      deliveryAttempts24h,
      deliverySuccess24h,
      paymentAttentionBookings,
      bookingsWithRecurringPlan,
      stepsGovernanceBlocked7d,
      wfGroups,
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
      this.prisma.workflowExecution.count({
        where: { state: WORKFLOW_EXECUTION_STATE.COMPLETED },
      }),
      this.prisma.workflowExecution.count({
        where: { state: WORKFLOW_EXECUTION_STATE.FAILED },
      }),
      this.prisma.workflowExecution.count({
        where: { state: WORKFLOW_EXECUTION_STATE.RUNNING },
      }),
      this.prisma.workflowExecution.count({
        where: { state: WORKFLOW_EXECUTION_STATE.CANCELLED },
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
      this.prisma.operationalOutboxDeliveryAttempt.count({
        where: { createdAt: { gte: since24h } },
      }),
      this.prisma.operationalOutboxDeliveryAttempt.count({
        where: { createdAt: { gte: since24h }, success: true },
      }),
      this.prisma.booking.count({
        where: {
          paymentStatus: { in: [...PAYMENT_ATTENTION_STATUSES] },
        },
      }),
      this.prisma.booking.count({
        where: { recurringPlans: { some: {} } },
      }),
      this.prisma.workflowExecutionStep.count({
        where: {
          governanceOutcome: WORKFLOW_GOVERNANCE_OUTCOME_STEP.BLOCKED,
          failedAt: { gte: since7d },
        },
      }),
      this.prisma.workflowExecution.groupBy({
        by: ["workflowType", "state"],
        _count: { _all: true },
      }),
    ]);

    const snapshotMeta = {
      policyEngineVersionRef: ANALYTICS_POLICY_ENGINE_VERSION_REF,
      computedAtIso: now.toISOString(),
      deliveryWindowHours24: true,
      governanceStepWindowDays7: true,
    } satisfies Prisma.InputJsonObject;

    const snapshotRows: Prisma.OperationalAnalyticsSnapshotCreateManyInput[] =
      [
        {
          analyticsEngineVersion: ENGINE,
          aggregateType: platform,
          aggregateId: globalId,
          aggregateWindow: windowKey,
          metricCategory: ANALYTICS_METRIC_CATEGORY.ORCHESTRATION,
          metricKey: ANALYTICS_METRIC_KEY.WORKFLOW_WAITING_APPROVAL,
          metricValue: workflowsWaitingApproval,
          payloadJson: snapshotMeta,
          createdAt: now,
        },
        {
          analyticsEngineVersion: ENGINE,
          aggregateType: platform,
          aggregateId: globalId,
          aggregateWindow: windowKey,
          metricCategory: ANALYTICS_METRIC_CATEGORY.GOVERNANCE,
          metricKey: ANALYTICS_METRIC_KEY.WORKFLOW_GOVERNANCE_BLOCKED,
          metricValue: workflowsGovernanceBlocked,
          payloadJson: snapshotMeta,
          createdAt: now,
        },
        {
          analyticsEngineVersion: ENGINE,
          aggregateType: platform,
          aggregateId: globalId,
          aggregateWindow: windowKey,
          metricCategory: ANALYTICS_METRIC_CATEGORY.ORCHESTRATION,
          metricKey: ANALYTICS_METRIC_KEY.WORKFLOW_COMPLETED,
          metricValue: workflowsCompleted,
          payloadJson: snapshotMeta,
          createdAt: now,
        },
        {
          analyticsEngineVersion: ENGINE,
          aggregateType: platform,
          aggregateId: globalId,
          aggregateWindow: windowKey,
          metricCategory: ANALYTICS_METRIC_CATEGORY.ORCHESTRATION,
          metricKey: ANALYTICS_METRIC_KEY.WORKFLOW_FAILED,
          metricValue: workflowsFailed,
          payloadJson: snapshotMeta,
          createdAt: now,
        },
        {
          analyticsEngineVersion: ENGINE,
          aggregateType: platform,
          aggregateId: globalId,
          aggregateWindow: windowKey,
          metricCategory: ANALYTICS_METRIC_CATEGORY.ORCHESTRATION,
          metricKey: ANALYTICS_METRIC_KEY.WORKFLOW_RUNNING,
          metricValue: workflowsRunning,
          payloadJson: snapshotMeta,
          createdAt: now,
        },
        {
          analyticsEngineVersion: ENGINE,
          aggregateType: platform,
          aggregateId: globalId,
          aggregateWindow: windowKey,
          metricCategory: ANALYTICS_METRIC_CATEGORY.ORCHESTRATION,
          metricKey: ANALYTICS_METRIC_KEY.WORKFLOW_CANCELLED,
          metricValue: workflowsCancelled,
          payloadJson: snapshotMeta,
          createdAt: now,
        },
        {
          analyticsEngineVersion: ENGINE,
          aggregateType: platform,
          aggregateId: globalId,
          aggregateWindow: windowKey,
          metricCategory: ANALYTICS_METRIC_CATEGORY.APPROVAL,
          metricKey: ANALYTICS_METRIC_KEY.APPROVAL_PENDING,
          metricValue: pendingApprovals,
          payloadJson: snapshotMeta,
          createdAt: now,
        },
        {
          analyticsEngineVersion: ENGINE,
          aggregateType: platform,
          aggregateId: globalId,
          aggregateWindow: windowKey,
          metricCategory: ANALYTICS_METRIC_CATEGORY.APPROVAL,
          metricKey: ANALYTICS_METRIC_KEY.ESCALATION_OPEN,
          metricValue: openEscalations,
          payloadJson: snapshotMeta,
          createdAt: now,
        },
        {
          analyticsEngineVersion: ENGINE,
          aggregateType: platform,
          aggregateId: globalId,
          aggregateWindow: windowKey,
          metricCategory: ANALYTICS_METRIC_CATEGORY.POLICY,
          metricKey: ANALYTICS_METRIC_KEY.POLICY_ATTENTION_EVALUATIONS,
          metricValue: policyAttentionEvaluations,
          payloadJson: snapshotMeta,
          createdAt: now,
        },
        {
          analyticsEngineVersion: ENGINE,
          aggregateType: platform,
          aggregateId: globalId,
          aggregateWindow: windowKey,
          metricCategory: ANALYTICS_METRIC_CATEGORY.DELIVERY,
          metricKey: ANALYTICS_METRIC_KEY.DELIVERY_ATTEMPTS_24H,
          metricValue: deliveryAttempts24h,
          payloadJson: snapshotMeta,
          createdAt: now,
        },
        {
          analyticsEngineVersion: ENGINE,
          aggregateType: platform,
          aggregateId: globalId,
          aggregateWindow: windowKey,
          metricCategory: ANALYTICS_METRIC_CATEGORY.DELIVERY,
          metricKey: ANALYTICS_METRIC_KEY.DELIVERY_SUCCESS_24H,
          metricValue: deliverySuccess24h,
          payloadJson: snapshotMeta,
          createdAt: now,
        },
        {
          analyticsEngineVersion: ENGINE,
          aggregateType: platform,
          aggregateId: globalId,
          aggregateWindow: windowKey,
          metricCategory: ANALYTICS_METRIC_CATEGORY.PAYMENT,
          metricKey: ANALYTICS_METRIC_KEY.PAYMENT_ATTENTION_BOOKINGS,
          metricValue: paymentAttentionBookings,
          payloadJson: snapshotMeta,
          createdAt: now,
        },
        {
          analyticsEngineVersion: ENGINE,
          aggregateType: platform,
          aggregateId: globalId,
          aggregateWindow: windowKey,
          metricCategory: ANALYTICS_METRIC_CATEGORY.RECURRING,
          metricKey: ANALYTICS_METRIC_KEY.BOOKINGS_WITH_RECURRING_PLAN,
          metricValue: bookingsWithRecurringPlan,
          payloadJson: snapshotMeta,
          createdAt: now,
        },
        {
          analyticsEngineVersion: ENGINE,
          aggregateType: platform,
          aggregateId: globalId,
          aggregateWindow: windowKey,
          metricCategory: ANALYTICS_METRIC_CATEGORY.WORKFLOW_STEP,
          metricKey: ANALYTICS_METRIC_KEY.WORKFLOW_STEPS_GOVERNANCE_BLOCKED_7D,
          metricValue: stepsGovernanceBlocked7d,
          payloadJson: snapshotMeta,
          createdAt: now,
        },
      ];

    const byType = new Map<
      string,
      Partial<Record<string, number>>
    >();

    const totalsByState: Partial<Record<string, number>> = {};

    for (const row of wfGroups) {
      const t = row.workflowType;
      const st = row.state;
      const c = row._count._all;
      const cur = byType.get(t) ?? {};
      cur[st] = (cur[st] ?? 0) + c;
      byType.set(t, cur);
      totalsByState[st] = (totalsByState[st] ?? 0) + c;
    }

    const aggregateRows: Prisma.WorkflowAnalyticsAggregateCreateManyInput[] =
      [];

    const rollupPayload = {
      ...snapshotMeta,
      workflowTypesRepresented: byType.size,
    } satisfies Prisma.InputJsonObject;

    aggregateRows.push({
      analyticsEngineVersion: ENGINE,
      workflowType: ANALYTICS_WORKFLOW_ROLLUP_ALL,
      orchestrationCategory: ORCHESTRATION_ANALYTICS_CATEGORY.PORTFOLIO_SIGNALS,
      aggregateWindow: windowKey,
      countsJson: { byState: totalsByState },
      payloadJson: rollupPayload,
      createdAt: now,
    });

    for (const [workflowType, byState] of byType) {
      aggregateRows.push({
        analyticsEngineVersion: ENGINE,
        workflowType,
        orchestrationCategory:
          ORCHESTRATION_ANALYTICS_CATEGORY.EXECUTION_POSTURE,
        aggregateWindow: windowKey,
        countsJson: { byState },
        payloadJson: snapshotMeta,
        createdAt: now,
      });
    }

    const currentWarehouseMetrics: Record<string, number> =
      Object.fromEntries(
        snapshotRows.map((r) => [r.metricKey, r.metricValue]),
      );

    const latestPriorAnalyticsStamp =
      await this.prisma.operationalAnalyticsSnapshot.findFirst({
        where: {
          analyticsEngineVersion: ENGINE,
          aggregateWindow: windowKey,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

    let priorWarehouseMetrics: Record<string, number> | null = null;
    if (latestPriorAnalyticsStamp) {
      const priorRows =
        await this.prisma.operationalAnalyticsSnapshot.findMany({
          where: {
            analyticsEngineVersion: ENGINE,
            aggregateWindow: windowKey,
            createdAt: latestPriorAnalyticsStamp.createdAt,
          },
          select: { metricKey: true, metricValue: true },
        });
      priorWarehouseMetrics = Object.fromEntries(
        priorRows.map((pr) => [pr.metricKey, pr.metricValue]),
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.operationalAnalyticsSnapshot.deleteMany({
        where: {
          analyticsEngineVersion: ENGINE,
          aggregateWindow: windowKey,
        },
      });
      await tx.workflowAnalyticsAggregate.deleteMany({
        where: {
          analyticsEngineVersion: ENGINE,
          aggregateWindow: windowKey,
        },
      });

      await tx.operationalAnalyticsSnapshot.createMany({
        data: snapshotRows,
      });
      await tx.workflowAnalyticsAggregate.createMany({
        data: aggregateRows,
      });
    });

    this.log.log({
      msg: "OPERATIONAL_ANALYTICS_REFRESH",
      windowKey,
      snapshotsWritten: snapshotRows.length,
      aggregatesWritten: aggregateRows.length,
    });

    let balancingSnapshotsWritten = 0;
    let workflowCongestionSnapshotsWritten = 0;
    try {
      const b = await this.balancing.refreshOperationalBalancingSnapshots({
        aggregateWindow: windowKey,
      });
      balancingSnapshotsWritten = b.balancingWritten;
      workflowCongestionSnapshotsWritten = b.congestionWritten;
    } catch (err) {
      this.log.warn({
        msg: "OPERATIONAL_BALANCING_REFRESH_FAILED",
        windowKey,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    let workflowOutcomeEvaluationsWritten = 0;
    let simulationAccuracySnapshotsWritten = 0;
    let operationalDriftSnapshotsWritten = 0;
    try {
      const oc = await this.outcome.refreshOperationalOutcomeIntelligence({
        aggregateWindow: windowKey,
        batchCreatedAt: now,
        priorWarehouseMetrics,
        currentWarehouseMetrics,
      });
      workflowOutcomeEvaluationsWritten = oc.workflowOutcomeEvaluationsWritten;
      simulationAccuracySnapshotsWritten =
        oc.simulationAccuracySnapshotsWritten;
      operationalDriftSnapshotsWritten = oc.operationalDriftSnapshotsWritten;
    } catch (err) {
      this.log.warn({
        msg: "OPERATIONAL_OUTCOME_REFRESH_FAILED",
        windowKey,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    let workflowBenchmarkScenariosWritten = 0;
    let operationalExperimentSnapshotsWritten = 0;
    try {
      const bm = await this.benchmark.refreshOperationalBenchmarkBatch({
        aggregateWindow: windowKey,
        batchCreatedAt: now,
        priorWarehouseMetrics,
        currentWarehouseMetrics,
      });
      workflowBenchmarkScenariosWritten = bm.workflowBenchmarkScenariosWritten;
      operationalExperimentSnapshotsWritten =
        bm.operationalExperimentSnapshotsWritten;
    } catch (err) {
      this.log.warn({
        msg: "OPERATIONAL_BENCHMARK_REFRESH_FAILED",
        windowKey,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    let simulationLabRunsWritten = 0;
    let experimentCertificationsWritten = 0;
    let causalAttributionSnapshotsWritten = 0;
    try {
      const lab = await this.simulationLab.refreshOperationalSimulationLabBatch({
        aggregateWindow: windowKey,
        batchCreatedAt: now,
      });
      simulationLabRunsWritten = lab.simulationLabRunsWritten;
      experimentCertificationsWritten = lab.experimentCertificationsWritten;
      causalAttributionSnapshotsWritten =
        lab.causalAttributionSnapshotsWritten;
    } catch (err) {
      this.log.warn({
        msg: "OPERATIONAL_SIMULATION_LAB_REFRESH_FAILED",
        windowKey,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    let experimentLineageWritten = 0;
    let counterfactualSnapshotsWritten = 0;
    let replayAlignmentsWritten = 0;
    try {
      const lng = await this.longitudinal.refreshOperationalLongitudinalBatch({
        aggregateWindow: windowKey,
        batchCreatedAt: now,
      });
      experimentLineageWritten = lng.experimentLineageWritten;
      counterfactualSnapshotsWritten = lng.counterfactualSnapshotsWritten;
      replayAlignmentsWritten = lng.replayAlignmentsWritten;
    } catch (err) {
      this.log.warn({
        msg: "OPERATIONAL_LONGITUDINAL_REFRESH_FAILED",
        windowKey,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    let cohortSnapshotsWritten = 0;
    let interventionSandboxesWritten = 0;
    let interventionEvaluationsWritten = 0;
    try {
      const sci = await this.operationalScience.refreshOperationalScienceBatch({
        aggregateWindow: windowKey,
        batchCreatedAt: now,
      });
      cohortSnapshotsWritten = sci.cohortSnapshotsWritten;
      interventionSandboxesWritten = sci.interventionSandboxesWritten;
      interventionEvaluationsWritten = sci.interventionEvaluationsWritten;
    } catch (err) {
      this.log.warn({
        msg: "OPERATIONAL_SCIENCE_REFRESH_FAILED",
        windowKey,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    let interventionAssignmentsWritten = 0;
    let controlCohortSnapshotsWrittenPhase28 = 0;
    let validityCertificationsWritten = 0;
    try {
      const iv =
        await this.interventionValidity.refreshOperationalInterventionValidityBatch(
          {
            aggregateWindow: windowKey,
            batchCreatedAt: now,
          },
        );
      interventionAssignmentsWritten = iv.interventionAssignmentsWritten;
      controlCohortSnapshotsWrittenPhase28 = iv.controlCohortSnapshotsWritten;
      validityCertificationsWritten = iv.validityCertificationsWritten;
    } catch (err) {
      this.log.warn({
        msg: "OPERATIONAL_INTERVENTION_VALIDITY_REFRESH_FAILED",
        windowKey,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    let operationalIncidentsWritten = 0;
    let operationalIncidentLinksWritten = 0;
    let operationalInvestigationTrailsWritten = 0;
    try {
      const ic = await this.incidentCommand.refreshOperationalIncidentCommandBatch({
        aggregateWindow: windowKey,
        batchCreatedAt: now,
      });
      operationalIncidentsWritten = ic.operationalIncidentsWritten;
      operationalIncidentLinksWritten = ic.operationalIncidentLinksWritten;
      operationalInvestigationTrailsWritten =
        ic.operationalInvestigationTrailsWritten;
    } catch (err) {
      this.log.warn({
        msg: "OPERATIONAL_INCIDENT_COMMAND_REFRESH_FAILED",
        windowKey,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    let operationalEntityNodesWritten = 0;
    let operationalEntityEdgesWritten = 0;
    let operationalChronologyFramesWritten = 0;
    let operationalGraphHistoryWritten = 0;
    let operationalReplaySessionsWritten = 0;
    let operationalReplayFramesWritten = 0;
    let operationalReplayDiffsWritten = 0;
    let operationalChronologyDeltasWritten = 0;
    let replayInterpretationSnapshotsWritten = 0;
    let operationalReplayPairingsWritten = 0;
    let operationalChronologySemanticAlignmentsWritten = 0;
    let operationalReplayTopologySnapshotsWritten = 0;
    let operationalReplayInterventionBridgesWritten = 0;
    try {
      const og = await this.entityGraph.refreshOperationalEntityGraphBatch({
        aggregateWindow: windowKey,
        batchCreatedAt: now,
      });
      operationalEntityNodesWritten = og.operationalEntityNodesWritten;
      operationalEntityEdgesWritten = og.operationalEntityEdgesWritten;
      operationalChronologyFramesWritten =
        og.operationalChronologyFramesWritten;
      operationalGraphHistoryWritten = og.operationalGraphHistoryWritten;
      operationalReplaySessionsWritten =
        og.operationalReplaySessionsWritten;
      operationalReplayFramesWritten = og.operationalReplayFramesWritten;
      operationalReplayDiffsWritten = og.operationalReplayDiffsWritten;
      operationalChronologyDeltasWritten =
        og.operationalChronologyDeltasWritten;
      replayInterpretationSnapshotsWritten =
        og.replayInterpretationSnapshotsWritten;
      operationalReplayPairingsWritten =
        og.operationalReplayPairingsWritten;
      operationalChronologySemanticAlignmentsWritten =
        og.operationalChronologySemanticAlignmentsWritten;
      operationalReplayTopologySnapshotsWritten =
        og.operationalReplayTopologySnapshotsWritten;
      operationalReplayInterventionBridgesWritten =
        og.operationalReplayInterventionBridgesWritten;
    } catch (err) {
      this.log.warn({
        msg: "OPERATIONAL_ENTITY_GRAPH_REFRESH_FAILED",
        windowKey,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return {
      snapshotsWritten: snapshotRows.length,
      aggregatesWritten: aggregateRows.length,
      balancingSnapshotsWritten,
      workflowCongestionSnapshotsWritten,
      workflowOutcomeEvaluationsWritten,
      simulationAccuracySnapshotsWritten,
      operationalDriftSnapshotsWritten,
      workflowBenchmarkScenariosWritten,
      operationalExperimentSnapshotsWritten,
      simulationLabRunsWritten,
      experimentCertificationsWritten,
      causalAttributionSnapshotsWritten,
      experimentLineageWritten,
      counterfactualSnapshotsWritten,
      replayAlignmentsWritten,
      cohortSnapshotsWritten,
      interventionSandboxesWritten,
      interventionEvaluationsWritten,
      interventionAssignmentsWritten,
      controlCohortSnapshotsWritten: controlCohortSnapshotsWrittenPhase28,
      validityCertificationsWritten,
      operationalIncidentsWritten,
      operationalIncidentLinksWritten,
      operationalInvestigationTrailsWritten,
      operationalEntityNodesWritten,
      operationalEntityEdgesWritten,
      operationalChronologyFramesWritten,
      operationalGraphHistoryWritten,
      operationalReplaySessionsWritten,
      operationalReplayFramesWritten,
      operationalReplayDiffsWritten,
      operationalChronologyDeltasWritten,
      replayInterpretationSnapshotsWritten,
      operationalReplayPairingsWritten,
      operationalChronologySemanticAlignmentsWritten,
      operationalReplayTopologySnapshotsWritten,
      operationalReplayInterventionBridgesWritten,
    };
  }
}
