import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import {
  OPERATIONAL_BALANCING_ENGINE_VERSION,
  BALANCING_SIGNAL_SEVERITY,
} from "./operational-balancing.constants";
import {
  OPERATIONAL_EXPERIMENT_CATEGORY,
  OPERATIONAL_EXPERIMENT_ENGINE_VERSION,
  OPERATIONAL_EXPERIMENT_EVALUATION_RESULT,
  WORKFLOW_BENCHMARK_CATEGORY,
  WORKFLOW_BENCHMARK_ENGINE_VERSION,
  WORKFLOW_BENCHMARK_STATE,
} from "./operational-benchmark.constants";
import {
  OPERATIONAL_OUTCOME_DRIFT_SEVERITY,
  OPERATIONAL_OUTCOME_ENGINE_VERSION,
} from "./operational-outcome.constants";

const GOVERNANCE_PAYLOAD = {
  noAutonomousOptimization: true,
  noAiExecutionAuthority: true,
  observabilityOnly: true,
  benchmarkingObservesOnly: true,
} satisfies Prisma.InputJsonObject;

function pickAlignment(payloadJson: unknown): string | null {
  if (!payloadJson || typeof payloadJson !== "object") return null;
  const a = (payloadJson as Record<string, unknown>).alignment;
  return typeof a === "string" ? a : null;
}

/**
 * Phase 24 — deterministic benchmarking + experiment summaries (warehouse refresh only).
 */
