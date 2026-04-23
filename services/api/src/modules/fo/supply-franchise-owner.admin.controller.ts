import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { FoScheduleService } from "../franchise-owner/fo-schedule.service";
import { isFoSupplyQueueState } from "./fo-supply-queue";
import { FoService } from "./fo.service";

/**
 * Internal admin: FO supply detail, profile patch, and weekly schedule replace.
 * Mutations honor Prisma FO activation guards + `FoScheduleService` rules.
 */
@Controller("/api/v1/admin/supply/franchise-owners")
@UseGuards(JwtAuthGuard, AdminGuard)
export class SupplyFranchiseOwnerAdminController {
  constructor(
    private readonly foService: FoService,
    private readonly foScheduleService: FoScheduleService,
  ) {}

  @Get()
  listOverview(@Query("queue") queue?: string) {
    if (queue != null && queue !== "") {
      if (!isFoSupplyQueueState(queue)) {
        throw new BadRequestException("INVALID_QUEUE_FILTER");
      }
      return this.foService.listAdminSupplyFranchiseOwnersOverview({ queue });
    }
    return this.foService.listAdminSupplyFranchiseOwnersOverview();
  }

  /** Draft FO (onboarding) — no schedule or activation required at create time. */
  @Post()
  @HttpCode(201)
  createDraft(
    @Body() body: { displayName?: string; email?: string },
  ) {
    return this.foService.createAdminDraftFranchiseOwner(body ?? {});
  }

  @Get(":foId")
  getDetail(@Param("foId") foId: string) {
    return this.foService.getAdminFoSupplyDetail(foId);
  }

  @Patch(":foId")
  patchFranchiseOwner(
    @Param("foId") foId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.foService.patchFranchiseOwnerAdmin(foId, body ?? {});
  }

  @Put(":foId/weekly-schedule")
  async replaceWeeklySchedule(
    @Param("foId") foId: string,
    @Body() body: { schedule?: unknown[] },
  ) {
    await this.foScheduleService.setWeeklySchedule(foId, body?.schedule ?? []);
    return this.foService.getAdminFoSupplyDetail(foId);
  }
}
