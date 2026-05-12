import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { OPERATIONAL_POLICY_ENGINE_VERSION } from "./operational-policy.constants";
import {
  evaluateOperationalPoliciesForExecution,
} from "./operational-policy-rules.evaluator";

function severityRank(s: string): number {
  switch (s) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

@Injectable()
export class OperationalPolicyEvaluationService {
  private readonly log = new Logger(OperationalPolicyEvaluationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Replace snapshot rows for this engine version — deterministic audit replacement (no autonomous side-effects).
   */
  async persistSnapshot(workflowExecutionId: string): Promise<void> {
    const ex = await this.prisma.workflowExecution.findUnique({
      where: { id: workflowExecutionId },
      include: {
        steps: {
          select: {
            state: true,
            governanceOutcome: true,
            failedAt: true,
          },
        },
        approvals: {
          select: {
            approvalType: true,
            approvalState: true,
            expiresAt: true,
            requestedAt: true,
            metadataJson: true,
          },
        },
      },
    });

    if (!ex) {
      this.log.warn({
        msg: "OPERATIONAL_POLICY_SNAPSHOT_SKIP",
        workflowExecutionId,
        reason: "execution_not_found",
      });
      return;
    }

    const drafts = evaluateOperationalPoliciesForExecution({
      id: ex.id,
      state: ex.state,
      executionStage: ex.executionStage,
      executionMode: ex.executionMode,
      approvalState: ex.approvalState,
      failureReason: ex.failureReason,
      steps: ex.steps,
      approvals: ex.approvals,
    });

    const mergedByKey = new Map<string, (typeof drafts)[number]>();
    for (const d of drafts) {
      const cur = mergedByKey.get(d.policyKey);
      if (!cur || severityRank(d.severity) > severityRank(cur.severity)) {
        mergedByKey.set(d.policyKey, d);
      }
    }
    const mergedDrafts = [...mergedByKey.values()];

    await this.prisma.$transaction(async (tx) => {
      await tx.operationalPolicyEvaluation.deleteMany({
        where: {
          workflowExecutionId,
          policyEngineVersion: OPERATIONAL_POLICY_ENGINE_VERSION,
        },
      });

      if (mergedDrafts.length === 0) return;

      await tx.operationalPolicyEvaluation.createMany({
        data: mergedDrafts.map((d) => ({
          workflowExecutionId,
          policyEngineVersion: OPERATIONAL_POLICY_ENGINE_VERSION,
          policyCategory: d.policyCategory,
          policyKey: d.policyKey,
          evaluationResult: d.evaluationResult,
          severity: d.severity,
          explanation: d.explanation,
          payloadJson: (d.payloadJson ?? {}) as Prisma.InputJsonValue,
        })),
      });
    });
  }

  async listForExecution(workflowExecutionId: string | null | undefined) {
    if (!workflowExecutionId) return [];
    return this.prisma.operationalPolicyEvaluation.findMany({
      where: {
        workflowExecutionId,
        policyEngineVersion: OPERATIONAL_POLICY_ENGINE_VERSION,
      },
      orderBy: [{ policyCategory: "asc" }, { policyKey: "asc" }],
    });
  }
}
