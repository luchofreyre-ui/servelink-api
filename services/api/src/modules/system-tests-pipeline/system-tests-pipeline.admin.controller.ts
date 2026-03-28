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
} from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { SystemTestsPipelineJobsService } from "./system-tests-pipeline-jobs.service";
import { SystemTestsPipelineService } from "./system-tests-pipeline.service";

@Controller("/api/v1/admin/system-tests/pipeline")
@UseGuards(JwtAuthGuard, AdminGuard)
export class SystemTestsPipelineAdminController {
  constructor(
    private readonly pipeline: SystemTestsPipelineService,
    private readonly jobs: SystemTestsPipelineJobsService,
  ) {}

  @Get("jobs")
  async listJobs(@Query("limit") limitRaw?: string) {
    const n = limitRaw != null ? parseInt(String(limitRaw), 10) : 80;
    const limit = Number.isFinite(n) && n > 0 ? Math.min(200, n) : 80;
    const items = await this.jobs.listRecent(limit);
    return { items };
  }

  @Get("jobs/run/:runId")
  async listJobsForRun(
    @Param("runId") runId: string,
    @Query("limit") limitRaw?: string,
  ) {
    const n = limitRaw != null ? parseInt(String(limitRaw), 10) : 50;
    const limit = Number.isFinite(n) && n > 0 ? Math.min(100, n) : 50;
    const items = await this.jobs.listByRunId(runId, limit);
    return { runId, items };
  }

  @Post("requeue-analysis/:runId")
  @HttpCode(HttpStatus.OK)
  async requeueAnalysis(
    @Param("runId") runId: string,
    @Body() body?: { force?: boolean; skipChildAutomation?: boolean },
  ) {
    return this.pipeline.enqueueAnalysis(runId, {
      force: Boolean(body?.force),
      triggerSource: "manual",
      skipChildAutomation: Boolean(body?.skipChildAutomation),
    });
  }

  @Post("requeue-automation")
  @HttpCode(HttpStatus.OK)
  async requeueAutomation(
    @Body()
    body: {
      runId?: string | null;
      evaluateRegression?: boolean;
      generateDigest?: boolean;
      generateTriage?: boolean;
    },
  ) {
    return this.pipeline.enqueueAutomation({
      runId: body.runId ?? null,
      reason: "manual",
      evaluateRegression: Boolean(body.evaluateRegression),
      generateDigest: Boolean(body.generateDigest),
      generateTriage: Boolean(body.generateTriage),
      triggerSource: "manual",
    });
  }

  @Post("retry/:pipelineJobId")
  @HttpCode(HttpStatus.OK)
  async retry(@Param("pipelineJobId") pipelineJobId: string) {
    return this.pipeline.retryPipelineJob(pipelineJobId);
  }
}
