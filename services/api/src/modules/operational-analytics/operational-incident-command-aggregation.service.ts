import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { OperationalPortfolioOrchestrationService } from "../workflow/operational-portfolio-orchestration.service";
import {
  WORKFLOW_GOVERNANCE_OUTCOME_STEP,
} from "../workflow/workflow.constants";
import {
  OPERATIONAL_BALANCING_ENGINE_VERSION,
  BALANCING_SIGNAL_SEVERITY,
  WORKFLOW_CONGESTION_ENGINE_VERSION,
} from "./operational-balancing.constants";
import {
  assertPolicyAnalyticsVersionAlignment,
  OPERATIONAL_ANALYTICS_GOVERNANCE_VERSION,
} from "./operational-analytics-governance";
import { OPERATIONAL_ANALYTICS_ENGINE_VERSION } from "./operational-analytics.constants";
import {
  OPERATIONAL_INCIDENT_CATEGORY,
  OPERATIONAL_INCIDENT_ENGINE_VERSION,
  OPERATIONAL_INCIDENT_LINK_TYPE,
  OPERATIONAL_INCIDENT_SEVERITY,
  OPERATIONAL_INCIDENT_STATE,
  OPERATIONAL_INVESTIGATION_TRAIL_CATEGORY,
} from "./operational-incident-command.constants";
import { OPERATIONAL_VALIDITY_CERT_ENGINE_VERSION } from "./operational-intervention-validity.constants";

type IncidentSpec = {
  idempotencyKey: string;
  incidentCategory: string;
  severity: string;
  payloadJson: Prisma.InputJsonObject;
  drilldownHints: Array<{
    path: string;
    anchor?: string;
    label: string;
  }>;
};

const GOVERNANCE_PAYLOAD = {
  noAutonomousOperationalResolution: true,
  noAiExecutionAuthority: true,
  observabilityCoordinateRouteOnly: true,
  drilldownHintsAreNonExecuting: true,
} satisfies Prisma.InputJsonObject;

function validityStructuralAttention(state: string): boolean {
  return (
    state.includes("attention") ||
    state.includes("skew") ||
    state.includes("insufficient_sample")
  );
}

/**
 * Phase 30 — coordination incidents + drilldown link graph from warehouse refresh context only.
 */
@Injectable()
export class OperationalIncidentCommandAggregationService {
  private readonly log = new Logger(
    OperationalIncidentCommandAggregationService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly portfolio: OperationalPortfolioOrchestrationService,
  ) {}

