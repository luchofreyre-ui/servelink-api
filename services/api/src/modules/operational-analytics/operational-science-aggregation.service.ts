import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { WORKFLOW_ACTIVATION_STATE } from "../orchestration/workflow-execution-activation.constants";
import {
  OPERATIONAL_BALANCING_ENGINE_VERSION,
  BALANCING_SIGNAL_SEVERITY,
} from "./operational-balancing.constants";
import {
  INTERVENTION_EVALUATION_CATEGORY,
  INTERVENTION_EVALUATION_ENGINE_VERSION,
  INTERVENTION_EVALUATION_RESULT,
  OPERATIONAL_COHORT_CATEGORY,
  OPERATIONAL_COHORT_ENGINE_VERSION,
  OPERATIONAL_INTERVENTION_SANDBOX_CATEGORY,
  OPERATIONAL_INTERVENTION_SANDBOX_ENGINE_VERSION,
  OPERATIONAL_INTERVENTION_SANDBOX_STATE,
} from "./operational-science.constants";
import { OPERATIONAL_LONGITUDINAL_ENGINE_VERSION } from "./operational-longitudinal.constants";
import {
  OPERATIONAL_OUTCOME_ENGINE_VERSION,
  WORKFLOW_OUTCOME_EVALUATION_RESULT,
} from "./operational-outcome.constants";
import { OPERATIONAL_ANALYTICS_ENGINE_VERSION } from "./operational-analytics.constants";

const GOVERNANCE_PAYLOAD = {
  noAutonomousOptimization: true,
  noAiExecutionAuthority: true,
  observabilityOnly: true,
  sandboxObserveSimulateCompareOnly: true,
  noAutonomousExecutionFromSandboxRows: true,
} satisfies Prisma.InputJsonObject;

const FAILURE_SHARE_ATTENTION = 0.18;
const SANDBOX_DENSE_MIN_FRAMES = 42;
const SANDBOX_SPARSE_MAX_FRAMES = 8;

/**
 * Phase 27 — cohort mirrors + intervention observation frames from warehouse refresh only.
 */
