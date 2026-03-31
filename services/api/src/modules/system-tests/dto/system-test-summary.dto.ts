export type SystemTestSuiteBreakdownDto = {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
};

import type { SystemTestFixOpportunityDto } from "../system-test-resolution-preview";

export type SystemTestLatestFailureDto = {
  runId: string;
  suite: string;
  filePath: string;
  title: string;
  fullName: string;
  status: string;
  errorMessage: string | null;
  retryCount: number;
};

export type SystemTestSummaryResponseDto = {
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
  suiteBreakdown: SystemTestSuiteBreakdownDto[];
  latestFailures: SystemTestLatestFailureDto[];
  fixOpportunities: SystemTestFixOpportunityDto[];
};
