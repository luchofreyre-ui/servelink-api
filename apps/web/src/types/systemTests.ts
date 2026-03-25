export type SystemTestSuiteBreakdown = {
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

export type SystemTestSummaryResponse = {
  latestRun: {
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
  } | null;
  latestPassRate: number | null;
  latestFailedCount: number | null;
  latestRunAt: string | null;
  suiteBreakdown: SystemTestSuiteBreakdown[];
  latestFailures: SystemTestLatestFailure[];
};

export type SystemTestRunListItem = {
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

export type SystemTestRunsListResponse = {
  items: SystemTestRunListItem[];
  total: number;
  page: number;
  limit: number;
};

export type SystemTestCaseRow = {
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

export type SystemTestRunDetailResponse = {
  run: {
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
  suiteBreakdown: SystemTestSuiteBreakdown[];
  diagnosticReport: string;
  cases: SystemTestCaseRow[];
};
