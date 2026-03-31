import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";

import {
  parseIncludeDormantParam,
  parseIncludeResolvedParam,
  parseShowDismissedParam,
} from "./system-test-resolution-preview-filters";

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { SystemTestReportIngestDto } from "./dto/system-test-report.dto";
import type { SystemTestResolutionDto } from "./dto/system-test-resolution.dto";
import { SystemTestsService } from "./system-tests.service";

@Controller("/api/v1/admin/system-tests")
@UseGuards(JwtAuthGuard, AdminGuard)
export class SystemTestsAdminController {
  constructor(private readonly systemTests: SystemTestsService) {}

  @Post("report")
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async ingestReport(@Body() body: SystemTestReportIngestDto) {
    return this.systemTests.ingestReport(body);
  }

  @Get("summary")
  async summary(
    @Query("showDismissed") showDismissedRaw?: string,
    @Query("includeDormant") includeDormantRaw?: string,
    @Query("includeResolved") includeResolvedRaw?: string,
  ) {
    return this.systemTests.getSummary({
      showDismissed: parseShowDismissedParam(showDismissedRaw),
      includeDormant: parseIncludeDormantParam(includeDormantRaw),
      includeResolved: parseIncludeResolvedParam(includeResolvedRaw),
    });
  }

  @Get("runs")
  async listRuns(
    @Query("limit") limitRaw?: string,
    @Query("page") pageRaw?: string,
  ) {
    const limitParsed = limitRaw != null ? parseInt(String(limitRaw), 10) : 20;
    const limit =
      Number.isFinite(limitParsed) && limitParsed > 0
        ? Math.min(100, limitParsed)
        : 20;
    const pageParsed = pageRaw != null ? parseInt(String(pageRaw), 10) : 1;
    const page = Number.isFinite(pageParsed) && pageParsed > 0 ? pageParsed : 1;
    return this.systemTests.listRuns({ limit, page });
  }

  @Get("runs/:id")
  async runDetail(@Param("id") id: string) {
    return this.systemTests.getRunDetail(id);
  }

  @Get("families/:familyId/resolution")
  async getFamilyResolution(@Param("familyId") familyId: string): Promise<SystemTestResolutionDto> {
    return this.systemTests.getFamilyResolution(familyId);
  }
}
