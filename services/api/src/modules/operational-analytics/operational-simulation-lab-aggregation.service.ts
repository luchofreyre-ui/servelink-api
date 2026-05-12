import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import {
  OPERATIONAL_EXPERIMENT_CATEGORY,
  OPERATIONAL_EXPERIMENT_ENGINE_VERSION,
  OPERATIONAL_EXPERIMENT_EVALUATION_RESULT,
  WORKFLOW_BENCHMARK_ENGINE_VERSION,
} from "./operational-benchmark.constants";
import {
  CAUSAL_ATTRIBUTION_CATEGORY,
  CAUSAL_ATTRIBUTION_ENGINE_VERSION,
  CAUSAL_ATTRIBUTION_RESULT,
  EXPERIMENT_CERTIFICATION_ENGINE_VERSION,
  EXPERIMENT_CERTIFICATION_STATE,
  OPERATIONAL_SIM_LAB_CATEGORY,
  OPERATIONAL_SIM_LAB_ENGINE_VERSION,
  OPERATIONAL_SIM_LAB_STATE,
} from "./operational-simulation-lab.constants";
import { OPERATIONAL_OUTCOME_ENGINE_VERSION } from "./operational-outcome.constants";

const GOVERNANCE_PAYLOAD = {
  noAutonomousOptimization: true,
  noAiExecutionAuthority: true,
  observabilityOnly: true,
  associativeAttributionNotCausalInference: true,
} satisfies Prisma.InputJsonObject;

function pickAlignment(payloadJson: unknown): string | null {
  if (!payloadJson || typeof payloadJson !== "object") return null;
  const a = (payloadJson as Record<string, unknown>).alignment;
  return typeof a === "string" ? a : null;
}

