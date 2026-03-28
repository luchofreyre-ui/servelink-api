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

/** Normalized run summary for admin system test dashboard (Phase 1). */
export type SystemTestRunSummary = {
  id: string;
  status: "passed" | "failed" | "partial" | "running" | "unknown";
  createdAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  branch: string | null;
  commitSha: string | null;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  passRate: number;
};

/** Deterministic, compact evidence extracted from raw failure text (Phase 4). */
export type SystemTestFailureEvidenceSummary = {
  messageLine: string | null;
  assertionLine: string | null;
  locationLine: string | null;
  diagnosticLines: string[];
};

export type SystemTestArtifactRefType =
  | "trace"
  | "screenshot"
  | "video"
  | "stdout_log"
  | "stderr_log"
  | "attachment"
  | "html_report_ref";

/** Mirrors API persisted artifact ref (Phase 7B). */
export type SystemTestArtifactRef = {
  type: SystemTestArtifactRefType;
  path: string;
  displayName: string;
  mimeType: string | null;
  sourceCaseId: string | null;
  isPrimary: boolean;
  sizeBytes: number | null;
};

/** Phase 8 — cross-run root-cause family (from API persisted intelligence). */
export type SystemTestFailureFamilySummary = {
  familyId: string;
  displayTitle: string;
  rootCauseSummary: string;
  matchBasis: string;
  status: string;
  trendKind: string;
  seenInWindowLabel: string;
  recurrenceLine: string;
};

/** Phase 9 — operator incident linked to a failure family. */
export type SystemTestIncidentSummary = {
  incidentKey: string;
  displayTitle: string;
  severity: string;
  status: string;
  trendKind: string;
  rootCauseCategory: string;
  leadFamilyId: string | null;
  fixTrackPrimaryArea: string;
  fixTrackFirstStep: string;
};

/** Structured evidence from canonical ingestion (Phase 7B). */
export type SystemTestRichEvidence = {
  assertionType: string | null;
  expectedText: string | null;
  receivedText: string | null;
  timeoutMs: number | null;
  locator: string | null;
  selector: string | null;
  routeUrl: string | null;
  actionName: string | null;
  stepName: string | null;
  testStepPath: string[];
  errorCode: string | null;
  primaryArtifactPath: string | null;
  primaryArtifactType: SystemTestArtifactRefType | null;
};

export type SystemTestFailureGroup = {
  key: string;
  fingerprint: string;
  file: string;
  projectName: string | null;
  title: string;
  shortMessage: string;
  fullMessage: string | null;
  finalStatus: string | null;
  occurrences: number;
  testTitles: string[];
  evidenceLines: string[];
  evidenceSummary: SystemTestFailureEvidenceSummary;
  /** First extra lines from raw message (not full stack); compact preview. */
  diagnosticPreview: string | null;
  /** Populated when persisted intelligence is completed (Phase 7B). */
  richEvidence?: SystemTestRichEvidence | null;
  artifactRefs?: SystemTestArtifactRef[];
  debuggingHint?: string | null;
  family?: SystemTestFailureFamilySummary | null;
  incident?: SystemTestIncidentSummary | null;
};

export type SystemTestSpecBreakdownRow = {
  file: string;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  passRate: number;
};

export type SystemTestTrendPoint = {
  runId: string;
  createdAt: string;
  durationMs: number | null;
  failedCount: number;
  passRate: number;
  status: SystemTestRunSummary["status"];
};

export type SystemTestRunDetail = {
  summary: SystemTestRunSummary;
  specs: SystemTestSpecBreakdownRow[];
  failureGroups: SystemTestFailureGroup[];
};

export type SystemTestComparisonHeadline =
  | "Regression detected"
  | "Improvement detected"
  | "Mixed change"
  | "No material change";

/** Phase 2 — failure group row for compare (new / resolved / persistent). */
export type SystemTestFailureGroupComparison = {
  key: string;
  file: string;
  projectName: string | null;
  title: string;
  shortMessage: string;
  baseOccurrences: number;
  targetOccurrences: number;
  deltaOccurrences: number;
  status: "new" | "resolved" | "persistent";
  testTitles: string[];
  /** Present when status === "new". */
  novelty?: "new" | "expanded";
  /** Present when status === "persistent". */
  changeVersusBase?: "worse" | "better" | "same";
  baseShortMessage?: string | null;
  targetShortMessage?: string | null;
  evidenceSummary?: SystemTestFailureEvidenceSummary | null;
  richEvidence?: SystemTestRichEvidence | null;
  artifactRefs?: SystemTestArtifactRef[];
  debuggingHint?: string | null;
  family?: SystemTestFailureFamilySummary | null;
  incident?: SystemTestIncidentSummary | null;
};

export type SystemTestFileHealthComparisonRow = {
  file: string;
  baseTotalCount: number;
  baseFailedCount: number;
  basePassRate: number;
  targetTotalCount: number;
  targetFailedCount: number;
  targetPassRate: number;
  failedDelta: number;
  passRateDelta: number;
  trend: "regressed" | "improved" | "unchanged";
};

