import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { SystemTestsPipelineService } from "../system-tests-pipeline/system-tests-pipeline.service";
import { SystemTestsAutomationService } from "./system-tests-automation.service";

@Controller("/api/v1/admin/system-tests/automation")
@UseGuards(JwtAuthGuard, AdminGuard)
export class SystemTestsAutomationController {
  constructor(
    private readonly automation: SystemTestsAutomationService,
    private readonly pipeline: SystemTestsPipelineService,
  ) {}

  @Get("status")
  async status() {
    return this.automation.getStatus();
  }

  @Get("jobs")
  async jobs(@Query("limit") limitRaw?: string) {
    const n = limitRaw != null ? parseInt(String(limitRaw), 10) : 50;
    const limit = Number.isFinite(n) && n > 0 ? Math.min(200, n) : 50;
    return { items: await this.automation.listJobs(limit) };
  }

  @Get("jobs/:jobId")
  async job(@Param("jobId") jobId: string) {
    const job = await this.automation.getJobDetail(jobId);
    if (!job) throw new NotFoundException("JOB_NOT_FOUND");
    return { job };
  }

  @Post("run-digest")
  @HttpCode(HttpStatus.OK)
  async runDigest() {
    return this.pipeline.enqueueManualDigest();
  }

  @Post("evaluate-alert")
  @HttpCode(HttpStatus.OK)
  async evaluateAlert() {
    return this.pipeline.enqueueAutomation({
      runId: null,
      reason: "manual",
      evaluateRegression: true,
      generateDigest: false,
      generateTriage: false,
      triggerSource: "manual",
    });
  }

  @Post("generate-triage")
  @HttpCode(HttpStatus.OK)
  async generateTriage() {
    return this.pipeline.enqueueAutomation({
      runId: null,
      reason: "manual",
      evaluateRegression: false,
      generateDigest: false,
      generateTriage: true,
      triggerSource: "manual",
    });
  }

  @Post("send-job/:jobId")
  @HttpCode(HttpStatus.OK)
  async sendJob(@Param("jobId") jobId: string) {
    return this.automation.sendJob(jobId);
  }
}
