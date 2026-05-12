import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { WORKFLOW_RECOMMENDATION_ACCEPTANCE_STATE } from "./workflow-orchestration-preview.constants";

/**
 * Records human acceptance of deterministic recommendations — does not execute workflows or bookings.
 */
@Injectable()
export class WorkflowRecommendationAcceptanceService {
  constructor(private readonly prisma: PrismaService) {}

  async listForExecution(workflowExecutionId: string, take = 50) {
    const wfId = workflowExecutionId.trim();
    if (!wfId) {
      throw new BadRequestException("workflowExecutionId is required");
    }
    return this.prisma.workflowRecommendationAcceptance.findMany({
      where: { workflowExecutionId: wfId },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(take, 1), 100),
    });
  }

  async recordAcceptance(params: {
    workflowExecutionId: string;
    recommendationKey: string;
    acceptedByUserId: string;
    workflowApprovalId?: string | null;
    payloadJson?: Prisma.InputJsonValue | null;
    idempotencyKey?: string | null;
    note?: string | null;
  }): Promise<{ replay: boolean; acceptance: { id: string } }> {
    const wfId = params.workflowExecutionId.trim();
    const key = params.recommendationKey.trim();
    const actor = params.acceptedByUserId.trim();
    if (!wfId) {
      throw new BadRequestException("workflowExecutionId is required");
    }
    if (!key) {
      throw new BadRequestException("recommendationKey is required");
    }
    if (!actor) {
      throw new BadRequestException("acceptedByUserId is required");
    }

    const wf = await this.prisma.workflowExecution.findUnique({
      where: { id: wfId },
      select: { id: true },
    });
    if (!wf) {
      throw new NotFoundException("WORKFLOW_EXECUTION_NOT_FOUND");
    }

    const idem = params.idempotencyKey?.trim() || null;
    if (idem) {
      const existing = await this.prisma.workflowRecommendationAcceptance.findUnique({
        where: { idempotencyKey: idem },
      });
      if (existing) {
        if (
          existing.workflowExecutionId !== wfId ||
          existing.recommendationKey !== key
        ) {
          throw new BadRequestException("IDEMPOTENCY_KEY_SCOPE_MISMATCH");
        }
        return { replay: true, acceptance: { id: existing.id } };
      }
    }

    let approvalId: string | null = params.workflowApprovalId?.trim() || null;
    if (approvalId) {
      const approval = await this.prisma.workflowApproval.findUnique({
        where: { id: approvalId },
        select: { id: true, workflowExecutionId: true },
      });
      if (!approval) {
        throw new NotFoundException("WORKFLOW_APPROVAL_NOT_FOUND");
      }
      if (approval.workflowExecutionId !== wfId) {
        throw new BadRequestException("WORKFLOW_APPROVAL_EXECUTION_MISMATCH");
      }
    } else {
      approvalId = null;
    }

    const mergedPayload: Prisma.InputJsonValue =
      params.note?.trim() ?
        ({
          ...(typeof params.payloadJson === "object" &&
          params.payloadJson !== null &&
          !Array.isArray(params.payloadJson)
            ? (params.payloadJson as Record<string, unknown>)
            : {}),
          note: params.note.trim(),
        } as Prisma.InputJsonValue)
      : params.payloadJson ?? ({} as Prisma.InputJsonValue);

    const acceptance = await this.prisma.$transaction(async (tx) => {
      await tx.workflowRecommendationAcceptance.updateMany({
        where: {
          workflowExecutionId: wfId,
          recommendationKey: key,
          acceptanceState: WORKFLOW_RECOMMENDATION_ACCEPTANCE_STATE.RECORDED,
        },
        data: {
          acceptanceState: WORKFLOW_RECOMMENDATION_ACCEPTANCE_STATE.SUPERSEDED,
        },
      });

      return tx.workflowRecommendationAcceptance.create({
        data: {
          workflowExecutionId: wfId,
          recommendationKey: key,
          acceptanceState: WORKFLOW_RECOMMENDATION_ACCEPTANCE_STATE.RECORDED,
          acceptedByUserId: actor,
          acceptedAt: new Date(),
          workflowApprovalId: approvalId,
          payloadJson: mergedPayload,
          idempotencyKey: idem,
        },
        select: { id: true },
      });
    });

    return { replay: false, acceptance };
  }

  async revokeAcceptance(params: {
    acceptanceId: string;
    revokedByUserId: string;
  }): Promise<{ ok: true }> {
    const id = params.acceptanceId.trim();
    const actor = params.revokedByUserId.trim();
    if (!id) {
      throw new BadRequestException("acceptanceId is required");
    }
    if (!actor) {
      throw new BadRequestException("revokedByUserId is required");
    }

    const row = await this.prisma.workflowRecommendationAcceptance.findUnique({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException("RECOMMENDATION_ACCEPTANCE_NOT_FOUND");
    }
    if (row.acceptanceState !== WORKFLOW_RECOMMENDATION_ACCEPTANCE_STATE.RECORDED) {
      throw new ConflictException("ACCEPTANCE_NOT_ACTIVE");
    }

    await this.prisma.workflowRecommendationAcceptance.update({
      where: { id },
      data: {
        acceptanceState: WORKFLOW_RECOMMENDATION_ACCEPTANCE_STATE.REVOKED,
        revokedAt: new Date(),
        revokedByUserId: actor,
      },
    });

    return { ok: true };
  }
}
