import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { OperationalPortfolioOrchestrationService } from "../workflow/operational-portfolio-orchestration.service";
import {
  WORKFLOW_EXECUTION_STATE,
} from "../workflow/workflow.constants";
import {
  OPERATIONAL_BALANCING_ENGINE_VERSION,
  BALANCING_SIGNAL_SEVERITY,
} from "./operational-balancing.constants";
import { OPERATIONAL_LONGITUDINAL_ENGINE_VERSION } from "./operational-longitudinal.constants";
import {
  CONTROL_COHORT_ENGINE_VERSION,
  OPERATIONAL_INTERVENTION_ASSIGNMENT_ENGINE_VERSION,
  OPERATIONAL_VALIDITY_CERT_ENGINE_VERSION,
} from "./operational-intervention-validity.constants";
import { OPERATIONAL_INCIDENT_ENGINE_VERSION } from "./operational-incident-command.constants";
import {
  OPERATIONAL_ANALYTICS_ENGINE_VERSION,
} from "./operational-analytics.constants";
import {
  assertPolicyAnalyticsVersionAlignment,
  OPERATIONAL_ANALYTICS_GOVERNANCE_VERSION,
} from "./operational-analytics-governance";
import {
  OPERATIONAL_CHRONOLOGY_CATEGORY,
  OPERATIONAL_ENTITY_CATEGORY,
  OPERATIONAL_ENTITY_GRAPH_ENGINE_VERSION,
  OPERATIONAL_ENTITY_STATE,
  OPERATIONAL_GRAPH_EDGE_CATEGORY,
} from "./operational-entity-graph.constants";
import {
  OPERATIONAL_GRAPH_HISTORY_CATEGORY,
  OPERATIONAL_GRAPH_HISTORY_ENGINE_VERSION,
  OPERATIONAL_REPLAY_CATEGORY,
  OPERATIONAL_REPLAY_ENGINE_VERSION,
  OPERATIONAL_REPLAY_FRAME_CATEGORY,
  OPERATIONAL_REPLAY_STATE,
} from "./operational-replay.constants";
import {
  OPERATIONAL_CHRONOLOGY_DELTA_CATEGORY,
  OPERATIONAL_REPLAY_ANALYSIS_ENGINE_VERSION,
  OPERATIONAL_REPLAY_DIFF_CATEGORY,
  REPLAY_INTERPRETATION_CATEGORY,
} from "./operational-replay-analysis.constants";
import { OPERATIONAL_REPLAY_PAIRING_CATEGORY } from "./operational-replay-intelligence-suite.constants";
import { OPERATIONAL_REPLAY_INTELLIGENCE_SUITE_ENGINE_VERSION } from "./operational-replay-intelligence-suite.constants";
import {
  buildConsecutiveBatchReplayAnalysis,
  buildInterventionObservationReplayBridgePayload,
  buildTopologySnapshotPayload,
} from "./operational-replay-diff-compute";

const GOVERNANCE_PAYLOAD = {
  noAutonomousOperationalResolution: true,
  noAiExecutionAuthority: true,
  observeConnectContextualizeOnly: true,
  nonExecutingGraphSemantics: true,
} satisfies Prisma.InputJsonObject;

const REPLAY_GOVERNANCE_PAYLOAD = {
  noAutonomousOperationalResolution: true,
  noAiExecutionAuthority: true,
  observeConnectContextualizeOnly: true,
  nonExecutingGraphSemantics: true,
  replayObserveNavigateOnly: true,
  replayReconstructContextualizeOnly: true,
  noAutonomousReplayExecution: true,
} satisfies Prisma.InputJsonObject;

type NodeSpec = {
  idempotencyKey: string;
  entityCategory: string;
  entityState: string;
  payloadJson: Prisma.InputJsonObject;
};

type EdgeSpec = {
  sourceKey: string;
  targetKey: string;
  edgeCategory: string;
  payloadJson: Prisma.InputJsonObject;
};

/**
 * Phase 31 — deterministic operational entity graph + chronology from warehouse refresh context only.
 */
@Injectable()
export class OperationalEntityGraphAggregationService {
  private readonly log = new Logger(
    OperationalEntityGraphAggregationService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly portfolio: OperationalPortfolioOrchestrationService,
  ) {}

