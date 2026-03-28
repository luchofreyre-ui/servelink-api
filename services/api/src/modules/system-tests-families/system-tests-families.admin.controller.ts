import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { SystemTestsFamiliesReadService } from "./system-tests-families-read.service";

@Controller("/api/v1/admin/system-tests/families")
@UseGuards(JwtAuthGuard, AdminGuard)
export class SystemTestsFamiliesAdminController {
  constructor(private readonly familiesRead: SystemTestsFamiliesReadService) {}

  @Get()
  async list(
    @Query("limit") limitRaw?: string,
    @Query("status") status?: string,
  ) {
    const limitParsed = limitRaw != null ? parseInt(String(limitRaw), 10) : 60;
    const limit =
      Number.isFinite(limitParsed) && limitParsed > 0 ? limitParsed : 60;
    return this.familiesRead.listFamilies({ limit, status });
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    return this.familiesRead.getFamilyDetail(id);
  }
}
