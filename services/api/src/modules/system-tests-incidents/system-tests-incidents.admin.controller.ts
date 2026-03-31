import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import {
  parseConfidenceTierParam,
  parseIncludeDormantParam,
  parseIncludeResolvedParam,
  parseIncidentListSortBy,
  parseLifecycleStateParam,
  parseShowDismissedParam,
  parseSortDirectionParam,
} from "../system-tests/system-test-resolution-preview-filters";
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
    @Query("diagnosisCategory") diagnosisCategory?: string,
    @Query("confidenceTier") confidenceTierRaw?: string,
    @Query("sortBy") sortByRaw?: string,
    @Query("sortDirection") sortDirectionRaw?: string,
    @Query("showDismissed") showDismissedRaw?: string,
    @Query("lifecycleState") lifecycleStateRaw?: string,
    @Query("includeDormant") includeDormantRaw?: string,
    @Query("includeResolved") includeResolvedRaw?: string,
  ) {
    const limitParsed = limitRaw != null ? parseInt(String(limitRaw), 10) : 80;
    const limit =
      Number.isFinite(limitParsed) && limitParsed > 0 ? limitParsed : 80;
    const confidenceTier = parseConfidenceTierParam(confidenceTierRaw);
    return this.incidentsRead.listIncidents({
      limit,
      status,
      runId,
      diagnosisCategory: diagnosisCategory?.trim() || undefined,
      confidenceTier,
      sortBy: parseIncidentListSortBy(sortByRaw),
      sortDirection: parseSortDirectionParam(sortDirectionRaw),
      showDismissed: parseShowDismissedParam(showDismissedRaw),
      lifecycleState: parseLifecycleStateParam(lifecycleStateRaw),
      includeDormant: parseIncludeDormantParam(includeDormantRaw),
      includeResolved: parseIncludeResolvedParam(includeResolvedRaw),
    });
  }

  @Get(":incidentKey")
  async detail(
    @Param("incidentKey") incidentKey: string,
    @Query("runId") runId?: string,
  ) {
    return this.incidentsRead.getIncidentDetailByKey(incidentKey, { runId });
  }
}
