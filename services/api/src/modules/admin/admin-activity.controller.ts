import { Controller, Get, Header, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { AdminPermissions } from "../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { AdminActivityService } from "./admin-activity.service";

@Controller("/api/v1/admin")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
@AdminPermissions("audit.read")
export class AdminActivityController {
  constructor(private readonly activity: AdminActivityService) {}

  @Get("activity")
  @Header("Cache-Control", "private, no-store, max-age=0, must-revalidate")
  getActivity(@Query("limit") limit?: string, @Query("cursor") cursor?: string) {
    const parsed = limit ? parseInt(limit, 10) : undefined;
    const limitNum =
      parsed != null && Number.isFinite(parsed)
        ? Math.min(Math.max(parsed, 1), 100)
        : undefined;
    const offsetParsed = cursor ? parseInt(String(cursor), 10) : 0;
    const offset =
      Number.isFinite(offsetParsed) && offsetParsed >= 0 ? Math.min(offsetParsed, 200) : 0;
    return this.activity.getActivity({ limit: limitNum, offset });
  }
}
