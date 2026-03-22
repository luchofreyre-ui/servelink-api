import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { AdminPermissions } from "../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { AdminAnomaliesService } from "./admin-anomalies.service";

@Controller("api/v1/admin/anomalies")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
export class AdminAnomaliesController {
  constructor(
    private readonly adminAnomaliesService: AdminAnomaliesService,
  ) {}

  @Get()
  @AdminPermissions("exceptions.read")
  async listOpen() {
    return this.adminAnomaliesService.listOpen();
  }

  @Patch(":id/ack")
  @AdminPermissions("exceptions.write")
  async acknowledge(@Param("id") id: string) {
    return this.adminAnomaliesService.acknowledge(id);
  }

  @Patch(":id/resolve")
  @AdminPermissions("exceptions.write")
  async resolve(@Param("id") id: string) {
    return this.adminAnomaliesService.resolve(id);
  }
}