  async refreshOperationalEntityGraphBatch(params: {
    aggregateWindow: string;
    batchCreatedAt: Date;
  }): Promise<{
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
    const windowKey = params.aggregateWindow;
    const batchAt = params.batchCreatedAt;
    const ENGINE = OPERATIONAL_ENTITY_GRAPH_ENGINE_VERSION;
    const BAL_ENGINE = OPERATIONAL_BALANCING_ENGINE_VERSION;
    const LONG_ENGINE = OPERATIONAL_LONGITUDINAL_ENGINE_VERSION;
    const ASSIGN_ENGINE = OPERATIONAL_INTERVENTION_ASSIGNMENT_ENGINE_VERSION;
    const VALIDITY_ENGINE = OPERATIONAL_VALIDITY_CERT_ENGINE_VERSION;
    const CTRL_ENGINE = CONTROL_COHORT_ENGINE_VERSION;
    const INCIDENT_ENGINE = OPERATIONAL_INCIDENT_ENGINE_VERSION;

    const pf =
      await this.portfolio.getAdminPortfolioOrchestrationSummary();
    const os = pf.orchestrationSafety;
    const policyAlignment = assertPolicyAnalyticsVersionAlignment();

    const incidentStamp =
      await this.prisma.operationalIncident.findFirst({
        where: {
          incidentEngineVersion: INCIDENT_ENGINE,
          aggregateWindow: windowKey,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
    const incidents =
      incidentStamp ?
        await this.prisma.operationalIncident.findMany({
          where: {
            incidentEngineVersion: INCIDENT_ENGINE,
            aggregateWindow: windowKey,
            createdAt: incidentStamp.createdAt,
          },
          orderBy: [{ severity: "asc" }, { incidentCategory: "asc" }],
          take: 12,
          select: {
            id: true,
            incidentCategory: true,
            severity: true,
          },
        })
      : [];

    const balancingStamp =
      await this.prisma.operationalBalancingSnapshot.findFirst({
        where: {
          balancingEngineVersion: BAL_ENGINE,
          aggregateWindow: windowKey,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
    const balancingRows =
      balancingStamp ?
        await this.prisma.operationalBalancingSnapshot.findMany({
          where: {
            balancingEngineVersion: BAL_ENGINE,
            aggregateWindow: windowKey,
            createdAt: balancingStamp.createdAt,
          },
          select: { severity: true },
        })
      : [];
    const balancingAttention = balancingRows.filter(
      (r) => r.severity === BALANCING_SIGNAL_SEVERITY.ATTENTION,
    ).length;

    const replayStamp =
      await this.prisma.operationalReplayAlignment.findFirst({
        where: {
          longitudinalEngineVersion: LONG_ENGINE,
          aggregateWindow: windowKey,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
    const replayCount =
      replayStamp ?
        await this.prisma.operationalReplayAlignment.count({
          where: {
            longitudinalEngineVersion: LONG_ENGINE,
            aggregateWindow: windowKey,
            createdAt: replayStamp.createdAt,
          },
        })
      : 0;

    const validityStamp =
      await this.prisma.operationalValidityCertification.findFirst({
        where: {
          validityEngineVersion: VALIDITY_ENGINE,
          aggregateWindow: windowKey,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
    const assignmentStamp =
      await this.prisma.operationalInterventionAssignment.findFirst({
        where: {
          assignmentEngineVersion: ASSIGN_ENGINE,
          aggregateWindow: windowKey,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
    const interventionAssignmentsCount =
      assignmentStamp ?
        await this.prisma.operationalInterventionAssignment.count({
          where: {
            assignmentEngineVersion: ASSIGN_ENGINE,
            aggregateWindow: windowKey,
            createdAt: assignmentStamp.createdAt,
          },
        })
      : 0;
    const validityCertsCount =
      validityStamp ?
        await this.prisma.operationalValidityCertification.count({
          where: {
            validityEngineVersion: VALIDITY_ENGINE,
            aggregateWindow: windowKey,
            createdAt: validityStamp.createdAt,
          },
        })
      : 0;

    const controlStamp =
      await this.prisma.controlCohortSnapshot.findFirst({
        where: {
          controlCohortEngineVersion: CTRL_ENGINE,
          aggregateWindow: windowKey,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
    const controlSnapshotsCount =
      controlStamp ?
        await this.prisma.controlCohortSnapshot.count({
          where: {
            controlCohortEngineVersion: CTRL_ENGINE,
            aggregateWindow: windowKey,
            createdAt: controlStamp.createdAt,
          },
        })
      : 0;

    const workflowSamples = await this.prisma.workflowExecution.findMany({
      where: {
        state: {
          in: [
            WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL,
            WORKFLOW_EXECUTION_STATE.RUNNING,
          ],
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 5,
      select: {
        id: true,
        workflowType: true,
        state: true,
      },
    });

    const rootKey = `${windowKey}:command_surface_root_v1`;
    const warehouseKey = `${windowKey}:warehouse_batch_anchor_v1`;
    const orchKey = `${windowKey}:orchestration_posture_v1`;
    const apprKey = `${windowKey}:approval_escalation_surface_v1`;
    const balKey = `${windowKey}:balancing_observation_v1`;
    const simKey = `${windowKey}:simulation_lab_posture_v1`;
    const ivKey = `${windowKey}:intervention_validity_observation_v1`;
    const lrKey = `${windowKey}:longitudinal_replay_observation_v1`;

    const nodeSpecs: NodeSpec[] = [
      {
        idempotencyKey: rootKey,
        entityCategory: OPERATIONAL_ENTITY_CATEGORY.COMMAND_SURFACE_ROOT_V1,
        entityState: OPERATIONAL_ENTITY_STATE.OBSERVED_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          disclosedAdminAnchorPath: "/admin/ops",
          explainabilityRef: "command_surface_root_v1",
        },
      },
      {
        idempotencyKey: warehouseKey,
        entityCategory:
          OPERATIONAL_ENTITY_CATEGORY.WAREHOUSE_BATCH_ANCHOR_V1,
        entityState: OPERATIONAL_ENTITY_STATE.OBSERVED_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          batchCreatedAtIso: batchAt.toISOString(),
          aggregateWindow: windowKey,
          explainabilityRef: "warehouse_batch_anchor_v1",
        },
      },
      {
        idempotencyKey: orchKey,
        entityCategory: OPERATIONAL_ENTITY_CATEGORY.ORCHESTRATION_POSTURE_V1,
        entityState: OPERATIONAL_ENTITY_STATE.OBSERVED_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          analyticsGovernanceVersionRef:
            OPERATIONAL_ANALYTICS_GOVERNANCE_VERSION,
          analyticsEngineVersionRef: OPERATIONAL_ANALYTICS_ENGINE_VERSION,
          workflowsWaitingApproval: pf.workflowsWaitingApproval,
          workflowsGovernanceBlocked: pf.workflowsGovernanceBlocked,
          workflowsRunning: pf.workflowsRunning,
          pendingApprovals: pf.pendingApprovals,
          openEscalations: pf.openEscalations,
          policyAttentionEvaluations: pf.policyAttentionEvaluations,
          explainabilityRef: "orchestration_posture_node_v1",
        },
      },
      {
        idempotencyKey: apprKey,
        entityCategory:
          OPERATIONAL_ENTITY_CATEGORY.APPROVAL_ESCALATION_SURFACE_V1,
        entityState: OPERATIONAL_ENTITY_STATE.OBSERVED_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          waitingApprovalWorkflowsAged72hPlus:
            pf.waitingApprovalWorkflowsAged72hPlus,
          pendingApprovals: pf.pendingApprovals,
          openEscalations: pf.openEscalations,
          explainabilityRef: "approval_escalation_surface_node_v1",
        },
      },
      {
        idempotencyKey: balKey,
        entityCategory:
          OPERATIONAL_ENTITY_CATEGORY.BALANCING_OBSERVATION_V1,
        entityState: OPERATIONAL_ENTITY_STATE.OBSERVED_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          balancingAttentionRows: balancingAttention,
          balancingObservationsTotal: balancingRows.length,
          explainabilityRef: "balancing_observation_node_v1",
        },
      },
      {
        idempotencyKey: simKey,
        entityCategory:
          OPERATIONAL_ENTITY_CATEGORY.SIMULATION_LAB_POSTURE_V1,
        entityState: OPERATIONAL_ENTITY_STATE.OBSERVED_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          safetyEvaluationsAttentionLast24h:
            os.safetyEvaluationsAttentionLast24h,
          dryRunsFailedLast24h: os.dryRunsFailedLast24h,
          simulationsCompletedLast24h: os.simulationsCompletedLast24h,
          explainabilityRef: "simulation_lab_posture_node_v1",
        },
      },
      {
        idempotencyKey: ivKey,
        entityCategory:
          OPERATIONAL_ENTITY_CATEGORY.INTERVENTION_VALIDITY_OBSERVATION_V1,
        entityState: OPERATIONAL_ENTITY_STATE.OBSERVED_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          interventionAssignmentsObserved: interventionAssignmentsCount,
          validityCertificationsObserved: validityCertsCount,
          controlCohortSnapshotsObserved: controlSnapshotsCount,
          policyEngineAligned: policyAlignment.aligned,
          explainabilityRef: "intervention_validity_observation_node_v1",
        },
      },
      {
        idempotencyKey: lrKey,
        entityCategory:
          OPERATIONAL_ENTITY_CATEGORY.LONGITUDINAL_REPLAY_OBSERVATION_V1,
        entityState: OPERATIONAL_ENTITY_STATE.OBSERVED_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          replayAlignmentsObserved: replayCount,
          explainabilityRef: "longitudinal_replay_observation_node_v1",
        },
      },
    ];

    for (const wf of workflowSamples) {
      const k = `${windowKey}:workflow_execution:${wf.id}`;
      nodeSpecs.push({
        idempotencyKey: k,
        entityCategory:
          OPERATIONAL_ENTITY_CATEGORY.WORKFLOW_EXECUTION_OBSERVATION_V1,
        entityState: OPERATIONAL_ENTITY_STATE.OBSERVED_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          workflowExecutionId: wf.id,
          workflowType: wf.workflowType,
          executionState: wf.state,
          explainabilityRef: "workflow_execution_observation_node_v1",
        },
      });
    }

    for (const inc of incidents) {
      const k = `${windowKey}:operational_incident:${inc.id}`;
      nodeSpecs.push({
        idempotencyKey: k,
        entityCategory:
          OPERATIONAL_ENTITY_CATEGORY.OPERATIONAL_INCIDENT_COORDINATION_V1,
        entityState: OPERATIONAL_ENTITY_STATE.OBSERVED_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          operationalIncidentId: inc.id,
          incidentCategory: inc.incidentCategory,
          severity: inc.severity,
          explainabilityRef: "operational_incident_coordination_node_v1",
        },
      });
    }

    nodeSpecs.sort((a, b) =>
      a.idempotencyKey.localeCompare(b.idempotencyKey),
    );

    const edgeSpecs: EdgeSpec[] = [
      {
        sourceKey: rootKey,
        targetKey: warehouseKey,
        edgeCategory: OPERATIONAL_GRAPH_EDGE_CATEGORY.CONTEXTUALIZES_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef: "command_to_warehouse_context_v1",
        },
      },
      {
        sourceKey: rootKey,
        targetKey: orchKey,
        edgeCategory:
          OPERATIONAL_GRAPH_EDGE_CATEGORY.ADMIN_NAVIGATION_HINT_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          routePath: "/admin/ops",
          routeLandmarkId: "operational-situation-landmark",
          explainabilityRef: "command_to_posture_navigation_hint_v1",
        },
      },
      {
        sourceKey: warehouseKey,
        targetKey: orchKey,
        edgeCategory: OPERATIONAL_GRAPH_EDGE_CATEGORY.CONTEXTUALIZES_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef: "warehouse_to_orchestration_context_v1",
        },
      },
      {
        sourceKey: warehouseKey,
        targetKey: apprKey,
        edgeCategory: OPERATIONAL_GRAPH_EDGE_CATEGORY.CONTEXTUALIZES_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef: "warehouse_to_approval_escalation_context_v1",
        },
      },
      {
        sourceKey: warehouseKey,
        targetKey: balKey,
        edgeCategory: OPERATIONAL_GRAPH_EDGE_CATEGORY.CONTEXTUALIZES_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef: "warehouse_to_balancing_context_v1",
        },
      },
      {
        sourceKey: warehouseKey,
        targetKey: simKey,
        edgeCategory: OPERATIONAL_GRAPH_EDGE_CATEGORY.CONTEXTUALIZES_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef: "warehouse_to_simulation_lab_context_v1",
        },
      },
      {
        sourceKey: warehouseKey,
        targetKey: ivKey,
        edgeCategory: OPERATIONAL_GRAPH_EDGE_CATEGORY.CONTEXTUALIZES_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef: "warehouse_to_intervention_validity_context_v1",
        },
      },
      {
        sourceKey: warehouseKey,
        targetKey: lrKey,
        edgeCategory: OPERATIONAL_GRAPH_EDGE_CATEGORY.CONTEXTUALIZES_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef: "warehouse_to_longitudinal_replay_context_v1",
        },
      },
    ];

    for (const wf of workflowSamples) {
      edgeSpecs.push({
        sourceKey: warehouseKey,
        targetKey: `${windowKey}:workflow_execution:${wf.id}`,
        edgeCategory:
          OPERATIONAL_GRAPH_EDGE_CATEGORY.CORRELATES_WORKFLOW_EXECUTION_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef:
            "warehouse_to_workflow_execution_correlation_v1",
        },
      });
    }

    for (const inc of incidents) {
      edgeSpecs.push({
        sourceKey: warehouseKey,
        targetKey: `${windowKey}:operational_incident:${inc.id}`,
        edgeCategory:
          OPERATIONAL_GRAPH_EDGE_CATEGORY.CORRELATES_INCIDENT_COORDINATION_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef: "warehouse_to_incident_correlation_v1",
        },
      });
    }

    edgeSpecs.sort((a, b) => {
      const c = a.sourceKey.localeCompare(b.sourceKey);
      if (c !== 0) return c;
      const d = a.targetKey.localeCompare(b.targetKey);
      if (d !== 0) return d;
      return a.edgeCategory.localeCompare(b.edgeCategory);
    });

    let nodesWritten = 0;
    let edgesWritten = 0;
    let chronWritten = 0;
    let graphHistoryWritten = 0;
    let replaySessionsWritten = 0;
    let replayFramesWritten = 0;
    let replayDiffsWritten = 0;
    let chronologyDeltasWritten = 0;
    let replayInterpretationSnapshotsWritten = 0;
    let operationalReplayPairingsWritten = 0;
    let operationalChronologySemanticAlignmentsWritten = 0;
    let operationalReplayTopologySnapshotsWritten = 0;
    let operationalReplayInterventionBridgesWritten = 0;

    const SUITE_ENGINE = OPERATIONAL_REPLAY_INTELLIGENCE_SUITE_ENGINE_VERSION;

    await this.prisma.$transaction(async (tx) => {
      await tx.operationalChronologyFrame.deleteMany({
        where: {
          graphEngineVersion: ENGINE,
          aggregateWindow: windowKey,
        },
      });
      await tx.operationalEntityNode.deleteMany({
        where: {
          graphEngineVersion: ENGINE,
          aggregateWindow: windowKey,
        },
      });

      const keyToId = new Map<string, string>();

      for (const spec of nodeSpecs) {
        const row = await tx.operationalEntityNode.create({
          data: {
            graphEngineVersion: ENGINE,
            aggregateWindow: windowKey,
            idempotencyKey: spec.idempotencyKey,
            entityCategory: spec.entityCategory,
            entityState: spec.entityState,
            payloadJson: spec.payloadJson,
            createdAt: batchAt,
          },
        });
        keyToId.set(spec.idempotencyKey, row.id);
        nodesWritten += 1;
      }

      const edgeRows: Prisma.OperationalEntityEdgeCreateManyInput[] = [];
      for (const e of edgeSpecs) {
        const sid = keyToId.get(e.sourceKey);
        const tid = keyToId.get(e.targetKey);
        if (!sid || !tid) continue;
        edgeRows.push({
          graphEngineVersion: ENGINE,
          aggregateWindow: windowKey,
          sourceNodeId: sid,
          targetNodeId: tid,
          edgeCategory: e.edgeCategory,
          payloadJson: e.payloadJson,
          createdAt: batchAt,
        });
      }

      if (edgeRows.length > 0) {
        await tx.operationalEntityEdge.createMany({ data: edgeRows });
        edgesWritten = edgeRows.length;
      }

      const chronRows: Prisma.OperationalChronologyFrameCreateManyInput[] = [
        {
          graphEngineVersion: ENGINE,
          aggregateWindow: windowKey,
          chronologyCategory:
            OPERATIONAL_CHRONOLOGY_CATEGORY.COORDINATION_CONTEXT_OPENED_V1,
          payloadJson: {
            ...GOVERNANCE_PAYLOAD,
            sequenceIndex: 0,
            label: "Warehouse coordination context opened",
            explainabilityRef: "chronology_coordination_context_opened_v1",
          },
          createdAt: batchAt,
        },
        {
          graphEngineVersion: ENGINE,
          aggregateWindow: windowKey,
          chronologyCategory:
            OPERATIONAL_CHRONOLOGY_CATEGORY.ENTITY_GRAPH_MATERIALIZED_V1,
          payloadJson: {
            ...GOVERNANCE_PAYLOAD,
            sequenceIndex: 1,
            label: "Entity graph materialized",
            nodeCount: nodesWritten,
            edgeCount: edgesWritten,
            explainabilityRef: "chronology_entity_graph_materialized_v1",
          },
          createdAt: batchAt,
        },
        {
          graphEngineVersion: ENGINE,
          aggregateWindow: windowKey,
          chronologyCategory:
            OPERATIONAL_CHRONOLOGY_CATEGORY.INVESTIGATION_BOUNDARY_DISCLOSED_V1,
          payloadJson: {
            ...GOVERNANCE_PAYLOAD,
            sequenceIndex: 2,
            label: "Investigation boundary disclosed",
            boundedWorkflowSamples: workflowSamples.length,
            boundedOperationalIncidents: incidents.length,
            explainabilityRef:
              "chronology_investigation_boundary_disclosed_v1",
          },
          createdAt: batchAt,
        },
      ];

      await tx.operationalChronologyFrame.createMany({
        data: chronRows,
      });
      chronWritten = chronRows.length;

      const sortedNodeSpecs = [...nodeSpecs].sort((a, b) =>
        a.idempotencyKey.localeCompare(b.idempotencyKey),
      );
      const nodeSnapshots = sortedNodeSpecs.map((spec) => ({
        nodeId: keyToId.get(spec.idempotencyKey)!,
        entityCategory: spec.entityCategory,
        entityState: spec.entityState,
        idempotencyKey: spec.idempotencyKey,
        payloadJson: spec.payloadJson,
      }));

      const edgeSnapshots = edgeRows.map((row) => ({
        edgeCategory: row.edgeCategory,
        sourceNodeId: row.sourceNodeId,
        targetNodeId: row.targetNodeId,
        payloadJson: row.payloadJson,
      }));

      const chronologySnapshots = chronRows.map((row) => ({
        chronologyCategory: row.chronologyCategory,
        payloadJson: row.payloadJson,
      }));

      const incidentDigest = incidents.map((i) => ({
        operationalIncidentId: i.id,
        incidentCategory: i.incidentCategory,
        severity: i.severity,
      }));

      const archivePayload: Prisma.InputJsonObject = {
        ...REPLAY_GOVERNANCE_PAYLOAD,
        explainabilityRef: "entity_graph_batch_archive_v1",
        aggregateWindow: windowKey,
        batchCreatedAtIso: batchAt.toISOString(),
        operationalEntityGraphEngineVersion: ENGINE,
        operationalIncidentCoordinationEngineVersion:
          INCIDENT_ENGINE,
        nodeSnapshots: nodeSnapshots as unknown as Prisma.InputJsonValue,
        edgeSnapshots: edgeSnapshots as unknown as Prisma.InputJsonValue,
        chronologySnapshots:
          chronologySnapshots as unknown as Prisma.InputJsonValue,
        incidentDigest:
          incidentDigest as unknown as Prisma.InputJsonValue,
      };

      const hist = await tx.operationalGraphHistory.create({
        data: {
          graphHistoryEngineVersion:
            OPERATIONAL_GRAPH_HISTORY_ENGINE_VERSION,
          aggregateWindow: windowKey,
          historyCategory:
            OPERATIONAL_GRAPH_HISTORY_CATEGORY
              .ENTITY_GRAPH_BATCH_ARCHIVE_V1,
          payloadJson: archivePayload,
          createdAt: batchAt,
        },
      });

      const sess = await tx.operationalReplaySession.create({
        data: {
          replayEngineVersion: OPERATIONAL_REPLAY_ENGINE_VERSION,
          aggregateWindow: windowKey,
          replayCategory:
            OPERATIONAL_REPLAY_CATEGORY.WAREHOUSE_REFRESH_BATCH_V1,
          replayState: OPERATIONAL_REPLAY_STATE.MATERIALIZED_V1,
          graphHistoryId: hist.id,
          payloadJson: {
            ...REPLAY_GOVERNANCE_PAYLOAD,
            explainabilityRef: "warehouse_refresh_replay_session_v1",
            operationalGraphHistoryId: hist.id,
            operationalEntityGraphEngineVersion: ENGINE,
          },
          createdAt: batchAt,
        },
      });

      const replayFrameRows: Prisma.OperationalReplayFrameCreateManyInput[] =
        [
          {
            replayEngineVersion: OPERATIONAL_REPLAY_ENGINE_VERSION,
            replaySessionId: sess.id,
            frameCategory:
              OPERATIONAL_REPLAY_FRAME_CATEGORY
                .GRAPH_RECONSTRUCTION_DIGEST_V1,
            sequenceIndex: 0,
            payloadJson: {
              ...REPLAY_GOVERNANCE_PAYLOAD,
              label: "Historical graph reconstruction digest",
              nodeCount: nodesWritten,
              edgeCount: edgesWritten,
              explainabilityRef:
                "replay_frame_graph_reconstruction_digest_v1",
            },
            createdAt: batchAt,
          },
          {
            replayEngineVersion: OPERATIONAL_REPLAY_ENGINE_VERSION,
            replaySessionId: sess.id,
            frameCategory:
              OPERATIONAL_REPLAY_FRAME_CATEGORY
                .CHRONOLOGY_REPLAY_DIGEST_V1,
            sequenceIndex: 1,
            payloadJson: {
              ...REPLAY_GOVERNANCE_PAYLOAD,
              label: "Operational chronology replay digest",
              chronologyFrameCount: chronRows.length,
              chronologySnapshots:
                chronologySnapshots as unknown as Prisma.InputJsonValue,
              explainabilityRef: "replay_frame_chronology_digest_v1",
            },
            createdAt: batchAt,
          },
          {
            replayEngineVersion: OPERATIONAL_REPLAY_ENGINE_VERSION,
            replaySessionId: sess.id,
            frameCategory:
              OPERATIONAL_REPLAY_FRAME_CATEGORY
                .INVESTIGATION_BOUNDARY_RECALL_V1,
            sequenceIndex: 2,
            payloadJson: {
              ...REPLAY_GOVERNANCE_PAYLOAD,
              label: "Investigation boundary recall",
              boundedWorkflowSamples: workflowSamples.length,
              boundedOperationalIncidents: incidents.length,
              incidentDigest:
                incidentDigest as unknown as Prisma.InputJsonValue,
              explainabilityRef:
                "replay_frame_investigation_boundary_recall_v1",
            },
            createdAt: batchAt,
          },
        ];

      await tx.operationalReplayFrame.createMany({
        data: replayFrameRows,
      });

      graphHistoryWritten = 1;
      replaySessionsWritten = 1;
      replayFramesWritten = replayFrameRows.length;

      const sessTopoPayload = buildTopologySnapshotPayload(archivePayload);
      await tx.operationalTopologySnapshot.upsert({
        where: { replaySessionId: sess.id },
        create: {
          replaySuiteEngineVersion: SUITE_ENGINE,
          aggregateWindow: windowKey,
          replaySessionId: sess.id,
          payloadJson: sessTopoPayload,
          createdAt: batchAt,
        },
        update: {
          payloadJson: sessTopoPayload,
          createdAt: batchAt,
        },
      });
      operationalReplayTopologySnapshotsWritten += 1;

      const sessBridgePayload =
        buildInterventionObservationReplayBridgePayload(archivePayload);
      await tx.operationalReplayInterventionBridge.upsert({
        where: { replaySessionId: sess.id },
        create: {
          replaySuiteEngineVersion: SUITE_ENGINE,
          aggregateWindow: windowKey,
          replaySessionId: sess.id,
          payloadJson: sessBridgePayload,
          createdAt: batchAt,
        },
        update: {
          payloadJson: sessBridgePayload,
          createdAt: batchAt,
        },
      });
      operationalReplayInterventionBridgesWritten += 1;

      const prevSession = await tx.operationalReplaySession.findFirst({
        where: {
          replayEngineVersion: OPERATIONAL_REPLAY_ENGINE_VERSION,
          aggregateWindow: windowKey,
          id: { not: sess.id },
          createdAt: { lt: batchAt },
        },
        orderBy: { createdAt: "desc" },
        include: {
          graphHistory: { select: { payloadJson: true } },
        },
      });

      if (prevSession) {
        const prevTopo = await tx.operationalTopologySnapshot.findUnique({
          where: { replaySessionId: prevSession.id },
        });
        if (!prevTopo && prevSession.graphHistory?.payloadJson != null) {
          await tx.operationalTopologySnapshot.create({
            data: {
              replaySuiteEngineVersion: SUITE_ENGINE,
              aggregateWindow: windowKey,
              replaySessionId: prevSession.id,
              payloadJson: buildTopologySnapshotPayload(
                prevSession.graphHistory.payloadJson,
              ),
              createdAt: prevSession.createdAt,
            },
          });
          operationalReplayTopologySnapshotsWritten += 1;
        }

        const prevBridge =
          await tx.operationalReplayInterventionBridge.findUnique({
            where: { replaySessionId: prevSession.id },
          });
        if (!prevBridge && prevSession.graphHistory?.payloadJson != null) {
          await tx.operationalReplayInterventionBridge.create({
            data: {
              replaySuiteEngineVersion: SUITE_ENGINE,
              aggregateWindow: windowKey,
              replaySessionId: prevSession.id,
              payloadJson:
                buildInterventionObservationReplayBridgePayload(
                  prevSession.graphHistory.payloadJson,
                ),
              createdAt: prevSession.createdAt,
            },
          });
          operationalReplayInterventionBridgesWritten += 1;
        }
      }

      if (prevSession?.graphHistory) {
        const olderPayload = prevSession.graphHistory.payloadJson;
        const olderRoot =
          olderPayload &&
          typeof olderPayload === "object" &&
          !Array.isArray(olderPayload) ?
            (olderPayload as Record<string, unknown>)
          : {};
        const olderIso =
          typeof olderRoot.batchCreatedAtIso === "string" ?
            olderRoot.batchCreatedAtIso
          : null;

        const analysis = buildConsecutiveBatchReplayAnalysis({
          olderArchivePayload: olderPayload,
          newerArchivePayload: archivePayload,
          aggregateWindow: windowKey,
          olderBatchCreatedAtIso: olderIso,
          newerBatchCreatedAtIso: batchAt.toISOString(),
        });

        const diffRow = await tx.operationalReplayDiff.create({
          data: {
            replayAnalysisEngineVersion:
              OPERATIONAL_REPLAY_ANALYSIS_ENGINE_VERSION,
            aggregateWindow: windowKey,
            diffCategory:
              OPERATIONAL_REPLAY_DIFF_CATEGORY
                .CONSECUTIVE_WAREHOUSE_BATCH_V1,
            sourceReplaySessionId: prevSession.id,
            comparisonReplaySessionId: sess.id,
            payloadJson: analysis.diffPayload,
            createdAt: batchAt,
          },
        });
        replayDiffsWritten = 1;

        await tx.operationalChronologyDelta.create({
          data: {
            replayAnalysisEngineVersion:
              OPERATIONAL_REPLAY_ANALYSIS_ENGINE_VERSION,
            aggregateWindow: windowKey,
            operationalReplayDiffId: diffRow.id,
            deltaCategory:
              OPERATIONAL_CHRONOLOGY_DELTA_CATEGORY
                .AGGREGATED_SEQUENCE_COMPARISON_V1,
            payloadJson: analysis.chronologyDeltaPayload,
            createdAt: batchAt,
          },
        });
        chronologyDeltasWritten = 1;

        await tx.replayInterpretationSnapshot.create({
          data: {
            replayAnalysisEngineVersion:
              OPERATIONAL_REPLAY_ANALYSIS_ENGINE_VERSION,
            aggregateWindow: windowKey,
            operationalReplayDiffId: diffRow.id,
            interpretationCategory:
              REPLAY_INTERPRETATION_CATEGORY
                .DETERMINISTIC_TEMPLATE_NARRATIVE_V1,
            payloadJson: analysis.interpretationPayload,
            createdAt: batchAt,
          },
        });
        replayInterpretationSnapshotsWritten = 1;

        await tx.operationalReplayPairing.create({
          data: {
            replaySuiteEngineVersion: SUITE_ENGINE,
            aggregateWindow: windowKey,
            pairingCategory:
              OPERATIONAL_REPLAY_PAIRING_CATEGORY
                .CONSECUTIVE_REFRESH_LINEAGE_V1,
            orderedOlderReplaySessionId: prevSession.id,
            orderedNewerReplaySessionId: sess.id,
            operationalReplayDiffId: diffRow.id,
            payloadJson: {
              ...(analysis.pairingObservationPayload as Record<
                string,
                unknown
              >),
              orderedOlderReplaySessionId: prevSession.id,
              orderedNewerReplaySessionId: sess.id,
              consecutiveWarehouseRefreshLineageV1: true,
            },
            createdAt: batchAt,
          },
        });
        operationalReplayPairingsWritten += 1;

        await tx.operationalChronologySemanticAlignment.create({
          data: {
            replaySuiteEngineVersion: SUITE_ENGINE,
            aggregateWindow: windowKey,
            operationalReplayDiffId: diffRow.id,
            payloadJson: analysis.semanticAlignmentPayload,
            createdAt: batchAt,
          },
        });
        operationalChronologySemanticAlignmentsWritten += 1;
      }
    });

    this.log.log({
      msg: "OPERATIONAL_ENTITY_GRAPH_REFRESH",
      aggregateWindow: windowKey,
      operationalEntityNodesWritten: nodesWritten,
      operationalEntityEdgesWritten: edgesWritten,
      operationalChronologyFramesWritten: chronWritten,
      operationalGraphHistoryWritten: graphHistoryWritten,
      operationalReplaySessionsWritten: replaySessionsWritten,
      operationalReplayFramesWritten: replayFramesWritten,
      operationalReplayDiffsWritten: replayDiffsWritten,
      operationalChronologyDeltasWritten: chronologyDeltasWritten,
      replayInterpretationSnapshotsWritten,
      operationalReplayPairingsWritten,
      operationalChronologySemanticAlignmentsWritten,
      operationalReplayTopologySnapshotsWritten,
      operationalReplayInterventionBridgesWritten,
    });

    return {
      operationalEntityNodesWritten: nodesWritten,
      operationalEntityEdgesWritten: edgesWritten,
      operationalChronologyFramesWritten: chronWritten,
      operationalGraphHistoryWritten: graphHistoryWritten,
      operationalReplaySessionsWritten: replaySessionsWritten,
      operationalReplayFramesWritten: replayFramesWritten,
      operationalReplayDiffsWritten: replayDiffsWritten,
      operationalChronologyDeltasWritten: chronologyDeltasWritten,
      replayInterpretationSnapshotsWritten,
      operationalReplayPairingsWritten,
      operationalChronologySemanticAlignmentsWritten,
      operationalReplayTopologySnapshotsWritten,
      operationalReplayInterventionBridgesWritten,
    };
  }
}