@Injectable()
export class OperationalScienceAggregationService {
  private readonly log = new Logger(OperationalScienceAggregationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async refreshOperationalScienceBatch(params: {
    aggregateWindow: string;
    batchCreatedAt: Date;
  }): Promise<{
    cohortSnapshotsWritten: number;
    interventionSandboxesWritten: number;
    interventionEvaluationsWritten: number;
  }> {
    const windowKey = params.aggregateWindow;
    const batchAt = params.batchCreatedAt;
    const COHORT_ENGINE = OPERATIONAL_COHORT_ENGINE_VERSION;
    const SANDBOX_ENGINE = OPERATIONAL_INTERVENTION_SANDBOX_ENGINE_VERSION;
    const EVAL_ENGINE = INTERVENTION_EVALUATION_ENGINE_VERSION;
    const OUTCOME_ENGINE = OPERATIONAL_OUTCOME_ENGINE_VERSION;
    const BAL_ENGINE = OPERATIONAL_BALANCING_ENGINE_VERSION;
    const LONG_ENGINE = OPERATIONAL_LONGITUDINAL_ENGINE_VERSION;

    const outcomeRows = await this.prisma.workflowOutcomeEvaluation.findMany({
      where: {
        outcomeEngineVersion: OUTCOME_ENGINE,
        aggregateWindow: windowKey,
      },
      select: { evaluationResult: true },
    });

    const outcomeCounts = new Map<string, number>();
    for (const row of outcomeRows) {
      outcomeCounts.set(
        row.evaluationResult,
        (outcomeCounts.get(row.evaluationResult) ?? 0) + 1,
      );
    }
    const outcomeTotal = outcomeRows.length;
    const failureCount =
      outcomeCounts.get(WORKFLOW_OUTCOME_EVALUATION_RESULT.TERMINAL_FAILURE_V1) ??
      0;
    const failureShare =
      outcomeTotal > 0 ? failureCount / outcomeTotal : 0;

    const cohortRows: Prisma.OperationalCohortSnapshotCreateManyInput[] = [
      {
        cohortEngineVersion: COHORT_ENGINE,
        cohortCategory:
          OPERATIONAL_COHORT_CATEGORY.WORKFLOW_OUTCOME_DISTRIBUTION_V1,
        aggregateWindow: windowKey,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          analyticsEngineVersionRef: OPERATIONAL_ANALYTICS_ENGINE_VERSION,
          outcomeEngineVersionRef: OUTCOME_ENGINE,
          sampleCount: outcomeTotal,
          countsByEvaluationResult: Object.fromEntries(outcomeCounts),
          explainabilityRef: "workflow_outcome_distribution_v1",
        } satisfies Prisma.InputJsonObject,
        createdAt: batchAt,
      },
    ];

    const balancingStamp =
      await this.prisma.operationalBalancingSnapshot.findFirst({
        where: {
          balancingEngineVersion: BAL_ENGINE,
          aggregateWindow: windowKey,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

    const balancingLatest = balancingStamp
      ? await this.prisma.operationalBalancingSnapshot.findMany({
          where: {
            balancingEngineVersion: BAL_ENGINE,
            aggregateWindow: windowKey,
            createdAt: balancingStamp.createdAt,
          },
          select: { balancingCategory: true, severity: true },
        })
      : [];

    let attentionBalancing = 0;
    let infoBalancing = 0;
    for (const b of balancingLatest) {
      if (b.severity === BALANCING_SIGNAL_SEVERITY.ATTENTION) attentionBalancing++;
      else if (b.severity === BALANCING_SIGNAL_SEVERITY.INFO) infoBalancing++;
    }

    cohortRows.push({
      cohortEngineVersion: COHORT_ENGINE,
      cohortCategory:
        OPERATIONAL_COHORT_CATEGORY.BALANCING_SEVERITY_PROFILE_V1,
      aggregateWindow: windowKey,
      payloadJson: {
        ...GOVERNANCE_PAYLOAD,
        balancingEngineVersionRef: BAL_ENGINE,
        balancingSnapshotBatchIso: balancingStamp?.createdAt.toISOString() ?? null,
        rowsMirrored: balancingLatest.length,
        severityCounts: {
          attention: attentionBalancing,
          info: infoBalancing,
        },
        explainabilityRef: "balancing_severity_profile_v1",
      } satisfies Prisma.InputJsonObject,
      createdAt: batchAt,
    });

    const replayRows = await this.prisma.operationalReplayAlignment.findMany({
      where: {
        longitudinalEngineVersion: LONG_ENGINE,
        aggregateWindow: windowKey,
        createdAt: batchAt,
      },
      select: { replayCategory: true, replayState: true },
    });

    const replayByState = new Map<string, number>();
    for (const r of replayRows) {
      const k = `${r.replayCategory}:${r.replayState}`;
      replayByState.set(k, (replayByState.get(k) ?? 0) + 1);
    }

    cohortRows.push({
      cohortEngineVersion: COHORT_ENGINE,
      cohortCategory: OPERATIONAL_COHORT_CATEGORY.REPLAY_ALIGNMENT_MIRROR_V1,
      aggregateWindow: windowKey,
      payloadJson: {
        ...GOVERNANCE_PAYLOAD,
        longitudinalEngineVersionRef: LONG_ENGINE,
        replayRowsInBatch: replayRows.length,
        compositeCategoryStateCounts: Object.fromEntries(replayByState),
        explainabilityRef: "replay_alignment_mirror_v1",
      } satisfies Prisma.InputJsonObject,
      createdAt: batchAt,
    });

    const invoked = await this.prisma.workflowExecutionActivation.findMany({
      where: { activationState: WORKFLOW_ACTIVATION_STATE.INVOKED },
      orderBy: { updatedAt: "desc" },
      take: 60,
      select: {
        id: true,
        workflowExecutionId: true,
        updatedAt: true,
      },
    });

    const wfIds = [...new Set(invoked.map((r) => r.workflowExecutionId))];
    const executions =
      wfIds.length === 0 ?
        []
      : await this.prisma.workflowExecution.findMany({
          where: { id: { in: wfIds } },
          select: {
            id: true,
            state: true,
            executionStage: true,
            approvalState: true,
            workflowType: true,
          },
        });
    const wfById = new Map(executions.map((w) => [w.id, w]));

    const outcomeByActivationId = new Map<string, string>();
    if (invoked.length > 0) {
      const actIds = invoked.map((a) => a.id);
      const linkedOutcomes =
        await this.prisma.workflowOutcomeEvaluation.findMany({
          where: {
            outcomeEngineVersion: OUTCOME_ENGINE,
            aggregateWindow: windowKey,
            activationId: { in: actIds },
          },
          select: { activationId: true, evaluationResult: true },
        });
      for (const o of linkedOutcomes) {
        if (o.activationId) {
          outcomeByActivationId.set(o.activationId, o.evaluationResult);
        }
      }
    }

    const sandboxRows: Prisma.OperationalInterventionSandboxCreateManyInput[] =
      [];
    for (const act of invoked) {
      const wf = wfById.get(act.workflowExecutionId);
      if (!wf) continue;
      const mirroredOutcome = outcomeByActivationId.get(act.id) ?? null;
      sandboxRows.push({
        sandboxEngineVersion: SANDBOX_ENGINE,
        aggregateWindow: windowKey,
        sandboxCategory:
          OPERATIONAL_INTERVENTION_SANDBOX_CATEGORY.ACTIVATION_INTERVENTION_OBSERVATION_FRAME_V1,
        sandboxState:
          OPERATIONAL_INTERVENTION_SANDBOX_STATE.SANDBOX_OBSERVATION_COMPLETE_V1,
        workflowExecutionId: wf.id,
        activationId: act.id,
        idempotencyKey: `sandbox:${windowKey}:${act.id}`,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          activationObservedAtIso: act.updatedAt.toISOString(),
          workflowType: wf.workflowType,
          workflowState: wf.state,
          executionStage: wf.executionStage,
          approvalState: wf.approvalState,
          explainabilityRef:
            "activation_intervention_observation_frame_v1_non_executing",
        } satisfies Prisma.InputJsonObject,
        resultJson: {
          mirroredOutcomeEvaluationResult: mirroredOutcome,
          deterministicComparisonOnly: true,
        } satisfies Prisma.InputJsonObject,
        createdAt: batchAt,
      });
    }

    const evaluationRows: Prisma.InterventionEvaluationSnapshotCreateManyInput[] =
      [];

    evaluationRows.push({
      evaluationEngineVersion: EVAL_ENGINE,
      evaluationCategory:
        INTERVENTION_EVALUATION_CATEGORY.OUTCOME_FAILURE_SHARE_V1,
      aggregateWindow: windowKey,
      evaluationResult:
        outcomeTotal > 0 && failureShare >= FAILURE_SHARE_ATTENTION ?
          INTERVENTION_EVALUATION_RESULT.COHORT_BASELINE_ATTENTION_V1
        : INTERVENTION_EVALUATION_RESULT.COHORT_BASELINE_NOMINAL_V1,
      payloadJson: {
        ...GOVERNANCE_PAYLOAD,
        outcomeSamplesConsidered: outcomeTotal,
        terminalFailureCount: failureCount,
        failureShare,
        failureShareAttentionThreshold: FAILURE_SHARE_ATTENTION,
        explainabilityRef: "outcome_failure_share_v1",
      } satisfies Prisma.InputJsonObject,
      createdAt: batchAt,
    });

    const sandboxCount = sandboxRows.length;
    const sandboxInventoryResult =
      sandboxCount >= SANDBOX_DENSE_MIN_FRAMES ?
        INTERVENTION_EVALUATION_RESULT.SANDBOX_INVENTORY_DENSE_V1
      : sandboxCount <= SANDBOX_SPARSE_MAX_FRAMES ?
        INTERVENTION_EVALUATION_RESULT.SANDBOX_INVENTORY_SPARSE_V1
      : INTERVENTION_EVALUATION_RESULT.SANDBOX_INVENTORY_NOMINAL_V1;

    evaluationRows.push({
      evaluationEngineVersion: EVAL_ENGINE,
      evaluationCategory:
        INTERVENTION_EVALUATION_CATEGORY.SANDBOX_FRAME_INVENTORY_V1,
      aggregateWindow: windowKey,
      evaluationResult: sandboxInventoryResult,
      payloadJson: {
        ...GOVERNANCE_PAYLOAD,
        sandboxFramesWritten: sandboxCount,
        denseThresholdMinFrames: SANDBOX_DENSE_MIN_FRAMES,
        sparseThresholdMaxFrames: SANDBOX_SPARSE_MAX_FRAMES,
        explainabilityRef: "sandbox_frame_inventory_v1",
      } satisfies Prisma.InputJsonObject,
      createdAt: batchAt,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.operationalCohortSnapshot.deleteMany({
        where: {
          cohortEngineVersion: COHORT_ENGINE,
          aggregateWindow: windowKey,
        },
      });
      await tx.operationalInterventionSandbox.deleteMany({
        where: {
          sandboxEngineVersion: SANDBOX_ENGINE,
          aggregateWindow: windowKey,
        },
      });
      await tx.interventionEvaluationSnapshot.deleteMany({
        where: {
          evaluationEngineVersion: EVAL_ENGINE,
          aggregateWindow: windowKey,
        },
      });

      if (cohortRows.length > 0) {
        await tx.operationalCohortSnapshot.createMany({ data: cohortRows });
      }
      if (sandboxRows.length > 0) {
        await tx.operationalInterventionSandbox.createMany({
          data: sandboxRows,
        });
      }
      if (evaluationRows.length > 0) {
        await tx.interventionEvaluationSnapshot.createMany({
          data: evaluationRows,
        });
      }
    });

    this.log.log({
      msg: "OPERATIONAL_SCIENCE_REFRESH",
      aggregateWindow: windowKey,
      cohortSnapshotsWritten: cohortRows.length,
      interventionSandboxesWritten: sandboxRows.length,
      interventionEvaluationsWritten: evaluationRows.length,
    });

    return {
      cohortSnapshotsWritten: cohortRows.length,
      interventionSandboxesWritten: sandboxRows.length,
      interventionEvaluationsWritten: evaluationRows.length,
    };
  }
}
