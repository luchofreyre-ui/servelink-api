import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { AdminPermissions } from "../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { EstimatorService, type EstimateInput } from "../estimate/estimator.service";
import { DeepCleanEstimatorConfigService } from "./deep-clean-estimator-config.service";
import type { DeepCleanEstimatorConfigPayload } from "./deep-clean-estimator-config.types";
import {
  PreviewDeepCleanEstimatorRequestDto,
  UpdateDeepCleanEstimatorDraftRequestDto,
} from "./dto/deep-clean-estimator-config.dto";

type AuthedRequest = {
  user?: { userId?: string; role?: string; email?: string };
};

function programWallDurationMinutes(est: {
  estimatedDurationMinutes: number;
  deepCleanProgram?: { visits: Array<{ estimatedDurationMinutes: number }> };
}): number {
  if (est.deepCleanProgram?.visits?.length) {
    return est.deepCleanProgram.visits.reduce((s, v) => s + v.estimatedDurationMinutes, 0);
  }
  return est.estimatedDurationMinutes;
}

@Controller("api/v1/admin/deep-clean/estimator-config")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
export class DeepCleanEstimatorConfigAdminController {
  constructor(
    private readonly configService: DeepCleanEstimatorConfigService,
    private readonly estimator: EstimatorService,
  ) {}

  @Get("active")
  @AdminPermissions("exceptions.read")
  async getActive() {
    const row = await this.configService.getActiveConfig();
    return { kind: "deep_clean_estimator_config_active" as const, row };
  }

  @Get("draft")
  @AdminPermissions("exceptions.read")
  async getDraft() {
    const row = await this.configService.getDraftConfig();
    return { kind: "deep_clean_estimator_config_draft" as const, row };
  }

  @Get("history")
  @AdminPermissions("exceptions.read")
  async getGovernanceHistory() {
    const rows = await this.configService.listConfigsForGovernance();
    return { kind: "deep_clean_estimator_config_history" as const, rows };
  }

  @Get(":id")
  @AdminPermissions("exceptions.read")
  async getConfigDetail(@Param("id") id: string) {
    const row = await this.configService.getConfigDetailById(id);
    return { kind: "deep_clean_estimator_config_detail" as const, row };
  }

  @Post(":id/restore-to-draft")
  @HttpCode(HttpStatus.OK)
  @AdminPermissions("exceptions.read")
  async restoreToDraft(@Param("id") id: string, @Req() req: AuthedRequest) {
    const userId = req.user?.userId ?? null;
    const { draft, restoredFromVersion } = await this.configService.restoreConfigToDraft({
      sourceConfigId: id,
      actorUserId: userId,
    });
    return {
      kind: "deep_clean_estimator_config_restored_to_draft" as const,
      draft,
      restoredFromVersion,
    };
  }

  @Post("draft")
  @HttpCode(HttpStatus.OK)
  @AdminPermissions("exceptions.read")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async updateDraft(@Body() body: UpdateDeepCleanEstimatorDraftRequestDto, @Req() req: AuthedRequest) {
    const userId = req.user?.userId ?? null;
    const row = await this.configService.updateDraftConfig({
      label: body.label,
      config: body.config as unknown as DeepCleanEstimatorConfigPayload,
      userId,
    });
    return { kind: "deep_clean_estimator_config_draft_updated" as const, row };
  }

  @Post("publish")
  @HttpCode(HttpStatus.OK)
  @AdminPermissions("exceptions.read")
  async publish(@Req() req: AuthedRequest) {
    const userId = req.user?.userId ?? null;
    const { published, newDraft } = await this.configService.publishDraftConfig({ userId });
    return {
      kind: "deep_clean_estimator_config_published" as const,
      published,
      newDraft,
    };
  }

  @Post("preview")
  @HttpCode(HttpStatus.OK)
  @AdminPermissions("exceptions.read")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async preview(@Body() body: PreviewDeepCleanEstimatorRequestDto) {
    const input = body.estimateInput as EstimateInput;
    if (input?.service_type !== "deep_clean") {
      throw new BadRequestException("estimateInput.service_type must be deep_clean");
    }

    const active = await this.configService.getActiveConfig();
    const draft = await this.configService.getDraftConfig();

    const activeEst = await this.estimator.estimate(input, {
      deepCleanTuningOverride: {
        config: active.config,
        meta: { id: active.id, version: active.version, label: active.label },
      },
    });

    const draftEst = await this.estimator.estimate(input, {
      deepCleanTuningOverride: {
        config: draft.config,
        meta: { id: draft.id, version: draft.version, label: draft.label },
      },
    });

    const activeTotal = programWallDurationMinutes(activeEst);
    const draftTotal = programWallDurationMinutes(draftEst);
    const deltaMinutes = draftTotal - activeTotal;
    const deltaPercent =
      activeTotal > 0 ? Math.round((deltaMinutes / activeTotal) * 1000) / 10 : null;

    return {
      kind: "deep_clean_estimator_preview" as const,
      active: {
        id: active.id,
        version: active.version,
        label: active.label,
        totalEstimatedDurationMinutes: activeTotal,
        perVisitDurationMinutes:
          activeEst.deepCleanProgram?.visits.map((v) => v.estimatedDurationMinutes) ?? [],
        estimatedPriceCents: activeEst.estimatedPriceCents,
      },
      draft: {
        id: draft.id,
        version: draft.version,
        label: draft.label,
        totalEstimatedDurationMinutes: draftTotal,
        perVisitDurationMinutes:
          draftEst.deepCleanProgram?.visits.map((v) => v.estimatedDurationMinutes) ?? [],
        estimatedPriceCents: draftEst.estimatedPriceCents,
      },
      deltaMinutes,
      deltaPercent,
    };
  }
}
