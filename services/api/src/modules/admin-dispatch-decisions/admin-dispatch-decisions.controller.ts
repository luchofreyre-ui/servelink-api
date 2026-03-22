import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { AdminPermissions } from "../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { CreateAdminDispatchDecisionDto } from "./dto/create-admin-dispatch-decision.dto";
import { AdminDispatchDecisionsService } from "./admin-dispatch-decisions.service";

type AuthenticatedRequest = Request & {
  user?: {
    userId?: string;
  };
};

@Controller("api/v1/admin/dispatch-decisions")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
export class AdminDispatchDecisionsController {
  constructor(private readonly adminDispatchDecisionsService: AdminDispatchDecisionsService) {}

  @Post(":id/execute")
  @HttpCode(HttpStatus.OK)
  @AdminPermissions("admin:write", "dispatch:write")
  async executeDecision(@Param("id") id: string) {
    return this.adminDispatchDecisionsService.executeExistingDecision(id);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @AdminPermissions("admin:write", "dispatch:write")
  async createDecision(@Body() dto: CreateAdminDispatchDecisionDto, @Req() req: AuthenticatedRequest) {
    const submittedByUserId = req.user?.userId;

    if (!submittedByUserId) {
      return {
        ok: false,
        status: "rejected" as const,
        message: "Authenticated admin user id is required.",
      };
    }

    return this.adminDispatchDecisionsService.createDecision(dto, submittedByUserId);
  }
}
