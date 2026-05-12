import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { OPERATIONAL_ANALYTICS_ENGINE_VERSION } from "./operational-analytics.constants";
import {
  INTERVENTION_EVALUATION_ENGINE_VERSION,
  OPERATIONAL_COHORT_ENGINE_VERSION,
  OPERATIONAL_INTERVENTION_SANDBOX_ENGINE_VERSION,
} from "./operational-science.constants";
import { OPERATIONAL_LONGITUDINAL_ENGINE_VERSION } from "./operational-longitudinal.constants";
import {
  CONTROL_COHORT_CATEGORY,
  CONTROL_COHORT_ENGINE_VERSION,
  INTERVENTION_ASSIGNMENT_CATEGORY,
  INTERVENTION_ASSIGNMENT_STATE,
  INTERVENTION_COHORT_TYPE,
  OPERATIONAL_INTERVENTION_ASSIGNMENT_ENGINE_VERSION,
  OPERATIONAL_VALIDITY_CERT_ENGINE_VERSION,
  VALIDITY_CERTIFICATION_CATEGORY,
  VALIDITY_CERTIFICATION_STATE,
} from "./operational-intervention-validity.constants";

const GOVERNANCE_PAYLOAD = {
  noAutonomousOptimization: true,
  noAiExecutionAuthority: true,
  observabilityOnly: true,
  assignmentClassifyCompareOnly: true,
  holdoutIsDeterministicLabelOnly: true,
  noExecutionAuthorityFromAssignments: true,
} satisfies Prisma.InputJsonObject;

const PARTITION_RULE_ID = "alternating_stable_sort_by_workflow_activation_v1";
const MIN_SAMPLES_FOR_BALANCE = 6;
const CONTROL_SHARE_ATTENTION_LOW = 0.35;
const CONTROL_SHARE_ATTENTION_HIGH = 0.65;

/**
 * Phase 28 — partitions Phase 27 sandbox frames into deterministic control vs mirror cohorts; emits validity attestations.
 */
@Injectable()
export class OperationalInterventionValidityAggregationService {
  private readonly log = new Logger(
    OperationalInterventionValidityAggregationService.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  async refreshOperationalInterventionValidityBatch(params: {
    aggregateWindow: string;
    batchCreatedAt: Date;
  }): Promise<{
    interventionAssignmentsWritten: number;
    controlCohortSnapshotsWritten: number;
    validityCertificationsWritten: number;
  }> {
    const windowKey = params.aggregateWindow;
    const batchAt = params.batchCreatedAt;
    const ASSIGN_ENGINE = OPERATIONAL_INTERVENTION_ASSIGNMENT_ENGINE_VERSION;
    const VALIDITY_ENGINE = OPERATIONAL_VALIDITY_CERT_ENGINE_VERSION;
    const CTRL_ENGINE = CONTROL_COHORT_ENGINE_VERSION;
    const SANDBOX_ENGINE = OPERATIONAL_INTERVENTION_SANDBOX_ENGINE_VERSION;

    const sandboxes =
      await this.prisma.operationalInterventionSandbox.findMany({
        where: {
          sandboxEngineVersion: SANDBOX_ENGINE,
          aggregateWindow: windowKey,
          createdAt: batchAt,
        },
        orderBy: [{ workflowExecutionId: "asc" }, { activationId: "asc" }],
      });

    const assignmentRows: Prisma.OperationalInterventionAssignmentCreateManyInput[] =
      [];

    let controlCount = 0;
    let mirrorCount = 0;
    const controlSampleIds: string[] = [];
    const mirrorSampleIds: string[] = [];

    sandboxes.forEach((sb, idx) => {
      const isControl = idx % 2 === 0;
      if (isControl) {
        controlCount++;
        if (controlSampleIds.length < 14) {
          controlSampleIds.push(sb.workflowExecutionId);
        }
      } else {
        mirrorCount++;
        if (mirrorSampleIds.length < 14) {
          mirrorSampleIds.push(sb.workflowExecutionId);
        }
      }

      const cohortType = isControl ?
          INTERVENTION_COHORT_TYPE.CONTROL_HOLDOUT_V1
        : INTERVENTION_COHORT_TYPE.INTERVENTION_MIRROR_V1;

      assignmentRows.push({
        assignmentEngineVersion: ASSIGN_ENGINE,
        aggregateWindow: windowKey,
        assignmentCategory:
          INTERVENTION_ASSIGNMENT_CATEGORY.DETERMINISTIC_PARTITION_FROM_SANDBOX_V1,
        cohortType,
        workflowExecutionId: sb.workflowExecutionId,
        activationId: sb.activationId,
        assignmentState:
          INTERVENTION_ASSIGNMENT_STATE.CLASSIFIED_OBSERVATION_ONLY_V1,
        idempotencyKey: sb.activationId ?
          `assign:${windowKey}:${sb.activationId}`
        : `assign:${windowKey}:wf:${sb.workflowExecutionId}:${idx}`,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          partitionRuleId: PARTITION_RULE_ID,
          stableSortIndex: idx,
          sandboxCategoryObserved: sb.sandboxCategory,
          explainabilityRef:
            "deterministic_partition_from_sandbox_v1_holdout_semantics",
        } satisfies Prisma.InputJsonObject,
        createdAt: batchAt,
      });
    });

    const total = sandboxes.length;
    const controlShare = total > 0 ? controlCount / total : 0;

    const controlSnapshots: Prisma.ControlCohortSnapshotCreateManyInput[] = [
      {
        controlCohortEngineVersion: CTRL_ENGINE,
        cohortCategory: CONTROL_COHORT_CATEGORY.CONTROL_HOLDOUT_INVENTORY_V1,
        aggregateWindow: windowKey,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          frameCount: controlCount,
          sampleWorkflowExecutionIds: controlSampleIds,
          partitionRuleId: PARTITION_RULE_ID,
          analyticsEngineVersionRef: OPERATIONAL_ANALYTICS_ENGINE_VERSION,
          explainabilityRef: "control_holdout_inventory_v1",
        } satisfies Prisma.InputJsonObject,
        createdAt: batchAt,
      },
      {
        controlCohortEngineVersion: CTRL_ENGINE,
        cohortCategory:
          CONTROL_COHORT_CATEGORY.INTERVENTION_MIRROR_INVENTORY_V1,
        aggregateWindow: windowKey,
        payloadJson: {
          ...GOVERNANCE_PAYLOAD,
          frameCount: mirrorCount,
          sampleWorkflowExecutionIds: mirrorSampleIds,
          partitionRuleId: PARTITION_RULE_ID,
          analyticsEngineVersionRef: OPERATIONAL_ANALYTICS_ENGINE_VERSION,
          explainabilityRef: "intervention_mirror_inventory_v1",
        } satisfies Prisma.InputJsonObject,
        createdAt: batchAt,
      },
    ];

