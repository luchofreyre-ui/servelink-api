import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { WORKFLOW_ACTIVATION_STATE } from "../workflow/workflow-execution-activation.constants";
import {
  OPERATIONAL_SAFETY_SEVERITY,
  WORKFLOW_SIMULATION_STATE,
} from "../workflow/workflow-orchestration-simulation.constants";
import { WORKFLOW_EXECUTION_STATE } from "../workflow/workflow.constants";
import {
  OPERATIONAL_DRIFT_CATEGORY,
  OPERATIONAL_OUTCOME_DRIFT_SEVERITY,
  OPERATIONAL_OUTCOME_ENGINE_VERSION,
  SIMULATION_ACCURACY_CATEGORY,
  WORKFLOW_OUTCOME_EVALUATION_CATEGORY,
  WORKFLOW_OUTCOME_EVALUATION_RESULT,
} from "./operational-outcome.constants";
import { OPERATIONAL_ANALYTICS_ENGINE_VERSION } from "./operational-analytics.constants";

const GOVERNANCE_PAYLOAD = {
  noAutonomousOptimization: true,
  noAiExecutionAuthority: true,
  observabilityOnly: true,
} satisfies Prisma.InputJsonObject;

function mapActivationInvokeOutcome(state: string): {
  effectivenessScore: number;
  evaluationResult: string;
} {
  switch (state) {
    case WORKFLOW_EXECUTION_STATE.COMPLETED:
      return {
        effectivenessScore: 100,
        evaluationResult: WORKFLOW_OUTCOME_EVALUATION_RESULT.TERMINAL_SUCCESS_V1,
      };
    case WORKFLOW_EXECUTION_STATE.FAILED:
      return {
        effectivenessScore: 0,
        evaluationResult: WORKFLOW_OUTCOME_EVALUATION_RESULT.TERMINAL_FAILURE_V1,
      };
    case WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL:
      return {
        effectivenessScore: 55,
        evaluationResult: WORKFLOW_OUTCOME_EVALUATION_RESULT.WAITING_HUMAN_V1,
      };
    case WORKFLOW_EXECUTION_STATE.CANCELLED:
      return {
        effectivenessScore: 30,
        evaluationResult: WORKFLOW_OUTCOME_EVALUATION_RESULT.CANCELLED_CONTEXT_V1,
      };
    default:
      return {
        effectivenessScore: 65,
        evaluationResult: WORKFLOW_OUTCOME_EVALUATION_RESULT.MIDFLIGHT_NEUTRAL_V1,
      };
  }
}

function pickSimulationAttentionSummary(
  resultJson: unknown,
): { attention: number; info: number; total: number } | null {
  if (!resultJson || typeof resultJson !== "object") return null;
  const root = resultJson as Record<string, unknown>;
  const summary = root.evaluationSummary;
  if (!summary || typeof summary !== "object") return null;
  const s = summary as Record<string, unknown>;
  const attention = Number(s.attention);
  const info = Number(s.info);
  const total = Number(s.total);
  if (
    !Number.isFinite(attention) ||
    !Number.isFinite(info) ||
    !Number.isFinite(total)
  ) {
    return null;
  }
  return { attention, info, total };
}

/**
 * Deterministic closed-loop observations — warehouse refresh only; no autonomous learning loops.
 */
