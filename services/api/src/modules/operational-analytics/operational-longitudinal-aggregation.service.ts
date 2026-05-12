import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import {
  OPERATIONAL_EXPERIMENT_ENGINE_VERSION,
  WORKFLOW_BENCHMARK_ENGINE_VERSION,
} from "./operational-benchmark.constants";
import {
  COUNTERFACTUAL_EVALUATION_CATEGORY,
  EXPERIMENT_LINEAGE_CATEGORY,
  OPERATIONAL_LONGITUDINAL_ENGINE_VERSION,
  OPERATIONAL_REPLAY_CATEGORY,
  OPERATIONAL_REPLAY_STATE,
} from "./operational-longitudinal.constants";
import { OPERATIONAL_SIM_LAB_ENGINE_VERSION } from "./operational-simulation-lab.constants";

const GOVERNANCE_PAYLOAD = {
  noAutonomousOptimization: true,
  noAiExecutionAuthority: true,
  observabilityOnly: true,
  counterfactualScaffoldNotCausalOutcome: true,
  longitudinalObserveCompareOnly: true,
} satisfies Prisma.InputJsonObject;

/**
 * Phase 26 — consecutive-batch lineage, replay inventory alignment, counterfactual-safe contrasts.
 */
@Injectable()
export class OperationalLongitudinalAggregationService {
  private readonly log = new Logger(
    OperationalLongitudinalAggregationService.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  async refreshOperationalLongitudinalBatch(params: {
    aggregateWindow: string;
    batchCreatedAt: Date;
  }): Promise<{
    experimentLineageWritten: number;
    counterfactualSnapshotsWritten: number;
    replayAlignmentsWritten: number;
  }> {
    const windowKey = params.aggregateWindow;
    const batchAt = params.batchCreatedAt;
    const LONG_ENGINE = OPERATIONAL_LONGITUDINAL_ENGINE_VERSION;
    const EXP_ENGINE = OPERATIONAL_EXPERIMENT_ENGINE_VERSION;
    const LAB_ENGINE = OPERATIONAL_SIM_LAB_ENGINE_VERSION;
    const BENCH_ENGINE = WORKFLOW_BENCHMARK_ENGINE_VERSION;

    const currentExps = await this.prisma.operationalExperimentSnapshot.findMany(
      {
        where: {
          experimentEngineVersion: EXP_ENGINE,
          aggregateWindow: windowKey,
          createdAt: batchAt,
        },
        select: {
          id: true,
          experimentCategory: true,
          evaluationResult: true,
          payloadJson: true,
        },
      },
    );

    const priorExpStamp =
      await this.prisma.operationalExperimentSnapshot.findFirst({
        where: {
          experimentEngineVersion: EXP_ENGINE,
          aggregateWindow: windowKey,
          createdAt: { lt: batchAt },
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

    const priorExps = priorExpStamp
      ? await this.prisma.operationalExperimentSnapshot.findMany({
          where: {
            experimentEngineVersion: EXP_ENGINE,
            aggregateWindow: windowKey,
            createdAt: priorExpStamp.createdAt,
          },
          select: {
            id: true,
            experimentCategory: true,
            evaluationResult: true,
            payloadJson: true,
          },
        })
      : [];

    const priorByCategory = new Map(
      priorExps.map((p) => [p.experimentCategory, p]),
    );

    const lineageRows: Prisma.OperationalExperimentLineageCreateManyInput[] =
      [];

    const transitionSummaries: Array<{
      experimentCategory: string;
      priorEvaluationResult: string | null;
      currentEvaluationResult: string;
    }> = [];

    for (const cur of currentExps) {
      const prior = priorByCategory.get(cur.experimentCategory);
      transitionSummaries.push({
        experimentCategory: cur.experimentCategory,
        priorEvaluationResult: prior?.evaluationResult ?? null,
        currentEvaluationResult: cur.evaluationResult,
      });
      if (!prior || !priorExpStamp) continue;
      lineageRows.push({
        longitudinalEngineVersion: LONG_ENGINE,
        aggregateWindow: windowKey,
        lineageCategory: EXPERIMENT_LINEAGE_CATEGORY.CONSECUTIVE_REFRESH_PAIR_V1,
        sourceExperimentId: prior.id,
        comparisonExperimentId: cur.id,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef: "experiment_consecutive_refresh_pair_v1",
          priorBatchIso: priorExpStamp.createdAt.toISOString(),
          currentBatchIso: batchAt.toISOString(),
          priorEvaluationResult: prior.evaluationResult,
          currentEvaluationResult: cur.evaluationResult,
        } satisfies Prisma.InputJsonObject,
        createdAt: batchAt,
      });
    }

    const comparisonWindowLabel =
      priorExpStamp ?
        `prior_${priorExpStamp.createdAt.toISOString()}_vs_current_${batchAt.toISOString()}`
      : `singleton_batch_${batchAt.toISOString()}`;

    const counterfactualRows: Prisma.CounterfactualEvaluationSnapshotCreateManyInput[] =
      [
        {
          longitudinalEngineVersion: LONG_ENGINE,
          aggregateWindow: windowKey,
          evaluationCategory:
            COUNTERFACTUAL_EVALUATION_CATEGORY.REFRESH_CONTRAST_SCAFFOLD_V1,
          comparisonWindow: comparisonWindowLabel,
          payloadJson: {
            ...GOVERNANCE_PAYLOAD,
            explainabilityRef:
              "counterfactual_safe_refresh_contrast_scaffold_v1",
            framingNote:
              "Deterministic contrast of persisted experiment evaluations across consecutive warehouse refreshes — descriptive scaffolding only; not a causal counterfactual and not an optimized alternate timeline.",
            hadPriorExperimentBatch: priorExps.length > 0,
            lineagePairsWritten: lineageRows.length,
            transitionSummaries,
          } satisfies Prisma.InputJsonObject,
          createdAt: batchAt,
        },
      ];

    const currentLabCount = await this.prisma.operationalSimulationLabRun.count(
      {
        where: {
          labEngineVersion: LAB_ENGINE,
          aggregateWindow: windowKey,
          createdAt: batchAt,
        },
      },
    );

    const priorLabStamp =
      await this.prisma.operationalSimulationLabRun.findFirst({
        where: {
          labEngineVersion: LAB_ENGINE,
          aggregateWindow: windowKey,
          createdAt: { lt: batchAt },
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

    const priorLabCount = priorLabStamp
      ? await this.prisma.operationalSimulationLabRun.count({
          where: {
            labEngineVersion: LAB_ENGINE,
            aggregateWindow: windowKey,
            createdAt: priorLabStamp.createdAt,
          },
        })
      : 0;

    const currentBenchCount =
      await this.prisma.workflowBenchmarkScenario.count({
        where: {
          benchmarkEngineVersion: BENCH_ENGINE,
          aggregateWindow: windowKey,
          createdAt: batchAt,
        },
      });

    const priorBenchStamp =
      await this.prisma.workflowBenchmarkScenario.findFirst({
        where: {
          benchmarkEngineVersion: BENCH_ENGINE,
          aggregateWindow: windowKey,
          createdAt: { lt: batchAt },
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

    const priorBenchCount = priorBenchStamp
      ? await this.prisma.workflowBenchmarkScenario.count({
          where: {
            benchmarkEngineVersion: BENCH_ENGINE,
            aggregateWindow: windowKey,
            createdAt: priorBenchStamp.createdAt,
          },
        })
      : 0;

    const replayRows: Prisma.OperationalReplayAlignmentCreateManyInput[] = [];

    const labReplayState =
      !priorLabStamp ? OPERATIONAL_REPLAY_STATE.NO_PRIOR_BATCH_V1
      : Math.abs(currentLabCount - priorLabCount) <= 2 ?
        OPERATIONAL_REPLAY_STATE.INVENTORY_ALIGNED_V1
      : OPERATIONAL_REPLAY_STATE.INVENTORY_DIVERGENT_V1;

    replayRows.push({
      longitudinalEngineVersion: LONG_ENGINE,
      aggregateWindow: windowKey,
      replayCategory: OPERATIONAL_REPLAY_CATEGORY.LAB_RUN_INVENTORY_ALIGNMENT_V1,
      replayState: labReplayState,
      payloadJson: {
        ...GOVERNANCE_PAYLOAD,
        explainabilityRef: "lab_run_inventory_alignment_v1",
        currentLabRunCount: currentLabCount,
        priorLabRunCount: priorLabCount,
        priorLabBatchIso: priorLabStamp?.createdAt.toISOString() ?? null,
        toleranceBand: 2,
      } satisfies Prisma.InputJsonObject,
      createdAt: batchAt,
    });

    const benchReplayState =
      !priorBenchStamp ? OPERATIONAL_REPLAY_STATE.NO_PRIOR_BATCH_V1
      : Math.abs(currentBenchCount - priorBenchCount) <= 3 ?
        OPERATIONAL_REPLAY_STATE.INVENTORY_ALIGNED_V1
      : OPERATIONAL_REPLAY_STATE.INVENTORY_DIVERGENT_V1;

    replayRows.push({
      longitudinalEngineVersion: LONG_ENGINE,
      aggregateWindow: windowKey,
      replayCategory:
        OPERATIONAL_REPLAY_CATEGORY.BENCHMARK_INVENTORY_ALIGNMENT_V1,
      replayState: benchReplayState,
      payloadJson: {
        ...GOVERNANCE_PAYLOAD,
        explainabilityRef: "benchmark_inventory_alignment_v1",
        currentBenchmarkCount: currentBenchCount,
        priorBenchmarkCount: priorBenchCount,
        priorBenchmarkBatchIso:
          priorBenchStamp?.createdAt.toISOString() ?? null,
        toleranceBand: 3,
      } satisfies Prisma.InputJsonObject,
      createdAt: batchAt,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.operationalExperimentLineage.deleteMany({
        where: {
          longitudinalEngineVersion: LONG_ENGINE,
          aggregateWindow: windowKey,
        },
      });
      await tx.counterfactualEvaluationSnapshot.deleteMany({
        where: {
          longitudinalEngineVersion: LONG_ENGINE,
          aggregateWindow: windowKey,
        },
      });
      await tx.operationalReplayAlignment.deleteMany({
        where: {
          longitudinalEngineVersion: LONG_ENGINE,
          aggregateWindow: windowKey,
        },
      });

      if (lineageRows.length > 0) {
        await tx.operationalExperimentLineage.createMany({
          data: lineageRows,
        });
      }
      await tx.counterfactualEvaluationSnapshot.createMany({
        data: counterfactualRows,
      });
      await tx.operationalReplayAlignment.createMany({
        data: replayRows,
      });
    });

    this.log.log({
      msg: "OPERATIONAL_LONGITUDINAL_REFRESH",
      aggregateWindow: windowKey,
      experimentLineageWritten: lineageRows.length,
      counterfactualSnapshotsWritten: counterfactualRows.length,
      replayAlignmentsWritten: replayRows.length,
    });

    return {
      experimentLineageWritten: lineageRows.length,
      counterfactualSnapshotsWritten: counterfactualRows.length,
      replayAlignmentsWritten: replayRows.length,
    };
  }
}
