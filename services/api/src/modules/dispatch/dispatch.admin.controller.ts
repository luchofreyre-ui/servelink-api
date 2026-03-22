import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { AdminPermissions } from "../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import type { GetAdminDispatchExceptionsQueryDto } from "./dto/admin-dispatch-exceptions.dto";
import { DispatchDecisionService } from "../bookings/dispatch-decision.service";

@Controller("/api/v1/admin/dispatch")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
@AdminPermissions("exceptions.read")
export class DispatchAdminController {
  constructor(private readonly dispatchDecisionService: DispatchDecisionService) {}

  @Get("exceptions")
  async getDispatchExceptions(
    @Query() query: GetAdminDispatchExceptionsQueryDto,
  ) {
    const requiresFollowUp =
      query.requiresFollowUp === "1" || query.requiresFollowUp === "true";
    const limit = query.limit ? Math.min(Math.max(Number(query.limit), 1), 100) : 25;
    return this.dispatchDecisionService.getDispatchExceptions({
      type: query.type ?? "all",
      bookingStatus: query.bookingStatus ?? null,
      minDispatchPasses: query.minDispatchPasses
        ? Number(query.minDispatchPasses)
        : 3,
      limit,
      cursor: query.cursor ?? null,
      sortBy: query.sortBy ?? undefined,
      sortOrder: query.sortOrder === "asc" ? "asc" : "desc",
      requiresFollowUp: requiresFollowUp || undefined,
      priorityBucket: query.priorityBucket ?? null,
    });
  }
}
