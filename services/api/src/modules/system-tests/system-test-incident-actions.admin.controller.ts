import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import type { Request } from "express";

import { JwtValidatedUser } from "../../auth/jwt.strategy";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import {
  AddSystemTestIncidentNoteDto,
  UpdateSystemTestIncidentActionOwnerDto,
  UpdateSystemTestIncidentActionPriorityDto,
  UpdateSystemTestIncidentActionStatusDto,
  UpdateSystemTestIncidentStepExecutionDto,
} from "./dto/system-test-incident-actions.dto";
import { SystemTestIncidentActionsService } from "./system-test-incident-actions.service";

type AuthedRequest = Request & { user?: JwtValidatedUser };

@Controller("/api/v1/admin/system-tests/incident-actions")
@UseGuards(JwtAuthGuard, AdminGuard)
export class SystemTestIncidentActionsAdminController {
  constructor(private readonly actions: SystemTestIncidentActionsService) {}

  @Get()
  async list(
    @Query("status") status?: string | string[],
    @Query("priority") priority?: string | string[],
    @Query("validationState") validationState?: string | string[],
    @Query("slaStatus") slaStatus?: string | string[],
    @Query("needsValidation") needsValidationRaw?: string,
    @Query("escalationReady") escalationReadyRaw?: string,
    @Query("unassignedOnly") unassignedOnlyRaw?: string,
    @Query("ownerUserId") ownerUserId?: string,
    @Query("search") search?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limitParsed =
      limitRaw != null && limitRaw !== "" ?
        parseInt(String(limitRaw), 10)
      : NaN;
    const limit =
      Number.isFinite(limitParsed) && limitParsed > 0 ? limitParsed : undefined;

    const needsValidation =
      needsValidationRaw === "true" || needsValidationRaw === "1" ?
        true
      : undefined;

    const escalationReady =
      escalationReadyRaw === "true" || escalationReadyRaw === "1" ?
        true
      : undefined;

    const unassignedOnly =
      unassignedOnlyRaw === "true" || unassignedOnlyRaw === "1" ?
        true
      : undefined;

    return this.actions.listActions({
      status,
      priority,
      validationState,
      slaStatus,
      needsValidation,
      escalationReady,
      unassignedOnly,
      ownerUserId,
      search,
      limit,
    });
  }

  @Get(":incidentKey")
  async detail(@Param("incidentKey") incidentKey: string, @Req() req: AuthedRequest) {
    return this.actions.getActionDetail(incidentKey, req.user?.userId ?? null);
  }

  @Patch(":incidentKey/assign-to-me")
  async assignToMe(
    @Param("incidentKey") incidentKey: string,
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException("AUTH_USER_REQUIRED");
    }
    return this.actions.assignToMe({ incidentKey, actorUserId: userId });
  }

  @Patch(":incidentKey/owner")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async updateOwner(
    @Param("incidentKey") incidentKey: string,
    @Body() body: UpdateSystemTestIncidentActionOwnerDto,
    @Req() req: AuthedRequest,
  ) {
    return this.actions.updateOwner({
      incidentKey,
      ownerUserId: body.ownerUserId,
      actorUserId: req.user?.userId ?? null,
    });
  }

  @Patch(":incidentKey/priority")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async updatePriority(
    @Param("incidentKey") incidentKey: string,
    @Body() body: UpdateSystemTestIncidentActionPriorityDto,
    @Req() req: AuthedRequest,
  ) {
    return this.actions.updatePriority({
      incidentKey,
      priority: body.priority,
      actorUserId: req.user?.userId ?? null,
    });
  }

  @Patch(":incidentKey/status")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async updateStatus(
    @Param("incidentKey") incidentKey: string,
    @Body() body: UpdateSystemTestIncidentActionStatusDto,
    @Req() req: AuthedRequest,
  ) {
    return this.actions.updateStatus({
      incidentKey,
      status: body.status,
      actorUserId: req.user?.userId ?? null,
    });
  }

  @Post(":incidentKey/notes")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async addNote(
    @Param("incidentKey") incidentKey: string,
    @Body() body: AddSystemTestIncidentNoteDto,
    @Req() req: AuthedRequest,
  ) {
    return this.actions.addNote({
      incidentKey,
      text: body.text,
      actorUserId: req.user?.userId ?? null,
    });
  }

  @Patch(":incidentKey/steps")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async updateStep(
    @Param("incidentKey") incidentKey: string,
    @Body() body: UpdateSystemTestIncidentStepExecutionDto,
    @Req() req: AuthedRequest,
  ) {
    return this.actions.updateStepExecution({
      incidentKey,
      stepIndex: body.stepIndex,
      status: body.status,
      notes: body.notes,
      actorUserId: req.user?.userId ?? null,
    });
  }
}