function truncateSummary(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Phase 25 — simulation lab frames, experiment certification, associative attribution.
 * Runs after benchmark batch materialization on the same warehouse refresh timestamp.
 */
@Injectable()
export class OperationalSimulationLabAggregationService {
  private readonly log = new Logger(
    OperationalSimulationLabAggregationService.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  async refreshOperationalSimulationLabBatch(params: {
    aggregateWindow: string;
    batchCreatedAt: Date;
  }): Promise<{
    simulationLabRunsWritten: number;
    experimentCertificationsWritten: number;
    causalAttributionSnapshotsWritten: number;
  }> {
    const windowKey = params.aggregateWindow;
    const batchAt = params.batchCreatedAt;

    const BENCH_ENGINE = WORKFLOW_BENCHMARK_ENGINE_VERSION;
    const EXP_ENGINE = OPERATIONAL_EXPERIMENT_ENGINE_VERSION;
    const OUTCOME_ENGINE = OPERATIONAL_OUTCOME_ENGINE_VERSION;
    const LAB_ENGINE = OPERATIONAL_SIM_LAB_ENGINE_VERSION;
    const CERT_ENGINE = EXPERIMENT_CERTIFICATION_ENGINE_VERSION;
    const CAUSAL_ENGINE = CAUSAL_ATTRIBUTION_ENGINE_VERSION;

    const [benchmarks, experiments, outcomes, simAcc] = await Promise.all([
      this.prisma.workflowBenchmarkScenario.findMany({
        where: {
          benchmarkEngineVersion: BENCH_ENGINE,
          aggregateWindow: windowKey,
          createdAt: batchAt,
        },
        select: {
          id: true,
          workflowExecutionId: true,
          simulationScenarioId: true,
          benchmarkCategory: true,
          benchmarkState: true,
          resultJson: true,
          payloadJson: true,
        },
        orderBy: [{ id: "asc" }],
      }),
      this.prisma.operationalExperimentSnapshot.findMany({
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
        orderBy: [{ experimentCategory: "asc" }],
      }),
      this.prisma.workflowOutcomeEvaluation.findMany({
        where: {
          outcomeEngineVersion: OUTCOME_ENGINE,
          aggregateWindow: windowKey,
          createdAt: batchAt,
        },
        select: { effectivenessScore: true },
      }),
      this.prisma.simulationAccuracySnapshot.findMany({
        where: {
          outcomeEngineVersion: OUTCOME_ENGINE,
          aggregateWindow: windowKey,
          createdAt: batchAt,
        },
        select: { payloadJson: true },
      }),
    ]);

    const labRuns: Prisma.OperationalSimulationLabRunCreateManyInput[] =
      benchmarks.map((b) => ({
        labEngineVersion: LAB_ENGINE,
        aggregateWindow: windowKey,
        simulationCategory:
          OPERATIONAL_SIM_LAB_CATEGORY.BENCHMARK_MULTISCENARIO_FRAME_V1,
        benchmarkScenarioId: b.id,
        simulationState: OPERATIONAL_SIM_LAB_STATE.COMPLETED,
        idempotencyKey: `lab_frame:${LAB_ENGINE}:${windowKey}:${b.id}`,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef: "benchmark_multiscenario_frame_v1",
          workflowExecutionId: b.workflowExecutionId,
          simulationScenarioId: b.simulationScenarioId,
          benchmarkCategory: b.benchmarkCategory,
          benchmarkState: b.benchmarkState,
        } satisfies Prisma.InputJsonObject,
        resultJson: {
          benchmarkResultJsonMirror: b.resultJson,
          benchmarkPayloadJsonMirror: b.payloadJson,
        } satisfies Prisma.InputJsonObject,
        createdAt: batchAt,
      }));

    const certifications: Prisma.ExperimentCertificationRecordCreateManyInput[] =
      [];

    for (const exp of experiments) {
      const attentionish =
        exp.evaluationResult ===
          OPERATIONAL_EXPERIMENT_EVALUATION_RESULT.ATTENTION_POSTURE_V1;

      const certificationState =
        attentionish ?
          EXPERIMENT_CERTIFICATION_STATE.REQUIRES_HUMAN_REVIEW_V1
        : EXPERIMENT_CERTIFICATION_STATE.CERTIFIED_OBSERVATIONAL_V1;

      const evaluationSummary = attentionish ?
        truncateSummary(
          "Attention-tier experiment posture persisted — operators should review before treating rows as a relaxed baseline. Deterministic certification only; no execution authority.",
          480,
        )
      : truncateSummary(
          "Observational certification: snapshot meets deterministic neutral/info posture gates for this refresh. Does not certify correctness of business outcomes.",
          480,
        );

      certifications.push({
        certificationEngineVersion: CERT_ENGINE,
        aggregateWindow: windowKey,
        experimentCategory: exp.experimentCategory,
        certificationState,
        evaluationSummary,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef: "experiment_certification_gate_v1",
          sourceOperationalExperimentSnapshotId: exp.id,
          mirroredEvaluationResult: exp.evaluationResult,
        } satisfies Prisma.InputJsonObject,
        createdAt: batchAt,
      });
    }

    const lowActivationOutcomeSamples = outcomes.filter(
      (o) => o.effectivenessScore <= 15,
    ).length;

    let divergentSim = 0;
    for (const s of simAcc) {
      if (pickAlignment(s.payloadJson) === "divergent_v1") divergentSim++;
    }

    const metricExperiment = experiments.find(
      (e) =>
        e.experimentCategory ===
        OPERATIONAL_EXPERIMENT_CATEGORY.ORCHESTRATION_METRIC_EXPERIMENT_V1,
    );

    const attributions: Prisma.CausalAttributionSnapshotCreateManyInput[] = [];

    if (lowActivationOutcomeSamples >= 5 && divergentSim >= 2) {
      attributions.push({
        causalEngineVersion: CAUSAL_ENGINE,
        aggregateWindow: windowKey,
        attributionCategory:
          CAUSAL_ATTRIBUTION_CATEGORY.ACTIVATION_SIMULATION_ASSOCIATIVE_V1,
        attributionResult:
          CAUSAL_ATTRIBUTION_RESULT.JOINT_ATTENTION_ASSOCIATIVE_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef: "activation_simulation_associative_v1",
          lowActivationOutcomeSamples,
          divergentSimulationAccuracyRows: divergentSim,
          semanticsNote:
            "Associative co-occurrence on the same warehouse batch only — not causal inference and not counterfactual guarantees.",
        } satisfies Prisma.InputJsonObject,
        createdAt: batchAt,
      });
    } else {
      attributions.push({
        causalEngineVersion: CAUSAL_ENGINE,
        aggregateWindow: windowKey,
        attributionCategory:
          CAUSAL_ATTRIBUTION_CATEGORY.ACTIVATION_SIMULATION_ASSOCIATIVE_V1,
        attributionResult: CAUSAL_ATTRIBUTION_RESULT.NO_ASSOCIATIVE_SIGNAL_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef: "activation_simulation_associative_v1",
          lowActivationOutcomeSamples,
          divergentSimulationAccuracyRows: divergentSim,
          semanticsNote:
            "Thresholds not met for joint associative pattern on this batch.",
        } satisfies Prisma.InputJsonObject,
        createdAt: batchAt,
      });
    }

    if (
      metricExperiment?.evaluationResult ===
        OPERATIONAL_EXPERIMENT_EVALUATION_RESULT.ATTENTION_POSTURE_V1 &&
      lowActivationOutcomeSamples >= 3
    ) {
      attributions.push({
        causalEngineVersion: CAUSAL_ENGINE,
        aggregateWindow: windowKey,
        attributionCategory:
          CAUSAL_ATTRIBUTION_CATEGORY.WAREHOUSE_DELTA_ACTIVATION_ASSOCIATIVE_V1,
        attributionResult:
          CAUSAL_ATTRIBUTION_RESULT.METRIC_SHIFT_WITH_ACTIVATION_STRESS_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef: "warehouse_delta_activation_associative_v1",
          lowActivationOutcomeSamples,
          semanticsNote:
            "Large warehouse metric deltas coinciding with activation stress samples — associative framing only.",
        } satisfies Prisma.InputJsonObject,
        createdAt: batchAt,
      });
    } else {
      attributions.push({
        causalEngineVersion: CAUSAL_ENGINE,
        aggregateWindow: windowKey,
        attributionCategory:
          CAUSAL_ATTRIBUTION_CATEGORY.WAREHOUSE_DELTA_ACTIVATION_ASSOCIATIVE_V1,
        attributionResult: CAUSAL_ATTRIBUTION_RESULT.NO_ASSOCIATIVE_SIGNAL_V1,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          explainabilityRef: "warehouse_delta_activation_associative_v1",
          semanticsNote:
            "Thresholds not met for warehouse delta + activation stress associative pattern.",
        } satisfies Prisma.InputJsonObject,
        createdAt: batchAt,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.operationalSimulationLabRun.deleteMany({
        where: { labEngineVersion: LAB_ENGINE, aggregateWindow: windowKey },
      });
      await tx.experimentCertificationRecord.deleteMany({
        where: {
          certificationEngineVersion: CERT_ENGINE,
          aggregateWindow: windowKey,
        },
      });
      await tx.causalAttributionSnapshot.deleteMany({
        where: { causalEngineVersion: CAUSAL_ENGINE, aggregateWindow: windowKey },
      });

      if (labRuns.length > 0) {
        await tx.operationalSimulationLabRun.createMany({ data: labRuns });
      }
      if (certifications.length > 0) {
        await tx.experimentCertificationRecord.createMany({
          data: certifications,
        });
      }
      if (attributions.length > 0) {
        await tx.causalAttributionSnapshot.createMany({ data: attributions });
      }
    });

    this.log.log({
      msg: "OPERATIONAL_SIMULATION_LAB_REFRESH",
      aggregateWindow: windowKey,
      simulationLabRunsWritten: labRuns.length,
      experimentCertificationsWritten: certifications.length,
      causalAttributionSnapshotsWritten: attributions.length,
    });

    return {
      simulationLabRunsWritten: labRuns.length,
      experimentCertificationsWritten: certifications.length,
      causalAttributionSnapshotsWritten: attributions.length,
    };
  }
}
