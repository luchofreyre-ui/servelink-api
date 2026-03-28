export type IntelCase = {
  filePath: string;
  suite: string;
  title: string;
  fullName: string;
  status: string;
  errorMessage: string | null;
  errorStack: string | null;
  /** Optional explicit fingerprint override (e.g. client-provided). */
  fingerprint?: string | null;
};

export type FailureGroup = {
  key: string;
  file: string;
  title: string;
  shortMessage: string;
  occurrences: number;
  testTitles: string[];
};

export type IntelRunSnapshot = {
  id: string;
  createdAt: string;
  status: string;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  durationMs: number | null;
  branch: string | null;
  commitSha: string | null;
};

export type ComparisonResult = {
  newGroups: FailureGroup[];
  resolvedGroups: FailureGroup[];
  persistentGroups: FailureGroup[];
  headline: string;
  failedDelta: number;
  passRateDelta: number;
};

export type ChronologyDiagnosticsV1 = {
  version: "v1";
  runCreatedAtIso: string;
  runUpdatedAtIso: string;
  caseOrderingBasis: string;
  parsedCaseTimestamps: Array<{
    caseId: string;
    iso: string | null;
    sourceField: string | null;
  }>;
  duplicateTimestampGroups: Array<{ iso: string; caseIds: string[] }>;
  warnings: string[];
};

/** Minimal case shape for hashing, chronology, evidence (no Prisma types). */
export type SystemTestCaseRowInput = {
  id: string;
  status: string;
  retryCount: number;
  filePath: string;
  title: string;
  fullName: string;
  suite: string;
  errorMessage: string | null;
  errorStack: string | null;
  durationMs: number | null;
  line: number | null;
  column: number | null;
  route: string | null;
  selector: string | null;
  artifactJson: unknown;
  rawCaseJson: unknown;
};

export type SystemTestRunRowInput = {
  id: string;
  updatedAt: string;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  flakyCount: number;
  status: string;
  durationMs: number | null;
  createdAt: string;
};

export type GroupEvidenceSummary = {
  routes: string[];
  selectors: string[];
  artifactPaths: string[];
  sampleLines: string[];
};

export type SystemTestArtifactRefType =
  | "trace"
  | "screenshot"
  | "video"
  | "stdout_log"
  | "stderr_log"
  | "attachment"
  | "html_report_ref";

/** Canonical artifact reference (persisted per failure group). */
export type SystemTestArtifactRef = {
  type: SystemTestArtifactRefType;
  path: string;
  displayName: string;
  mimeType: string | null;
  sourceCaseId: string | null;
  isPrimary: boolean;
  sizeBytes: number | null;
};

/** Structured debugging context extracted from messages / metadata. */
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

export type SpecSummaryRow = {
  file: string;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  passRate: number;
  sortOrder: number;
};
