import { buildDiagnosticReportPlainText } from "@servelink/system-test-intelligence";
import { forwardRef, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma";
import {
  mapPrismaCaseToRowInput,
  mapPrismaRunToDiagnosticInput,
} from "../system-tests-intelligence/system-tests-intelligence-prisma-map";
import { SystemTestsFamiliesReadService } from "../system-tests-families/system-tests-families-read.service";
import { SystemTestsIncidentsReadService } from "../system-tests-incidents/system-tests-incidents-read.service";
import { SystemTestsIntelligenceService } from "../system-tests-intelligence/system-tests-intelligence.service";
import { SystemTestsPipelineService } from "../system-tests-pipeline/system-tests-pipeline.service";
import type { SystemTestReportIngestDto } from "./dto/system-test-report.dto";
import type {
  SystemTestLatestFailureDto,
  SystemTestSummaryResponseDto,
  SystemTestSuiteBreakdownDto,
} from "./dto/system-test-summary.dto";
import type {
  SystemTestCaseRowDto,
  SystemTestRunDetailResponseDto,
  SystemTestRunDetailSuiteCountsDto,
} from "./dto/system-test-run-detail.dto";
import { classifySystemTestSuite } from "./utils/classify-system-test-suite";

function isFailedStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "failed" || s === "timedout" || s === "interrupted";
}

function emptySuiteBreakdown(): SystemTestSuiteBreakdownDto[] {
  return [];
}

function accumulateSuite(
  map: Map<string, { total: number; passed: number; failed: number; skipped: number; flaky: number }>,
  suite: string,
  status: string,
  retryCount: number,
) {
  const key = suite || "unknown";
  if (!map.has(key)) {
    map.set(key, { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 });
  }
  const b = map.get(key)!;
  b.total += 1;
  const s = status.toLowerCase();
  if (s === "passed" || s === "flaky") {
    b.passed += 1;
    if (retryCount > 0 || s === "flaky") {
      b.flaky += 1;
    }
  } else if (s === "skipped") {
    b.skipped += 1;
  } else if (isFailedStatus(status)) {
    b.failed += 1;
  } else {
    b.failed += 1;
  }
}

function mapToBreakdown(map: Map<string, { total: number; passed: number; failed: number; skipped: number; flaky: number }>): SystemTestSuiteBreakdownDto[] {
  return [...map.entries()]
    .map(([suite, v]) => ({ suite, ...v }))
    .sort((a, b) => a.suite.localeCompare(b.suite));
}

@Injectable()
export class SystemTestsService {
  private readonly log = new Logger(SystemTestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly intelligence: SystemTestsIntelligenceService,
    @Inject(forwardRef(() => SystemTestsPipelineService))
    private readonly systemTestsPipeline: SystemTestsPipelineService,
    private readonly familiesRead: SystemTestsFamiliesReadService,
    private readonly incidentsRead: SystemTestsIncidentsReadService,
  ) {}

  async ingestReport(dto: SystemTestReportIngestDto) {
    const rawReport = dto.rawReportJson as Prisma.InputJsonValue;
    const summaryJson = dto.summary as unknown as Prisma.InputJsonValue;

    const caseRows = dto.cases.map((c) => {
      const suite =
        c.suite && String(c.suite).trim()
          ? String(c.suite).trim()
          : classifySystemTestSuite(c.filePath);
      return {
        suite,
        filePath: c.filePath,
        title: c.title,
        fullName: c.fullName,
        status: c.status,
        retryCount: c.retryCount ?? 0,
        durationMs: c.durationMs ?? null,
        errorMessage: c.errorMessage ?? null,
        errorStack: c.errorStack ?? null,
        expectedStatus: c.expectedStatus ?? null,
        line: c.line ?? null,
        column: c.column ?? null,
        route: c.route ?? null,
        selector: c.selector ?? null,
        artifactJson:
          c.artifactJson === undefined || c.artifactJson === null
            ? undefined
            : (c.artifactJson as Prisma.InputJsonValue),
        rawCaseJson: c.rawCaseJson as Prisma.InputJsonValue,
      };
    });

    const run = await this.prisma.systemTestRun.create({
      data: {
        source: dto.source,
        branch: dto.branch ?? null,
        commitSha: dto.commitSha ?? null,
        status: dto.status,
        totalCount: dto.summary.totalCount,
        passedCount: dto.summary.passedCount,
        failedCount: dto.summary.failedCount,
        skippedCount: dto.summary.skippedCount,
        flakyCount: dto.summary.flakyCount,
        durationMs: dto.durationMs ?? null,
        rawReportJson: rawReport,
        summaryJson,
        cases: { create: caseRows },
      },
    });

    const queued = await this.systemTestsPipeline.enqueueAnalysis(run.id, {
      triggerSource: "ingestion",
    });
    if (queued.mode === "deduped") {
      this.log.log(
        `Post-ingest analysis job deduped for run ${run.id} (pipelineJobId=${queued.pipelineJobId}).`,
      );
    }

    return {
      run: {
        id: run.id,
        createdAt: run.createdAt.toISOString(),
        source: run.source,
        branch: run.branch,
        commitSha: run.commitSha,
        status: run.status,
        totalCount: run.totalCount,
        passedCount: run.passedCount,
        failedCount: run.failedCount,
        skippedCount: run.skippedCount,
        flakyCount: run.flakyCount,
        durationMs: run.durationMs,
      },
    };
  }

