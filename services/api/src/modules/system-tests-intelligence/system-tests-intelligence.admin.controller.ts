import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";

import { SYSTEM_TEST_INTELLIGENCE_VERSION } from "@servelink/system-test-intelligence";

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { PrismaService } from "../../prisma";
import { SystemTestsPipelineService } from "../system-tests-pipeline/system-tests-pipeline.service";
import { reanalyzeStaleIntelligenceRows } from "./system-tests-intelligence.reanalyze";

@Controller("/api/v1/admin/system-tests/intelligence")
@UseGuards(JwtAuthGuard, AdminGuard)
export class SystemTestsIntelligenceAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: SystemTestsPipelineService,
  ) {}

  @Post("reanalyze/:runId")
  @HttpCode(HttpStatus.OK)
  async reanalyzeRun(@Param("runId") runId: string) {
    const result = await this.pipeline.enqueueAnalysis(runId, {
      force: true,
      triggerSource: "manual",
    });
    return { runId, ...result };
  }

  @Post("reanalyze-stale")
  @HttpCode(HttpStatus.OK)
  async reanalyzeStale() {
    const summary = await reanalyzeStaleIntelligenceRows(
      this.prisma,
      this.pipeline,
      500,
    );
    return { summary };
  }

  @Get("status/:runId")
  async status(@Param("runId") runId: string) {
    const row = await this.prisma.systemTestRunIntelligence.findUnique({
      where: { runId },
    });

    if (!row) {
      return {
        runId,
        hasIntelligence: false,
        isStaleVersusCode: true,
        analysisStatus: null,
        ingestionVersion: null,
        lastAnalyzedAt: null,
        analysisError: null,
      };
    }

    const isStaleVersusCode =
      row.ingestionVersion !== SYSTEM_TEST_INTELLIGENCE_VERSION;

    return {
      runId,
      hasIntelligence: true,
      isStaleVersusCode,
      analysisStatus: row.analysisStatus,
      ingestionVersion: row.ingestionVersion,
      lastAnalyzedAt: row.lastAnalyzedAt.toISOString(),
      analysisError: row.analysisError,
      sourceContentHash: row.sourceContentHash,
    };
  }
}