@Injectable()
export class OperationalOutcomeAggregationService {
  private readonly log = new Logger(OperationalOutcomeAggregationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async refreshOperationalOutcomeIntelligence(params: {
    aggregateWindow: string;
    batchCreatedAt: Date;
    priorWarehouseMetrics: Record<string, number> | null;
    currentWarehouseMetrics: Record<string, number>;
  }): Promise<{
    workflowOutcomeEvaluationsWritten: number;
    simulationAccuracySnapshotsWritten: number;
    operationalDriftSnapshotsWritten: number;
  }> {
    const ENGINE = OPERATIONAL_OUTCOME_ENGINE_VERSION;
    const windowKey = params.aggregateWindow;
    const batchAt = params.batchCreatedAt;

    const outcomeRows = await this.buildWorkflowOutcomeEvaluationRows({
      aggregateWindow: windowKey,
      batchCreatedAt: batchAt,
    });

    const simulationRows = await this.buildSimulationAccuracyRows({
      aggregateWindow: windowKey,
      batchCreatedAt: batchAt,
    });

    const driftRows = this.buildWarehouseDriftRows({
      aggregateWindow: windowKey,
      batchCreatedAt: batchAt,
      prior: params.priorWarehouseMetrics,
      current: params.currentWarehouseMetrics,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.workflowOutcomeEvaluation.deleteMany({
        where: { outcomeEngineVersion: ENGINE, aggregateWindow: windowKey },
      });
      await tx.simulationAccuracySnapshot.deleteMany({
        where: { outcomeEngineVersion: ENGINE, aggregateWindow: windowKey },
      });

      if (outcomeRows.length > 0) {
        await tx.workflowOutcomeEvaluation.createMany({ data: outcomeRows });
      }
      if (simulationRows.length > 0) {
        await tx.simulationAccuracySnapshot.createMany({ data: simulationRows });
      }
      if (driftRows.length > 0) {
        await tx.operationalDriftSnapshot.createMany({ data: driftRows });
      }
    });

    this.log.log({
      msg: "OPERATIONAL_OUTCOME_INTELLIGENCE_REFRESH",
      aggregateWindow: windowKey,
      workflowOutcomeEvaluationsWritten: outcomeRows.length,
      simulationAccuracySnapshotsWritten: simulationRows.length,
      operationalDriftSnapshotsWritten: driftRows.length,
    });

    return {
      workflowOutcomeEvaluationsWritten: outcomeRows.length,
      simulationAccuracySnapshotsWritten: simulationRows.length,
      operationalDriftSnapshotsWritten: driftRows.length,
    };
  }

  private async buildWorkflowOutcomeEvaluationRows(args: {
    aggregateWindow: string;
    batchCreatedAt: Date;
  }): Promise<Prisma.WorkflowOutcomeEvaluationCreateManyInput[]> {
    const ENGINE = OPERATIONAL_OUTCOME_ENGINE_VERSION;
    const invoked = await this.prisma.workflowExecutionActivation.findMany({
      where: { activationState: WORKFLOW_ACTIVATION_STATE.INVOKED },
      orderBy: { updatedAt: "desc" },
      take: 150,
      select: {
        id: true,
        workflowExecutionId: true,
        updatedAt: true,
      },
    });

    if (invoked.length === 0) return [];

    const wfIds = [...new Set(invoked.map((r) => r.workflowExecutionId))];
    const executions = await this.prisma.workflowExecution.findMany({
      where: { id: { in: wfIds } },
      select: {
        id: true,
        state: true,
        executionStage: true,
        approvalState: true,
      },
    });
    const wfById = new Map(executions.map((w) => [w.id, w]));

    const rows: Prisma.WorkflowOutcomeEvaluationCreateManyInput[] = [];
    for (const act of invoked) {
      const wf = wfById.get(act.workflowExecutionId);
      if (!wf) continue;

      const mapped = mapActivationInvokeOutcome(wf.state);
      rows.push({
        outcomeEngineVersion: ENGINE,
        aggregateWindow: args.aggregateWindow,
        workflowExecutionId: wf.id,
        activationId: act.id,
        evaluationCategory:
          WORKFLOW_OUTCOME_EVALUATION_CATEGORY.ACTIVATION_POST_INVOKE_POSTURE_V1,
        evaluationResult: mapped.evaluationResult,
        effectivenessScore: mapped.effectivenessScore,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          analyticsEngineVersionRef: OPERATIONAL_ANALYTICS_ENGINE_VERSION,
          activationObservedAtIso: act.updatedAt.toISOString(),
          workflowState: wf.state,
          executionStage: wf.executionStage,
          approvalState: wf.approvalState,
          explainabilityRef:
            "activation_post_invoke_posture_v1_effectiveness_mapping",
        } satisfies Prisma.InputJsonObject,
        createdAt: args.batchCreatedAt,
      });
    }
    return rows;
  }

