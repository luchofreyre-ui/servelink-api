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
import { AdminPermissions } from "../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import {
  AddDispatchExceptionActionNoteDto,
  UpdateDispatchExceptionActionOwnerDto,
  UpdateDispatchExceptionActionPriorityDto,
  UpdateDispatchExceptionActionStatusDto,
} from "./dto/dispatch-exception-actions.dto";
import { DispatchExceptionActionsService } from "./dispatch-exception-actions.service";

type AuthedRequest = Request & { user?: JwtValidatedUser };

@Controller("/api/v1/admin/dispatch/exception-actions")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
export class DispatchExceptionActionsAdminController {
  constructor(private readonly actions: DispatchExceptionActionsService) {}

  @Get()
  @AdminPermissions("exceptions.read")
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

  @Get(":dispatchExceptionKey")
  @AdminPermissions("exceptions.read")
  async detail(
    @Param("dispatchExceptionKey") dispatchExceptionKey: string,
    @Req() _req: AuthedRequest,
  ) {
    return this.actions.getActionDetail(dispatchExceptionKey);
  }

  @Patch(":dispatchExceptionKey/assign-to-me")
  @AdminPermissions("exceptions.write")
  async assignToMe(
    @Param("dispatchExceptionKey") dispatchExceptionKey: string,
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException("AUTH_USER_REQUIRED");
    }
    return this.actions.assignToMe({
      dispatchExceptionKey,
      actorUserId: userId,
    });
  }

  @Patch(":dispatchExceptionKey/owner")
  @AdminPermissions("exceptions.write")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async updateOwner(
    @Param("dispatchExceptionKey") dispatchExceptionKey: string,
    @Body() body: UpdateDispatchExceptionActionOwnerDto,
    @Req() req: AuthedRequest,
  ) {
    return this.actions.updateOwner({
      dispatchExceptionKey,
      ownerUserId: body.ownerUserId,
      actorUserId: req.user?.userId ?? null,
    });
  }

  @Patch(":dispatchExceptionKey/priority")
  @AdminPermissions("exceptions.write")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async updatePriority(
    @Param("dispatchExceptionKey") dispatchExceptionKey: string,
    @Body() body: UpdateDispatchExceptionActionPriorityDto,
    @Req() req: AuthedRequest,
  ) {
    return this.actions.updatePriority({
      dispatchExceptionKey,
      priority: body.priority,
      actorUserId: req.user?.userId ?? null,
    });
  }

  @Patch(":dispatchExceptionKey/status")
  @AdminPermissions("exceptions.write")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async updateStatus(
    @Param("dispatchExceptionKey") dispatchExceptionKey: string,
    @Body() body: UpdateDispatchExceptionActionStatusDto,
    @Req() req: AuthedRequest,
  ) {
    return this.actions.updateStatus({
      dispatchExceptionKey,
      status: body.status,
      actorUserId: req.user?.userId ?? null,
    });
  }

  @Post(":dispatchExceptionKey/notes")
  @AdminPermissions("exceptions.write")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async addNote(
    @Param("dispatchExceptionKey") dispatchExceptionKey: string,
    @Body() body: AddDispatchExceptionActionNoteDto,
    @Req() req: AuthedRequest,
  ) {
    return this.actions.addNote({
      dispatchExceptionKey,
      text: body.text,
      actorUserId: req.user?.userId ?? null,
    });
  }
}
