import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { AdminPermissions } from "../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import {
  DispatchConfigService,
  RollbackDispatchConfigFromAuditInput,
  UpdateDispatchConfigDraftInput,
} from "./dispatch-config.service";

@Controller("/api/v1/admin/dispatch-config")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
@AdminPermissions("dispatch.read")
export class DispatchConfigAdminController {
  constructor(private readonly service: DispatchConfigService) {}

  @Get("active")
  getActive() {
    return this.service.getActiveConfig();
  }

  @Get("draft")
  getDraft() {
    return this.service.getDraftConfig();
  }

  @Get("compare")
  compare() {
    return this.service.compareDraftToActive();
  }

  @Get("publish-preview")
  publishPreview() {
    return this.service.getPublishPreview();
  }

  @Get("publish-history")
  getPublishHistory(
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.service.getPublishHistory({
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      cursor: cursor ?? undefined,
    });
  }

  @Get("publish-history/latest")
  getLatestPublishAudit() {
    return this.service.getLatestPublishAudit();
  }

  @Get("publish-history/:auditId")
  getPublishAuditById(@Param("auditId") auditId: string) {
    return this.service.getPublishAuditById(auditId);
  }

  @Post("rollback-from-audit")
  @AdminPermissions("dispatch.rollback")
  rollbackFromAudit(@Body() body: RollbackDispatchConfigFromAuditInput) {
    return this.service.rollbackDraftFromAudit(body);
  }

  @Post("draft")
  @AdminPermissions("dispatch.write")
  updateDraft(@Body() body: UpdateDispatchConfigDraftInput) {
    return this.service.updateDraftConfig(body);
  }

  @Post("publish")
  @AdminPermissions("dispatch.publish")
  publish(@Body() body: { adminUserId?: string | null }) {
    return this.service.publishDraftConfig(body.adminUserId ?? null);
  }
}