@Injectable()
export class OperationalBenchmarkAggregationService {
  private readonly log = new Logger(OperationalBenchmarkAggregationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async refreshOperationalBenchmarkBatch(params: {
    aggregateWindow: string;
    batchCreatedAt: Date;
    priorWarehouseMetrics: Record<string, number> | null;
    currentWarehouseMetrics: Record<string, number>;
  }): Promise<{
    workflowBenchmarkScenariosWritten: number;
    operationalExperimentSnapshotsWritten: number;
  }> {
    const windowKey = params.aggregateWindow;
    const batchAt = params.batchCreatedAt;
    const OUTCOME_ENGINE = OPERATIONAL_OUTCOME_ENGINE_VERSION;
    const BENCH_ENGINE = WORKFLOW_BENCHMARK_ENGINE_VERSION;
    const EXP_ENGINE = OPERATIONAL_EXPERIMENT_ENGINE_VERSION;

    const [outcomes, simAcc, drifts] = await Promise.all([
      this.prisma.workflowOutcomeEvaluation.findMany({
        where: {
          outcomeEngineVersion: OUTCOME_ENGINE,
          aggregateWindow: windowKey,
          createdAt: batchAt,
        },
        select: {
          effectivenessScore: true,
          evaluationResult: true,
          workflowExecutionId: true,
        },
      }),
      this.prisma.simulationAccuracySnapshot.findMany({
        where: {
          outcomeEngineVersion: OUTCOME_ENGINE,
          aggregateWindow: windowKey,
          createdAt: batchAt,
        },
        select: {
          workflowExecutionId: true,
          simulationScenarioId: true,
          accuracyCategory: true,
          predictedJson: true,
          actualJson: true,
          payloadJson: true,
        },
      }),
      this.prisma.operationalDriftSnapshot.findMany({
        where: {
          outcomeEngineVersion: OUTCOME_ENGINE,
          aggregateWindow: windowKey,
          createdAt: batchAt,
        },
        select: { severity: true, driftCategory: true },
      }),
    ]);

    const balancingStamp =
      await this.prisma.operationalBalancingSnapshot.findFirst({
        where: {
          balancingEngineVersion: OPERATIONAL_BALANCING_ENGINE_VERSION,
          aggregateWindow: windowKey,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

    const balancingRows = balancingStamp
      ? await this.prisma.operationalBalancingSnapshot.findMany({
          where: {
            balancingEngineVersion: OPERATIONAL_BALANCING_ENGINE_VERSION,
            aggregateWindow: windowKey,
            createdAt: balancingStamp.createdAt,
          },
          select: { severity: true },
        })
      : [];

    const balancingAttentionRows = balancingRows.filter(
      (r) => r.severity === BALANCING_SIGNAL_SEVERITY.ATTENTION,
    ).length;

    let aligned = 0;
    let divergent = 0;
    let unknownAlignment = 0;
    for (const row of simAcc) {
      const a = pickAlignment(row.payloadJson);
      if (a === "within_tolerance_v1") aligned++;
      else if (a === "divergent_v1") divergent++;
      else unknownAlignment++;
    }

    const scores = outcomes.map((o) => o.effectivenessScore);
    const meanEffectivenessScoreRounded =
      scores.length === 0 ?
        0
      : Math.round(scores.reduce((s, x) => s + x, 0) / scores.length);

    const lowActivationOutcomeSamples = outcomes.filter(
      (o) => o.effectivenessScore <= 15,
    ).length;

    let digestEvaluationResult: string =
      OPERATIONAL_EXPERIMENT_EVALUATION_RESULT.INFO_POSTURE_V1;
    if (
      (divergent >= 3 && divergent > aligned) ||
      lowActivationOutcomeSamples >= 8 ||
      balancingAttentionRows >= 4
    ) {
      digestEvaluationResult =
        OPERATIONAL_EXPERIMENT_EVALUATION_RESULT.ATTENTION_POSTURE_V1;
    }

    const digestPayload = {
      ...GOVERNANCE_PAYLOAD,
      explainabilityRef: "portfolio_benchmark_digest_v1",
      counts: {
        workflowOutcomeSamples: outcomes.length,
        simulationAccuracyRows: simAcc.length,
        driftRows: drifts.length,
        balancingAttentionRows,
        balancingSnapshotRows: balancingRows.length,
      },
      simulationAlignment: {
        within_tolerance_v1: aligned,
        divergent_v1: divergent,
        unknown_or_unlabeled_v1: unknownAlignment,
      },
      activationOutcomeEffectivenessMean: meanEffectivenessScoreRounded,
      lowActivationOutcomeSamples,
      driftAttentionRows: drifts.filter(
        (d) => d.severity === OPERATIONAL_OUTCOME_DRIFT_SEVERITY.ATTENTION,
      ).length,
    } satisfies Prisma.InputJsonObject;

    let maxDelta = 0;
    let maxDeltaMetricKey: string | null = null;
    const prior = params.priorWarehouseMetrics;
    const cur = params.currentWarehouseMetrics;
    if (prior && Object.keys(prior).length > 0) {
      for (const [metricKey, curVal] of Object.entries(cur)) {
        const prevVal = prior[metricKey];
        if (typeof prevVal !== "number" || typeof curVal !== "number") continue;
        const delta = Math.abs(curVal - prevVal);
        if (delta > maxDelta) {
          maxDelta = delta;
          maxDeltaMetricKey = metricKey;
        }
      }
    }

    let metricExperimentResult: string =
      OPERATIONAL_EXPERIMENT_EVALUATION_RESULT.NEUTRAL_BASELINE_V1;
    if (prior && Object.keys(prior).length > 0) {
      metricExperimentResult =
        maxDelta >= 15 ?
          OPERATIONAL_EXPERIMENT_EVALUATION_RESULT.ATTENTION_POSTURE_V1
        : maxDelta >= 1 ?
          OPERATIONAL_EXPERIMENT_EVALUATION_RESULT.INFO_POSTURE_V1
        : OPERATIONAL_EXPERIMENT_EVALUATION_RESULT.NEUTRAL_BASELINE_V1;
    }

    const metricExperimentPayload = {
      ...GOVERNANCE_PAYLOAD,
      explainabilityRef: "orchestration_metric_experiment_v1",
      maxDelta,
      maxDeltaMetricKey,
      hadPriorWarehouseBatch: !!(prior && Object.keys(prior).length > 0),
    } satisfies Prisma.InputJsonObject;

    const experimentRows: Prisma.OperationalExperimentSnapshotCreateManyInput[] =
      [
        {
          experimentEngineVersion: EXP_ENGINE,
          experimentCategory:
            OPERATIONAL_EXPERIMENT_CATEGORY.PORTFOLIO_BENCHMARK_DIGEST_V1,
          aggregateWindow: windowKey,
          evaluationResult: digestEvaluationResult,
          payloadJson: digestPayload,
          createdAt: batchAt,
        },
        {
          experimentEngineVersion: EXP_ENGINE,
          experimentCategory:
            OPERATIONAL_EXPERIMENT_CATEGORY.ORCHESTRATION_METRIC_EXPERIMENT_V1,
          aggregateWindow: windowKey,
          evaluationResult: metricExperimentResult,
          payloadJson: metricExperimentPayload,
          createdAt: batchAt,
        },
      ];

    const benchmarkRows: Prisma.WorkflowBenchmarkScenarioCreateManyInput[] =
      simAcc.map((row) => ({
        benchmarkEngineVersion: BENCH_ENGINE,
        aggregateWindow: windowKey,
        benchmarkCategory:
          WORKFLOW_BENCHMARK_CATEGORY.SIMULATION_ATTENTION_ALIGNMENT_BENCHMARK_V1,
        workflowExecutionId: row.workflowExecutionId,
        simulationScenarioId: row.simulationScenarioId,
        benchmarkState: WORKFLOW_BENCHMARK_STATE.COMPLETED,
        idempotencyKey: `${WORKFLOW_BENCHMARK_CATEGORY.SIMULATION_ATTENTION_ALIGNMENT_BENCHMARK_V1}:${row.simulationScenarioId}`,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          accuracyCategory: row.accuracyCategory,
          explainabilityRef:
            "simulation_attention_alignment_benchmark_v1_anchor",
        } satisfies Prisma.InputJsonObject,
        resultJson: {
          alignment: pickAlignment(row.payloadJson),
          predictedJson: row.predictedJson,
          actualJson: row.actualJson,
          simulationAccuracyPayloadMirror: row.payloadJson,
        } satisfies Prisma.InputJsonObject,
        createdAt: batchAt,
      }));

    await this.prisma.$transaction(async (tx) => {
      await tx.workflowBenchmarkScenario.deleteMany({
        where: {
          benchmarkEngineVersion: BENCH_ENGINE,
          aggregateWindow: windowKey,
        },
      });
      await tx.operationalExperimentSnapshot.deleteMany({
        where: {
          experimentEngineVersion: EXP_ENGINE,
          aggregateWindow: windowKey,
        },
      });

      await tx.operationalExperimentSnapshot.createMany({
        data: experimentRows,
      });
      if (benchmarkRows.length > 0) {
        await tx.workflowBenchmarkScenario.createMany({
          data: benchmarkRows,
        });
      }
    });

    this.log.log({
      msg: "OPERATIONAL_BENCHMARK_REFRESH",
      aggregateWindow: windowKey,
      workflowBenchmarkScenariosWritten: benchmarkRows.length,
      operationalExperimentSnapshotsWritten: experimentRows.length,
    });

    return {
      workflowBenchmarkScenariosWritten: benchmarkRows.length,
      operationalExperimentSnapshotsWritten: experimentRows.length,
    };
  }
}
