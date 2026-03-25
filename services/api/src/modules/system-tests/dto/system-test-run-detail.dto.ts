export type SystemTestCaseRowDto = {
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

export type SystemTestRunDetailSuiteCountsDto = {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
};

export type SystemTestRunDetailResponseDto = {
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
  suiteBreakdown: SystemTestRunDetailSuiteCountsDto[];
  diagnosticReport: string;
  cases: SystemTestCaseRowDto[];
};
