import type { ChronologyDiagnosticsV1 } from "@servelink/system-test-intelligence";

export type { ChronologyDiagnosticsV1 };

export type SystemTestIntelligenceIngestOutcome =
  | "created"
  | "updated"
  | "skipped"
  | "failed";

export type PersistedFailureGroupRead = {
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
  evidenceSummary: unknown;
  diagnosticPreview: unknown;
  richEvidenceJson: unknown;
  artifactRefsJson: unknown;
  sortOrder: number;
};

export type PersistedSpecSummaryRead = {
  file: string;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  passRate: number;
  sortOrder: number;
};

export type PersistedRunIntelligenceRead = {
  ingestionVersion: string;
  sourceContentHash: string;
  canonicalRunAt: string;
  lastAnalyzedAt: string;
  analysisStatus: string;
  analysisError: string | null;
  status: string;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  flakyCount: number;
  passRate: number;
  durationMs: number | null;
  branch: string | null;
  commitSha: string | null;
  chronology: ChronologyDiagnosticsV1;
  ingestionWarnings: string[];
  failureGroups: PersistedFailureGroupRead[];
  specSummaries: PersistedSpecSummaryRead[];
};
