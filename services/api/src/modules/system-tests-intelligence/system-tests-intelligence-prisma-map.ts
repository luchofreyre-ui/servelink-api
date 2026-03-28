import type { SystemTestCaseResult, SystemTestRun } from "@prisma/client";
import type {
  DiagnosticReportRunInput,
  SystemTestCaseRowInput,
  SystemTestRunRowInput,
} from "@servelink/system-test-intelligence";

export function mapPrismaRunToRowInput(run: SystemTestRun): SystemTestRunRowInput {
  return {
    id: run.id,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
    totalCount: run.totalCount,
    passedCount: run.passedCount,
    failedCount: run.failedCount,
    skippedCount: run.skippedCount,
    flakyCount: run.flakyCount,
    status: run.status,
    durationMs: run.durationMs,
  };
}

export function mapPrismaCaseToRowInput(c: SystemTestCaseResult): SystemTestCaseRowInput {
  return {
    id: c.id,
    status: c.status,
    retryCount: c.retryCount,
    filePath: c.filePath,
    title: c.title,
    fullName: c.fullName,
    suite: c.suite,
    errorMessage: c.errorMessage,
    errorStack: c.errorStack,
    durationMs: c.durationMs,
    line: c.line,
    column: c.column,
    route: c.route,
    selector: c.selector,
    artifactJson: c.artifactJson,
    rawCaseJson: c.rawCaseJson,
  };
}

export function mapPrismaRunToDiagnosticInput(
  run: SystemTestRun,
): DiagnosticReportRunInput {
  return {
    ...mapPrismaRunToRowInput(run),
    source: run.source,
    branch: run.branch,
    commitSha: run.commitSha,
  };
}
