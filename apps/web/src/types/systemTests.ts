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

/** Phase 3 — flaky ranking (client-derived). */
export type SystemTestsFlakyCaseRow = {
  caseKey: string;
  title: string;
  file: string;
  totalObservations: number;
  passCount: number;
  failCount: number;
  skipCount: number;
  transitionCount: number;
  flakyScore: number;
  lastStatuses: string[];
  latestStatus: string;
  previousStatus: string | null;
  isCurrentlyFailing: boolean;
};

export type SystemTestsFailurePatternSeverity = "low" | "medium" | "high";

export type SystemTestsPatternCategory =
  | "auth"
  | "navigation"
  | "api"
  | "assertion"
  | "rendering"
  | "data/seed"
  | "unknown";

export type SystemTestsFailurePattern = {
  patternKey: string;
  label: string;
  patternCategory: SystemTestsPatternCategory;
  count: number;
  latestRunCount: number;
  affectedCases: string[];
  affectedFiles: string[];
  signature: string;
  examples: string[];
  severity: SystemTestsFailurePatternSeverity;
};

export type SystemTestsHistoricalCaseRef = {
  caseKey: string;
  title: string;
  filePath: string;
  detail?: string;
};

export type SystemTestsDurationRegression = {
  caseKey: string;
  title: string;
  filePath: string;
  previousDurationMs: number | null;
  latestDurationMs: number | null;
  deltaMs: number;
};

export type SystemTestsHistoricalChanges = {
  newRegressions: SystemTestsHistoricalCaseRef[];
  resolvedFailures: SystemTestsHistoricalCaseRef[];
  persistentFailures: SystemTestsHistoricalCaseRef[];
  newPasses: SystemTestsHistoricalCaseRef[];
  addedCases: SystemTestsHistoricalCaseRef[];
  removedCases: SystemTestsHistoricalCaseRef[];
  slowestRegressions: SystemTestsDurationRegression[];
  biggestDurationDeltas: SystemTestsDurationRegression[];
};

export type SystemTestsAlertLevel = "info" | "warning" | "critical";

export type SystemTestsAlert = {
  id: string;
  level: SystemTestsAlertLevel;
  title: string;
  message: string;
  /** One-line operator conclusion. */
  operatorSummary: string;
  /** Short actionable directive. */
  recommendedAction: string;
  /** Base priority tier: critical 100, warning 50, info 10. */
  weight: number;
  /** Extra sort signal within tier (counts, deltas). */
  impactScore: number;
};

export type SystemTestsCompareCaseFlakyHint = {
  caseKey: string;
  historicallyFlaky: boolean;
  flakyScore: number | null;
  transitionCount: number | null;
};

export type SystemTestsCompareIntelligence = {
  newRegressions: SystemTestsHistoricalCaseRef[];
  resolvedFailures: SystemTestsHistoricalCaseRef[];
  persistentFailures: SystemTestsHistoricalCaseRef[];
  newPasses: SystemTestsHistoricalCaseRef[];
  addedCases: SystemTestsHistoricalCaseRef[];
  removedCases: SystemTestsHistoricalCaseRef[];
  slowestRegressions: SystemTestsDurationRegression[];
  biggestDurationDeltas: SystemTestsDurationRegression[];
  flakyHintsForChangedFailures: SystemTestsCompareCaseFlakyHint[];
};

export type SystemTestsTopProblemType = "regression" | "pattern" | "flaky" | "duration";

export type SystemTestsTopProblemSeverity = "high" | "medium" | "low";

export type SystemTestsTopProblemItem = {
  title: string;
  type: SystemTestsTopProblemType;
  severity: SystemTestsTopProblemSeverity;
  impactScore: number;
  summary: string;
};

/** AI / support — enriched single-run export (concise). Field order matters for operators / LLMs. */
export type SystemTestsEnrichedDiagnosticExport = {
  version: 1;
  generatedAt: string;
  run: SystemTestSupportPayload["run"];
  summary: SystemTestSupportPayload["summary"];
  alerts: SystemTestsAlert[];
  topProblems: SystemTestsTopProblemItem[];
  newRegressions: SystemTestsHistoricalCaseRef[];
  persistentFailures: SystemTestsHistoricalCaseRef[];
  flakyCases: Pick<
    SystemTestsFlakyCaseRow,
    "caseKey" | "title" | "latestStatus" | "flakyScore" | "isCurrentlyFailing"
  >[];
  patterns: Pick<
    SystemTestsFailurePattern,
    "label" | "patternCategory" | "count" | "severity" | "examples" | "affectedFiles"
  >[];
  slowCases: { title: string; filePath: string; durationMs: number | null }[];
  failingCasesPreview: { title: string; filePath: string; errorMessage: string | null }[];
  diagnosticReportExcerpt: string;
  notes: string[];
  /** Suggested compare URLs when multiple runs are available. */
  compareHints?: string[];
};

/** AI / support — enriched compare export. */
export type SystemTestsEnrichedCompareExport = {
  version: 1;
  generatedAt: string;
  topProblems: SystemTestsTopProblemItem[];
  compare: SystemTestsComparePayload;
  intelligence: SystemTestsCompareIntelligence;
  notes: string[];
};