  async getSummary(): Promise<SystemTestSummaryResponseDto> {
    const latest = await this.prisma.systemTestRun.findFirst({
      orderBy: { createdAt: "desc" },
      include: { cases: true },
    });

    if (!latest) {
      return {
        latestRun: null,
        latestPassRate: null,
        latestFailedCount: null,
        latestRunAt: null,
        suiteBreakdown: emptySuiteBreakdown(),
        latestFailures: [],
      };
    }

    const suiteMap = new Map<
      string,
      { total: number; passed: number; failed: number; skipped: number; flaky: number }
    >();
    for (const c of latest.cases) {
      accumulateSuite(suiteMap, c.suite, c.status, c.retryCount);
    }

    const failedCases = latest.cases.filter((c) => isFailedStatus(c.status));
    const latestFailures: SystemTestLatestFailureDto[] = failedCases.slice(0, 20).map((c) => ({
      runId: latest.id,
      suite: c.suite,
      filePath: c.filePath,
      title: c.title,
      fullName: c.fullName,
      status: c.status,
      errorMessage: c.errorMessage,
      retryCount: c.retryCount,
    }));

    const passRate =
      latest.totalCount > 0 ? latest.passedCount / latest.totalCount : null;

    return {
      latestRun: {
        id: latest.id,
        createdAt: latest.createdAt.toISOString(),
        source: latest.source,
        branch: latest.branch,
        commitSha: latest.commitSha,
        status: latest.status,
        totalCount: latest.totalCount,
        passedCount: latest.passedCount,
        failedCount: latest.failedCount,
        skippedCount: latest.skippedCount,
        flakyCount: latest.flakyCount,
        durationMs: latest.durationMs,
      },
      latestPassRate: passRate,
      latestFailedCount: latest.failedCount,
      latestRunAt: latest.createdAt.toISOString(),
      suiteBreakdown: mapToBreakdown(suiteMap),
      latestFailures,
    };
  }

  async listRuns(params: { limit: number; page: number }) {
    const { limit, page } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.systemTestRun.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: {
          id: true,
          createdAt: true,
          source: true,
          branch: true,
          commitSha: true,
          status: true,
          totalCount: true,
          passedCount: true,
          failedCount: true,
          skippedCount: true,
          flakyCount: true,
          durationMs: true,
        },
      }),
      this.prisma.systemTestRun.count(),
    ]);

    return {
      items: items.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  async getRunDetail(id: string): Promise<SystemTestRunDetailResponseDto> {
    const run = await this.prisma.systemTestRun.findUnique({
      where: { id },
      include: { cases: true },
    });

    if (!run) {
      throw new NotFoundException("SYSTEM_TEST_RUN_NOT_FOUND");
    }

    const suiteMap = new Map<
      string,
      { total: number; passed: number; failed: number; skipped: number; flaky: number }
    >();
    for (const c of run.cases) {
      accumulateSuite(suiteMap, c.suite, c.status, c.retryCount);
    }
    const suiteBreakdown: SystemTestRunDetailSuiteCountsDto[] = mapToBreakdown(suiteMap);

    const failed = run.cases.filter((c) => isFailedStatus(c.status));
    const rest = run.cases.filter((c) => !isFailedStatus(c.status));
    const ordered = [...failed, ...rest];

    const cases: SystemTestCaseRowDto[] = ordered.map((c) => ({
      id: c.id,
      suite: c.suite,
      filePath: c.filePath,
      title: c.title,
      fullName: c.fullName,
      status: c.status,
      retryCount: c.retryCount,
      durationMs: c.durationMs,
      route: c.route,
      selector: c.selector,
      errorMessage: c.errorMessage,
      errorStack: c.errorStack,
      line: c.line,
      column: c.column,
    }));

    const diagnosticReport = buildDiagnosticReportPlainText(
      mapPrismaRunToDiagnosticInput(run),
      run.cases.map(mapPrismaCaseToRowInput),
    );

    let persistedIntelligence =
      await this.intelligence.getPersistedIntelligenceApiDto(run.id);
    if (persistedIntelligence) {
      persistedIntelligence = await this.familiesRead.enrichPersistedIntelligence(
        run.id,
        persistedIntelligence,
      );
      persistedIntelligence =
        await this.incidentsRead.enrichPersistedIntelligenceWithIncidents(
          run.id,
          persistedIntelligence,
        );
    }

    return {
      run: {
        id: run.id,
        createdAt: run.createdAt.toISOString(),
        updatedAt: run.updatedAt.toISOString(),
        source: run.source,
        branch: run.branch,
        commitSha: run.commitSha,
        status: run.status,
        totalCount: run.totalCount,
        passedCount: run.passedCount,
        failedCount: run.failedCount,
        skippedCount: run.skippedCount,
        flakyCount: run.flakyCount,
        durationMs: run.durationMs,
        ingestVersion: run.ingestVersion,
      },
      suiteBreakdown,
      diagnosticReport,
      cases,
      persistedIntelligence,
    };
  }

}
