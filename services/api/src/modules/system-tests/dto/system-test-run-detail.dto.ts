import type { SystemTestIncidentSummaryDto } from "../../system-tests-incidents/dto/system-test-incidents.dto";

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

/** Persisted group evidence (admin UI / exports). */
export type SystemTestGroupEvidenceSummaryDto = {
  routes: string[];
  selectors: string[];
  artifactPaths: string[];
  sampleLines: string[];
};

export type SystemTestGroupDiagnosticPreviewDto = {
  text: string;
};

export type SystemTestArtifactRefTypeDto =
  | "trace"
  | "screenshot"
  | "video"
  | "stdout_log"
  | "stderr_log"
  | "attachment"
  | "html_report_ref";

export type SystemTestArtifactRefDto = {
  type: SystemTestArtifactRefTypeDto;
  path: string;
  displayName: string;
  mimeType: string | null;
  sourceCaseId: string | null;
  isPrimary: boolean;
  sizeBytes: number | null;
};

export type SystemTestRichEvidenceDto = {
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
  primaryArtifactType: SystemTestArtifactRefTypeDto | null;
};

/** Chronology facts for operators (no per-case dump). */
export type SystemTestChronologyDiagnosticsDto = {
  version: "v1";
  runCreatedAtIso: string;
  runUpdatedAtIso: string;
  caseOrderingBasis: string;
  warnings: string[];
  duplicateTimestampGroupCount: number;
  parsedCaseTimestampCount: number;
};

/** Snapshot at ingestion time (counts align with persisted grouping). */
export type SystemTestPersistedIntelligenceSummaryDto = {
  ingestionVersion: string;
  lastAnalyzedAt: string;
  /** pending | completed | failed */
  analysisStatus: string;
  analysisError: string | null;
  passRate: number;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  flakyCount: number;
  durationMs: number | null;
  /** True when persisted ingestionVersion is behind deployed SYSTEM_TEST_INTELLIGENCE_VERSION. */
  isStaleVersusCode: boolean;
};

/** Phase 8 — cross-run failure family summary for a persisted group. */
export type SystemTestFailureFamilySummaryDto = {
  familyId: string;
  displayTitle: string;
  rootCauseSummary: string;
  matchBasis: string;
  status: string;
  trendKind: string;
  seenInWindowLabel: string;
  recurrenceLine: string;
};

export type SystemTestPersistedFailureGroupDto = {
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
  evidenceSummary: SystemTestGroupEvidenceSummaryDto;
  diagnosticPreview: SystemTestGroupDiagnosticPreviewDto | null;
  /** Structured evidence (Phase 7B). */
  richEvidence: SystemTestRichEvidenceDto | null;
  artifactRefs: SystemTestArtifactRefDto[];
  /** Single-line operator hint derived from rich evidence + primary artifact. */
  debuggingHint: string | null;
  sortOrder: number;
  /** Present when this group is assigned to a root-cause family (Phase 8). */
  family: SystemTestFailureFamilySummaryDto | null;
  /** Operator incident cluster when the group's family is a member (Phase 9). */
  incident: SystemTestIncidentSummaryDto | null;
};

export type SystemTestPersistedSpecSummaryDto = {
  file: string;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  passRate: number;
  sortOrder: number;
};

/** Canonical persisted intelligence for admin API (no internal hash / raw JSON clutter). */
export type SystemTestPersistedIntelligenceDto = {
  summary: SystemTestPersistedIntelligenceSummaryDto;
  ingestionWarnings: string[];
  chronology: SystemTestChronologyDiagnosticsDto;
  failureGroups: SystemTestPersistedFailureGroupDto[];
  specSummaries: SystemTestPersistedSpecSummaryDto[];
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
  /** Canonical persisted intelligence when ingested (Phase 5B). */
  persistedIntelligence: SystemTestPersistedIntelligenceDto | null;
};