export type SystemTestRunComparison = {
  baseRun: SystemTestRunDetail;
  targetRun: SystemTestRunDetail;
  passRateDelta: number;
  failedDelta: number;
  durationDeltaMs: number | null;
  newFailures: SystemTestFailureGroupComparison[];
  resolvedFailures: SystemTestFailureGroupComparison[];
  persistentFailures: SystemTestFailureGroupComparison[];
  fileHealthChanges: SystemTestFileHealthComparisonRow[];
  operatorInsights: string[];
  headline: SystemTestComparisonHeadline;
  /**
   * True when runs were swapped so base = chronologically older and target = newer
   * (selection had base newer than target by parsed timestamps).
   */
  chronologyCorrected?: boolean;
  /** Human-readable chronology / ordering note for operators. */
  chronologyNote?: string | null;
  /**
   * @deprecated Prefer chronologyNote. True when comparison order may not match wall-clock intent
   * and runs were not auto-corrected (e.g. missing timestamps).
   */
  chronologyWarning?: boolean;
};

/** Phase 3 — per-failure-group history + triage scoring (prior window excludes current run). */
export type SystemTestFailureHistoryProfile = {
  key: string;
  seenInPriorRuns: number;
  historyWindowSize: number;
  lastSeenRunId: string | null;
  consecutiveStreak: number;
  intermittentCount: number;
  firstSeenInLoadedWindow: boolean;
  likelyFlaky: boolean;
  likelyRecurring: boolean;
  rerunPriorityScore: number;
  rerunPriorityBand: "high" | "medium" | "low";
  rerunPriorityReasons: string[];
};

export type SystemTestFileHistoryProfile = {
  file: string;
  failedInPriorRuns: number;
  historyWindowSize: number;
  averageFailedCount: number;
  worstFailedCount: number;
  instabilityScore: number;
  trend: "improving" | "worsening" | "noisy" | "stable";
};

export type SystemTestHistoricalAnalysis = {
  runId: string;
  historyWindowSize: number;
  failureProfiles: Record<string, SystemTestFailureHistoryProfile>;
  unstableFiles: SystemTestFileHistoryProfile[];
  historicalInsights: string[];
  /** Non-null when prior window ordering relied on fallbacks or ties. */
  historyChronologyNote?: string | null;
};

/** Per-run ordering metadata when sorting by time (Phase 4). */
export type SystemTestRunOrderingDiagnostics = {
  sortCreatedAt: string | null;
  usedFallback: boolean;
  chronologyWarning: string | null;
};

/**
 * Normalized inputs for clipboard / future scheduled digests (Phase 4).
 * Assembled in lib; pages should not stitch these fields ad hoc.
 */
export type SystemTestReportPayload = {
  run: SystemTestRunDetail;
  previousRun: SystemTestRunSummary | null;
  trendVsPrevious: SystemTestRunTrendVsPrevious;
  comparison: SystemTestRunComparison | null;
  historicalAnalysis: SystemTestHistoricalAnalysis | null;
};

export type SystemTestRunTrendVsPrevious = {
  previousRunId: string | null;
  passRateDelta: number | null;
  failedDelta: number | null;
  durationDeltaMs: number | null;
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

export type SystemTestsSummaryResponse = {
  latestRun: SystemTestRunsListItem | null;
  latestPassRate: number | null;
  latestFailedCount: number | null;
  latestRunAt: string | null;
  suiteBreakdown: SystemTestSuiteBreakdownRow[];
  latestFailures: SystemTestLatestFailure[];
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

/** Raw API shape for persisted run intelligence (aligns with admin run detail DTO). */
export type SystemTestPersistedIntelligenceResponse = {
  summary: {
    ingestionVersion: string;
    lastAnalyzedAt: string;
    analysisStatus: string;
    analysisError: string | null;
    passRate: number;
    totalCount: number;
    passedCount: number;
    failedCount: number;
    skippedCount: number;
    flakyCount: number;
    durationMs: number | null;
    isStaleVersusCode: boolean;
  };
  ingestionWarnings: string[];
  chronology: {
    version: "v1";
    runCreatedAtIso: string;
    runUpdatedAtIso: string;
    caseOrderingBasis: string;
    warnings: string[];
    duplicateTimestampGroupCount: number;
    parsedCaseTimestampCount: number;
  };
  failureGroups: Array<{
    canonicalKey: string;
    canonicalFingerprint: string;
    file: string;
    projectName: string | null;
    title: string;
    shortMessage: string;
    fullMessage: string | null;
    finalStatus: string | null;
    occurrences: number;
    testTitles: string[];
    evidenceSummary: {
      routes: string[];
      selectors: string[];
      artifactPaths: string[];
      sampleLines: string[];
    };
    diagnosticPreview: { text: string } | null;
    richEvidence: SystemTestRichEvidence | null;
    artifactRefs: SystemTestArtifactRef[];
    debuggingHint: string | null;
    sortOrder: number;
    family?: SystemTestFailureFamilySummary | null;
    incident?: SystemTestIncidentSummary | null;
  }>;
  specSummaries: Array<SystemTestSpecBreakdownRow & { sortOrder: number }>;
};

export type SystemTestRunDetailResponse = {
  run: SystemTestRunDetailMeta;
  suiteBreakdown: SystemTestSuiteBreakdownRow[];
  diagnosticReport: string;
  cases: SystemTestCaseResult[];
  /** Present when canonical ingestion has run for this row. */
  persistedIntelligence?: SystemTestPersistedIntelligenceResponse | null;
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
