/** Aligns with GET /api/v1/admin/system-tests/summary and related DTOs. */

export type SystemTestRunStatus =
  | "passed"
  | "failed"
  | "partial"
  | string;

export type SystemTestSuiteBreakdownRow = {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
};

export type SystemTestLatestFailure = {
  runId: string;
  suite: string;
  filePath: string;
  title: string;
  fullName: string;
  status: string;
  errorMessage: string | null;
  retryCount: number;
};

/** Latest run snapshot + aggregates (summary endpoint). */
export type SystemTestRunSummary = {
  id: string;
  createdAt: string;
  source: string;
  branch: string | null;
  commitSha: string | null;
  status: string;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  flakyCount: number;
  durationMs: number | null;
};

export type SystemTestsSummaryResponse = {
  latestRun: SystemTestRunSummary | null;
  latestPassRate: number | null;
  latestFailedCount: number | null;
  latestRunAt: string | null;
  suiteBreakdown: SystemTestSuiteBreakdownRow[];
  latestFailures: SystemTestLatestFailure[];
};

export type SystemTestRunsListItem = {
  id: string;
  createdAt: string;
  source: string;
  branch: string | null;
  commitSha: string | null;
  status: string;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  flakyCount: number;
  durationMs: number | null;
};

export type SystemTestsRunsResponse = {
  items: SystemTestRunsListItem[];
  total: number;
  page: number;
  limit: number;
};

export type SystemTestCaseResult = {
  id: string;
  suite: string;
  filePath: string;
  title: string;
  fullName: string;
  status: string;
  retryCount: number;
  durationMs: number | null;
  route: string | null;
  selector: string | null;
  errorMessage: string | null;
  errorStack: string | null;
  line: number | null;
  column: number | null;
};

export type SystemTestRunDetailMeta = {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: string;
  branch: string | null;
  commitSha: string | null;
  status: string;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  flakyCount: number;
  durationMs: number | null;
  ingestVersion: number;
};

export type SystemTestRunDetailResponse = {
  run: SystemTestRunDetailMeta;
  suiteBreakdown: SystemTestSuiteBreakdownRow[];
  diagnosticReport: string;
  cases: SystemTestCaseResult[];
};

/** Compact JSON for ChatGPT / support (client-built). */
export type SystemTestSupportPayload = {
  run: {
    id: string;
    createdAt: string;
    source: string;
    branch: string | null;
    commitSha: string | null;
    status: string;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    flaky: number;
  };
  suiteBreakdown: SystemTestSuiteBreakdownRow[];
  failingCases: SystemTestCaseResult[];
  diagnosticReport: string;
};

/** @deprecated Use SystemTestsSummaryResponse */
export type SystemTestSummaryResponse = SystemTestsSummaryResponse;

/** @deprecated Use SystemTestsRunsResponse */
export type SystemTestRunsListResponse = SystemTestsRunsResponse;

/** @deprecated Use SystemTestSuiteBreakdownRow */
export type SystemTestSuiteBreakdown = SystemTestSuiteBreakdownRow;

/** @deprecated Use SystemTestCaseResult */
export type SystemTestCaseRow = SystemTestCaseResult;

/** Trend line (client-built from runs list). */
export type SystemTestsTrendPoint = {
  runId: string;
  createdAt: string;
  status: string;
  source: string;
  branch: string | null;
  commitSha: string | null;
  durationMs: number | null;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  flakyCount: number;
  passRate: number;
};

export type SystemTestsTrendInsights = {
  latestStatus: string;
  latestPassRate: number;
  previousPassRate: number | null;
  passRateDelta: number | null;
  failedDelta: number | null;
  flakyDelta: number | null;
  durationDeltaMs: number | null;
  streakLabel: string;
};

export type SystemTestsRunCompareSelection = {
  baseRunId: string;
  targetRunId: string;
};

export type SystemTestsRunDelta = {
  totalDelta: number;
  passedDelta: number;
  failedDelta: number;
  skippedDelta: number;
  flakyDelta: number;
  durationDeltaMs: number | null;
  passRateDelta: number | null;
};

export type SystemTestsCompareCaseGroup = {
  key: string;
  title: string;
  baseCase?: SystemTestCaseResult;
  targetCase?: SystemTestCaseResult;
};

export type SystemTestsCompareResult = {
  baseRun: SystemTestRunDetailResponse["run"];
  targetRun: SystemTestRunDetailResponse["run"];
  delta: SystemTestsRunDelta;
  newFailures: SystemTestsCompareCaseGroup[];
  resolvedFailures: SystemTestsCompareCaseGroup[];
  stillFailing: SystemTestsCompareCaseGroup[];
  newFlaky: SystemTestsCompareCaseGroup[];
  resolvedFlaky: SystemTestsCompareCaseGroup[];
};

export type SystemTestsComparePayload = {
  baseRunId: string;
  targetRunId: string;
  base: SystemTestRunDetailResponse["run"];
  target: SystemTestRunDetailResponse["run"];
  delta: SystemTestsRunDelta;
  newFailures: SystemTestsCompareCaseGroup[];
  resolvedFailures: SystemTestsCompareCaseGroup[];
  stillFailing: SystemTestsCompareCaseGroup[];
  newFlaky: SystemTestsCompareCaseGroup[];
  resolvedFlaky: SystemTestsCompareCaseGroup[];
};