  async refreshOperationalIncidentCommandBatch(params: {
    aggregateWindow: string;
    batchCreatedAt: Date;
  }): Promise<{
    operationalIncidentsWritten: number;
    operationalIncidentLinksWritten: number;
    operationalInvestigationTrailsWritten: number;
  }> {
    const windowKey = params.aggregateWindow;
    const batchAt = params.batchCreatedAt;
    const ENGINE = OPERATIONAL_INCIDENT_ENGINE_VERSION;
    const BAL_ENGINE = OPERATIONAL_BALANCING_ENGINE_VERSION;
    const VALIDITY_ENGINE = OPERATIONAL_VALIDITY_CERT_ENGINE_VERSION;
    const CONG_ENGINE = WORKFLOW_CONGESTION_ENGINE_VERSION;

    const pf =
      await this.portfolio.getAdminPortfolioOrchestrationSummary();
    const os = pf.orchestrationSafety;

    const since24h = new Date(batchAt.getTime() - 24 * 60 * 60 * 1000);
    const since7d = new Date(batchAt.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [deliveryAttempts24h, deliverySuccess24h, govStepsBlocked7d] =
      await Promise.all([
        this.prisma.operationalOutboxDeliveryAttempt.count({
          where: { createdAt: { gte: since24h } },
        }),
        this.prisma.operationalOutboxDeliveryAttempt.count({
          where: { createdAt: { gte: since24h }, success: true },
        }),
        this.prisma.workflowExecutionStep.count({
          where: {
            governanceOutcome: WORKFLOW_GOVERNANCE_OUTCOME_STEP.BLOCKED,
            failedAt: { gte: since7d },
          },
        }),
      ]);

    const openEscalations = pf.openEscalations;

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

    const congestionStamp =
      await this.prisma.workflowCongestionSnapshot.findFirst({
        where: {
          congestionEngineVersion: CONG_ENGINE,
          aggregateWindow: windowKey,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

    const congestionRows =
      congestionStamp ?
        await this.prisma.workflowCongestionSnapshot.findMany({
          where: {
            congestionEngineVersion: CONG_ENGINE,
            aggregateWindow: windowKey,
            createdAt: congestionStamp.createdAt,
          },
          select: { severity: true },
        })
      : [];

    const balAttention = balancingRows.filter(
      (r) => r.severity === BALANCING_SIGNAL_SEVERITY.ATTENTION,
    ).length;
    const congAttention = congestionRows.filter(
      (r) => r.severity === BALANCING_SIGNAL_SEVERITY.ATTENTION,
    ).length;

    const validityStamp =
      await this.prisma.operationalValidityCertification.findFirst({
        where: {
          validityEngineVersion: VALIDITY_ENGINE,
          aggregateWindow: windowKey,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

    const validityRows =
      validityStamp ?
        await this.prisma.operationalValidityCertification.findMany({
          where: {
            validityEngineVersion: VALIDITY_ENGINE,
            aggregateWindow: windowKey,
            createdAt: validityStamp.createdAt,
          },
          select: { certificationCategory: true, certificationState: true },
        })
      : [];

    const interventionValidityAttention = validityRows.some((v) =>
      validityStructuralAttention(v.certificationState),
    );

    const pendingDenom = Math.max(pf.pendingApprovals, 1);
    const escRatio = openEscalations / pendingDenom;

    const policyAlignment = assertPolicyAnalyticsVersionAlignment();

    const specs: IncidentSpec[] = [];

    if (
      pf.workflowsGovernanceBlocked > 0 ||
      pf.overdueWorkflowTimers > 0 ||
      govStepsBlocked7d >= 5
    ) {
      specs.push({
        idempotencyKey: `${windowKey}:governance_execution_pressure_v1`,
        incidentCategory:
          OPERATIONAL_INCIDENT_CATEGORY.GOVERNANCE_EXECUTION_PRESSURE_V1,
        severity: OPERATIONAL_INCIDENT_SEVERITY.ATTENTION,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          analyticsGovernanceVersionRef:
            OPERATIONAL_ANALYTICS_GOVERNANCE_VERSION,
          analyticsEngineVersionRef: OPERATIONAL_ANALYTICS_ENGINE_VERSION,
          workflowsGovernanceBlocked: pf.workflowsGovernanceBlocked,
          overdueWorkflowTimers: pf.overdueWorkflowTimers,
          governanceStepsBlocked7d: govStepsBlocked7d,
          explainabilityRef: "governance_execution_pressure_cluster_v1",
        },
        drilldownHints: [
          {
            path: "/admin/ops",
            anchor: "operational-attention-routing",
            label: "Attention routing",
          },
          {
            path: "/admin/anomalies",
            label: "Operational anomalies consoles",
          },
        ],
      });
    }

    if (
      pf.waitingApprovalWorkflowsAged72hPlus > 0 ||
      openEscalations >= 3 ||
      escRatio >= 0.35
    ) {
      specs.push({
        idempotencyKey: `${windowKey}:approval_escalation_pressure_v1`,
        incidentCategory:
          OPERATIONAL_INCIDENT_CATEGORY.APPROVAL_ESCALATION_PRESSURE_V1,
        severity: OPERATIONAL_INCIDENT_SEVERITY.ATTENTION,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          waitingApprovalWorkflowsAged72hPlus:
            pf.waitingApprovalWorkflowsAged72hPlus,
          openEscalations,
          pendingApprovals: pf.pendingApprovals,
          escalationOpenPerPendingApprox: escRatio,
          explainabilityRef: "approval_escalation_pressure_cluster_v1",
        },
        drilldownHints: [
          { path: "/admin/ops", label: "Command center" },
          {
            path: "/admin/exceptions",
            label: "Dispatch exceptions queue",
          },
        ],
      });
    }

    if (balAttention > 0 || congAttention > 0) {
      specs.push({
        idempotencyKey: `${windowKey}:balancing_congestion_pressure_v1`,
        incidentCategory:
          OPERATIONAL_INCIDENT_CATEGORY.BALANCING_CONGESTION_PRESSURE_V1,
        severity: OPERATIONAL_INCIDENT_SEVERITY.ATTENTION,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          balancingAttentionRows: balAttention,
          congestionAttentionRows: congAttention,
          explainabilityRef: "balancing_congestion_pressure_cluster_v1",
        },
        drilldownHints: [
          {
            path: "/admin/ops",
            anchor: "operational-attention-routing",
            label: "Balancing context (command center)",
          },
          { path: "/admin/dispatch-config", label: "Dispatch config" },
        ],
      });
    }

    if (
      deliveryAttempts24h > 10 &&
      deliverySuccess24h < deliveryAttempts24h * 0.85
    ) {
      specs.push({
        idempotencyKey: `${windowKey}:delivery_reliability_pressure_v1`,
        incidentCategory:
          OPERATIONAL_INCIDENT_CATEGORY.DELIVERY_RELIABILITY_PRESSURE_V1,
        severity: OPERATIONAL_INCIDENT_SEVERITY.ATTENTION,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          deliveryAttempts24h,
          deliverySuccess24h,
          explainabilityRef: "delivery_reliability_pressure_cluster_v1",
        },
        drilldownHints: [
          { path: "/admin/ops", label: "Command center delivery tiles" },
          { path: "/admin/anomalies", label: "Ops anomalies" },
        ],
      });
    }

    if (
      os.safetyEvaluationsAttentionLast24h >= 6 ||
      os.dryRunsFailedLast24h >= 3
    ) {
      specs.push({
        idempotencyKey: `${windowKey}:simulation_lab_pressure_v1`,
        incidentCategory:
          OPERATIONAL_INCIDENT_CATEGORY.SIMULATION_LAB_PRESSURE_V1,
        severity: OPERATIONAL_INCIDENT_SEVERITY.ATTENTION,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          safetyEvaluationsAttentionLast24h:
            os.safetyEvaluationsAttentionLast24h,
          dryRunsFailedLast24h: os.dryRunsFailedLast24h,
          simulationsCompletedLast24h: os.simulationsCompletedLast24h,
          explainabilityRef: "simulation_lab_pressure_cluster_v1",
        },
        drilldownHints: [
          {
            path: "/admin/ops",
            label: "Operational intelligence (simulation strips)",
          },
        ],
      });
    }

    if (interventionValidityAttention) {
      specs.push({
        idempotencyKey: `${windowKey}:intervention_validity_pressure_v1`,
        incidentCategory:
          OPERATIONAL_INCIDENT_CATEGORY.INTERVENTION_VALIDITY_PRESSURE_V1,
        severity: OPERATIONAL_INCIDENT_SEVERITY.ATTENTION,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          validityCertificationsObserved: validityRows.length,
          explainabilityRef: "intervention_validity_pressure_cluster_v1",
        },
        drilldownHints: [
          {
            path: "/admin/ops",
            label: "Intervention validity card (ops)",
          },
        ],
      });
    }

    if (
      !policyAlignment.aligned ||
      pf.policyAttentionEvaluations >= 25
    ) {
      specs.push({
        idempotencyKey: `${windowKey}:policy_surface_pressure_v1`,
        incidentCategory:
          OPERATIONAL_INCIDENT_CATEGORY.POLICY_SURFACE_PRESSURE_V1,
        severity: OPERATIONAL_INCIDENT_SEVERITY.ATTENTION,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          policyEngineAligned: policyAlignment.aligned,
          analyticsRefsPolicy: policyAlignment.analyticsRefsPolicy,
          activePolicyEngine: policyAlignment.activePolicyEngine,
          policyAttentionEvaluations: pf.policyAttentionEvaluations,
          explainabilityRef: "policy_surface_pressure_cluster_v1",
        },
        drilldownHints: [
          { path: "/admin/ops", label: "Policy alignment banner (ops)" },
          { path: "/admin/knowledge-ops", label: "Knowledge ops" },
        ],
      });
    }

    let linksWritten = 0;
    let trailsWritten = 0;

    await this.prisma.$transaction(async (tx) => {
      await tx.operationalInvestigationTrail.deleteMany({
        where: {
          incidentEngineVersion: ENGINE,
          aggregateWindow: windowKey,
        },
      });
      await tx.operationalIncidentLink.deleteMany({
        where: {
          incidentEngineVersion: ENGINE,
          aggregateWindow: windowKey,
        },
      });
      await tx.operationalIncident.deleteMany({
        where: {
          incidentEngineVersion: ENGINE,
          aggregateWindow: windowKey,
        },
      });

      for (const spec of specs) {
        const inc = await tx.operationalIncident.create({
          data: {
            incidentEngineVersion: ENGINE,
            aggregateWindow: windowKey,
            idempotencyKey: spec.idempotencyKey,
            incidentCategory: spec.incidentCategory,
            incidentState:
              OPERATIONAL_INCIDENT_STATE.OPEN_COORDINATION_OBSERVATION_V1,
            severity: spec.severity,
            payloadJson: spec.payloadJson,
            createdAt: batchAt,
          },
        });

        const linkRows: Prisma.OperationalIncidentLinkCreateManyInput[] =
          spec.drilldownHints.map((h) => ({
            incidentEngineVersion: ENGINE,
            aggregateWindow: windowKey,
            incidentId: inc.id,
            linkedObjectType:
              OPERATIONAL_INCIDENT_LINK_TYPE.ADMIN_ROUTE_DRILLDOWN_V1,
            linkedObjectId: h.path,
            payloadJson: {
              ...GOVERNANCE_PAYLOAD,
              routeLabel: h.label,
              routeAnchor: h.anchor ?? null,
              explainabilityRef: "admin_route_drilldown_v1_non_executing",
            } satisfies Prisma.InputJsonObject,
            createdAt: batchAt,
          }));

        if (linkRows.length > 0) {
          await tx.operationalIncidentLink.createMany({ data: linkRows });
          linksWritten += linkRows.length;
        }

        const trailRows: Prisma.OperationalInvestigationTrailCreateManyInput[] =
          [
            {
              incidentEngineVersion: ENGINE,
              aggregateWindow: windowKey,
              incidentId: inc.id,
              trailCategory:
                OPERATIONAL_INVESTIGATION_TRAIL_CATEGORY.COORDINATION_OPENED_V1,
              payloadJson: {
                ...GOVERNANCE_PAYLOAD,
                coordinationLane: "warehouse_refresh_coordination_v1",
                explainabilityRef: "coordination_opened_v1",
              } satisfies Prisma.InputJsonObject,
              createdAt: batchAt,
            },
            {
              incidentEngineVersion: ENGINE,
              aggregateWindow: windowKey,
              incidentId: inc.id,
              trailCategory:
                OPERATIONAL_INVESTIGATION_TRAIL_CATEGORY.INVESTIGATION_GRAPH_SNAPSHOT_V1,
              payloadJson: {
                ...GOVERNANCE_PAYLOAD,
                drilldownEdgeCount: linkRows.length,
                incidentCategory: spec.incidentCategory,
                explainabilityRef: "investigation_graph_snapshot_v1",
              } satisfies Prisma.InputJsonObject,
              createdAt: batchAt,
            },
          ];

        await tx.operationalInvestigationTrail.createMany({
          data: trailRows,
        });
        trailsWritten += trailRows.length;
      }
    });

    this.log.log({
      msg: "OPERATIONAL_INCIDENT_COMMAND_REFRESH",
      aggregateWindow: windowKey,
      operationalIncidentsWritten: specs.length,
      operationalIncidentLinksWritten: linksWritten,
      operationalInvestigationTrailsWritten: trailsWritten,
    });

    return {
      operationalIncidentsWritten: specs.length,
      operationalIncidentLinksWritten: linksWritten,
      operationalInvestigationTrailsWritten: trailsWritten,
    };
  }
}