  private async buildSimulationAccuracyRows(args: {
    aggregateWindow: string;
    batchCreatedAt: Date;
  }): Promise<Prisma.SimulationAccuracySnapshotCreateManyInput[]> {
    const ENGINE = OPERATIONAL_OUTCOME_ENGINE_VERSION;
    const since72h = new Date(args.batchCreatedAt.getTime() - 72 * 60 * 60 * 1000);

    const scenarios = await this.prisma.workflowSimulationScenario.findMany({
      where: {
        simulationState: WORKFLOW_SIMULATION_STATE.COMPLETED,
        createdAt: { gte: since72h },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        workflowExecutionId: true,
        resultJson: true,
        createdAt: true,
      },
    });

    const rows: Prisma.SimulationAccuracySnapshotCreateManyInput[] = [];

    for (const scenario of scenarios) {
      const predicted = pickSimulationAttentionSummary(scenario.resultJson);
      if (!predicted) continue;

      const liveAttentionAfter = await this.prisma.operationalSafetyEvaluation.count(
        {
          where: {
            workflowExecutionId: scenario.workflowExecutionId,
            severity: OPERATIONAL_SAFETY_SEVERITY.ATTENTION,
            NOT: { simulationScenarioId: scenario.id },
            createdAt: { gt: scenario.createdAt },
          },
        },
      );

      const delta = Math.abs(predicted.attention - liveAttentionAfter);
      const tolerance = 1;
      const alignment =
        delta <= tolerance ? "within_tolerance_v1" : "divergent_v1";

      rows.push({
        outcomeEngineVersion: ENGINE,
        aggregateWindow: args.aggregateWindow,
        workflowExecutionId: scenario.workflowExecutionId,
        simulationScenarioId: scenario.id,
        accuracyCategory: SIMULATION_ACCURACY_CATEGORY.PREDICTED_VS_LIVE_ATTENTION_EVAL_V1,
        predictedJson: {
          simulatedAttentionCount: predicted.attention,
          simulatedInfoCount: predicted.info,
          simulatedTotalSpecs: predicted.total,
        } satisfies Prisma.InputJsonObject,
        actualJson: {
          liveAttentionEvaluationsAfterSimulation: liveAttentionAfter,
          observationCutoffIso: args.batchCreatedAt.toISOString(),
        } satisfies Prisma.InputJsonObject,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          alignment,
          attentionDelta: predicted.attention - liveAttentionAfter,
          tolerance,
          explainabilityRef: "predicted_vs_live_attention_eval_v1",
          simulationCompletedAtIso: scenario.createdAt.toISOString(),
        } satisfies Prisma.InputJsonObject,
        createdAt: args.batchCreatedAt,
      });
    }

    return rows;
  }

  private buildWarehouseDriftRows(args: {
    aggregateWindow: string;
    batchCreatedAt: Date;
    prior: Record<string, number> | null;
    current: Record<string, number>;
  }): Prisma.OperationalDriftSnapshotCreateManyInput[] {
    if (!args.prior || Object.keys(args.prior).length === 0) return [];

    const ENGINE = OPERATIONAL_OUTCOME_ENGINE_VERSION;
    const deltas: Array<{
      metricKey: string;
      prior: number;
      current: number;
      delta: number;
    }> = [];

    for (const [metricKey, curVal] of Object.entries(args.current)) {
      if (!(metricKey in args.prior)) continue;
      const prevVal = args.prior[metricKey];
      if (typeof prevVal !== "number" || typeof curVal !== "number") continue;
      const delta = curVal - prevVal;
      if (delta === 0) continue;
      deltas.push({ metricKey, prior: prevVal, current: curVal, delta });
    }

    deltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    const rows: Prisma.OperationalDriftSnapshotCreateManyInput[] = [];
    for (const d of deltas.slice(0, 14)) {
      const mag = Math.abs(d.delta);
      const severity =
        mag <= 3 ?
          OPERATIONAL_OUTCOME_DRIFT_SEVERITY.INFO
        : OPERATIONAL_OUTCOME_DRIFT_SEVERITY.ATTENTION;

      rows.push({
        outcomeEngineVersion: ENGINE,
        aggregateWindow: args.aggregateWindow,
        driftCategory: OPERATIONAL_DRIFT_CATEGORY.WAREHOUSE_METRIC_REFRESH_DELTA_V1,
        severity,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          metricKey: d.metricKey,
          priorWarehouseValue: d.prior,
          currentWarehouseValue: d.current,
          delta: d.delta,
          explainabilityRef: "consecutive_refresh_metric_delta_v1",
        } satisfies Prisma.InputJsonObject,
        createdAt: args.batchCreatedAt,
      });
    }

    return rows;
  }
}
