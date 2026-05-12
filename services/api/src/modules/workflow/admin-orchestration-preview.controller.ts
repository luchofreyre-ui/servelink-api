import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { WorkflowOrchestrationPreviewService } from "./workflow-orchestration-preview.service";
import { WorkflowRecommendationAcceptanceService } from "./workflow-recommendation-acceptance.service";

type AuthedRequest = { user?: { userId: string; role: string } };

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("/api/v1/admin/orchestration-preview")
export class AdminOrchestrationPreviewController {
  constructor(
    private readonly preview: WorkflowOrchestrationPreviewService,
    private readonly acceptance: WorkflowRecommendationAcceptanceService,
  ) {}

  /** Persisted deterministic orchestration simulation — does not advance workflows or mutate bookings. */
  @Post("dry-run")
  async dryRun(
    @Req() req: AuthedRequest,
    @Body()
    body: {
      workflowExecutionId?: string;
      previewCategory?: string;
      recommendationKey?: string | null;
      idempotencyKey?: string | null;
    },
  ) {
    const actor = req.user?.userId?.trim();
    if (!actor) {
      throw new UnauthorizedException();
    }
    const wfId = body?.workflowExecutionId?.trim();
    if (!wfId) {
      throw new BadRequestException("workflowExecutionId is required");
    }
    const result = await this.preview.runDryRun({
      workflowExecutionId: wfId,
      previewCategory: body?.previewCategory,
      recommendationKey: body?.recommendationKey ?? null,
      idempotencyKey: body?.idempotencyKey ?? null,
      requestedByUserId: actor,
    });
    return { ok: true, ...result };
  }

  @Get("dry-runs")
  async listDryRuns(
    @Query("workflowExecutionId") workflowExecutionId: string | undefined,
    @Query("take") takeRaw?: string,
  ) {
    const wfId = workflowExecutionId?.trim();
    if (!wfId) {
      throw new BadRequestException("workflowExecutionId is required");
    }
    const parsed = takeRaw != null ? Number(takeRaw) : 25;
    const take =
      Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 25;
    const items = await this.preview.listDryRunsForExecution(wfId, take);
    return { ok: true, items };
  }

  /** Records operator intent toward a deterministic recommendation — non-executing. */
  @Post("recommendation-acceptance")
  async recordRecommendationAcceptance(
    @Req() req: AuthedRequest,
    @Body()
    body: {
      workflowExecutionId?: string;
      recommendationKey?: string;
      workflowApprovalId?: string | null;
      idempotencyKey?: string | null;
      note?: string | null;
      payloadJson?: unknown;
    },
  ) {
    const actor = req.user?.userId?.trim();
    if (!actor) {
      throw new UnauthorizedException();
    }
    const wfId = body?.workflowExecutionId?.trim();
    const key = body?.recommendationKey?.trim();
    if (!wfId || !key) {
      throw new BadRequestException(
        "workflowExecutionId and recommendationKey are required",
      );
    }
    const result = await this.acceptance.recordAcceptance({
      workflowExecutionId: wfId,
      recommendationKey: key,
      acceptedByUserId: actor,
      workflowApprovalId: body.workflowApprovalId ?? null,
      payloadJson:
        body.payloadJson !== undefined &&
        body.payloadJson !== null &&
        typeof body.payloadJson === "object"
          ? (body.payloadJson as Prisma.InputJsonValue)
          : undefined,
      idempotencyKey: body.idempotencyKey ?? null,
      note: body.note ?? null,
    });
    return { ok: true, ...result };
  }

  @Get("recommendation-acceptances")
  async listRecommendationAcceptances(
    @Query("workflowExecutionId") workflowExecutionId: string | undefined,
    @Query("take") takeRaw?: string,
  ) {
    const wfId = workflowExecutionId?.trim();
    if (!wfId) {
      throw new BadRequestException("workflowExecutionId is required");
    }
    const parsed = takeRaw != null ? Number(takeRaw) : 50;
    const take =
      Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 50;
    const items = await this.acceptance.listForExecution(wfId, take);
    return { ok: true, items };
  }

  @Post("recommendation-acceptance/revoke")
  async revokeRecommendationAcceptance(
    @Req() req: AuthedRequest,
    @Body() body: { acceptanceId?: string },
  ) {
    const actor = req.user?.userId?.trim();
    if (!actor) {
      throw new UnauthorizedException();
    }
    const acceptanceId = body?.acceptanceId?.trim();
    if (!acceptanceId) {
      throw new BadRequestException("acceptanceId is required");
    }
    await this.acceptance.revokeAcceptance({
      acceptanceId,
      revokedByUserId: actor,
    });
    return { ok: true };
  }
}