    let balanceState: (typeof VALIDITY_CERTIFICATION_STATE)[keyof typeof VALIDITY_CERTIFICATION_STATE];
    if (total < MIN_SAMPLES_FOR_BALANCE) {
      balanceState = VALIDITY_CERTIFICATION_STATE.INSUFFICIENT_SAMPLE_V1;
    } else if (
      controlShare < CONTROL_SHARE_ATTENTION_LOW ||
      controlShare > CONTROL_SHARE_ATTENTION_HIGH
    ) {
      balanceState = VALIDITY_CERTIFICATION_STATE.ATTENTION_SKEW_V1;
    } else {
      balanceState = VALIDITY_CERTIFICATION_STATE.VALID_V1;
    }

    const certificationRows: Prisma.OperationalValidityCertificationCreateManyInput[] =
      [
        {
          validityEngineVersion: VALIDITY_ENGINE,
          aggregateWindow: windowKey,
          certificationCategory:
            VALIDITY_CERTIFICATION_CATEGORY.ASSIGNMENT_BALANCE_V1,
          certificationState: balanceState,
          payloadJson: {
            ...GOVERNANCE_PAYLOAD,
            sandboxFramesConsidered: total,
            controlHoldoutCount: controlCount,
            interventionMirrorCount: mirrorCount,
            controlShare,
            minSamplesRequired: MIN_SAMPLES_FOR_BALANCE,
            controlShareAttentionBand: [
              CONTROL_SHARE_ATTENTION_LOW,
              CONTROL_SHARE_ATTENTION_HIGH,
            ],
            partitionRuleId: PARTITION_RULE_ID,
            explainabilityRef: "assignment_balance_v1_deterministic_split",
          } satisfies Prisma.InputJsonObject,
          createdAt: batchAt,
        },
        {
          validityEngineVersion: VALIDITY_ENGINE,
          aggregateWindow: windowKey,
          certificationCategory:
            VALIDITY_CERTIFICATION_CATEGORY.REPRODUCIBILITY_MANIFEST_V1,
          certificationState: VALIDITY_CERTIFICATION_STATE.MANIFEST_COMPLETE_V1,
          payloadJson: {
            ...GOVERNANCE_PAYLOAD,
            assignmentEngineVersion: ASSIGN_ENGINE,
            controlCohortEngineVersion: CTRL_ENGINE,
            sandboxEngineVersionObserved: SANDBOX_ENGINE,
            cohortMirrorEngineVersionRef: OPERATIONAL_COHORT_ENGINE_VERSION,
            interventionEvaluationEngineVersionRef:
              INTERVENTION_EVALUATION_ENGINE_VERSION,
            longitudinalEngineVersionRef: OPERATIONAL_LONGITUDINAL_ENGINE_VERSION,
            batchCreatedAtIso: batchAt.toISOString(),
            partitionRuleId: PARTITION_RULE_ID,
            explainabilityRef: "reproducibility_manifest_v1_engine_refs",
          } satisfies Prisma.InputJsonObject,
          createdAt: batchAt,
        },
      ];

    await this.prisma.$transaction(async (tx) => {
      await tx.operationalInterventionAssignment.deleteMany({
        where: {
          assignmentEngineVersion: ASSIGN_ENGINE,
          aggregateWindow: windowKey,
        },
      });
      await tx.controlCohortSnapshot.deleteMany({
        where: {
          controlCohortEngineVersion: CTRL_ENGINE,
          aggregateWindow: windowKey,
        },
      });
      await tx.operationalValidityCertification.deleteMany({
        where: {
          validityEngineVersion: VALIDITY_ENGINE,
          aggregateWindow: windowKey,
        },
      });

      if (assignmentRows.length > 0) {
        await tx.operationalInterventionAssignment.createMany({
          data: assignmentRows,
        });
      }
      if (controlSnapshots.length > 0) {
        await tx.controlCohortSnapshot.createMany({
          data: controlSnapshots,
        });
      }
      if (certificationRows.length > 0) {
        await tx.operationalValidityCertification.createMany({
          data: certificationRows,
        });
      }
    });

    this.log.log({
      msg: "OPERATIONAL_INTERVENTION_VALIDITY_REFRESH",
      aggregateWindow: windowKey,
      interventionAssignmentsWritten: assignmentRows.length,
      controlCohortSnapshotsWritten: controlSnapshots.length,
      validityCertificationsWritten: certificationRows.length,
    });

    return {
      interventionAssignmentsWritten: assignmentRows.length,
      controlCohortSnapshotsWritten: controlSnapshots.length,
      validityCertificationsWritten: certificationRows.length,
    };
  }
}
