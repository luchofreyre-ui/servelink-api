import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { AdminPermissions } from "../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { DispatchOpsService } from "./dispatch-ops.service";

@Controller("/api/v1/admin/bookings")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
@AdminPermissions("dispatch.ops")
export class AdminDispatchOpsController {
  constructor(private readonly service: DispatchOpsService) {}

  @Post(":id/dispatch/manual-redispatch")
  manualRedispatch(@Param("id") id: string, @Body() body: { adminId?: string }) {
    return this.service.manualRedispatch(id, body.adminId ?? "");
  }

  @Post(":id/dispatch/manual-assign")
  manualAssign(@Param("id") id: string, @Body() body: { franchiseOwnerId?: string; adminId?: string }) {
    return this.service.manualAssign(
      id,
      body.franchiseOwnerId ?? "",
      body.adminId ?? "",
    );
  }

  @Post(":id/dispatch/exclude-provider")
  excludeProvider(@Param("id") id: string, @Body() body: { franchiseOwnerId?: string; adminId?: string }) {
    return this.service.excludeProvider(
      id,
      body.franchiseOwnerId ?? "",
      body.adminId ?? "",
    );
  }

  @Post(":id/dispatch/clear-exclusions")
  clearExclusions(@Param("id") id: string, @Body() body: { adminId?: string }) {
    return this.service.clearExclusions(id, body.adminId ?? "");
  }
}
