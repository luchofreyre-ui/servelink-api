import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { SystemTestsIncidentsReadService } from "./system-tests-incidents-read.service";

@Controller("/api/v1/admin/system-tests/incidents")
@UseGuards(JwtAuthGuard, AdminGuard)
export class SystemTestsIncidentsAdminController {
  constructor(private readonly incidentsRead: SystemTestsIncidentsReadService) {}

  @Get()
  async list(
    @Query("limit") limitRaw?: string,
    @Query("status") status?: string,
    @Query("runId") runId?: string,
  ) {
    const limitParsed = limitRaw != null ? parseInt(String(limitRaw), 10) : 80;
    const limit =
      Number.isFinite(limitParsed) && limitParsed > 0 ? limitParsed : 80;
    return this.incidentsRead.listIncidents({ limit, status, runId });
  }

  @Get(":incidentKey")
  async detail(
    @Param("incidentKey") incidentKey: string,
    @Query("runId") runId?: string,
  ) {
    return this.incidentsRead.getIncidentDetailByKey(incidentKey, { runId });
  }
}
