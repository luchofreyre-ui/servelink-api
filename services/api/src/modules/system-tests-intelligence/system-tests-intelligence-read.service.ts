import { Injectable } from "@nestjs/common";
import {
  SYSTEM_TEST_INTELLIGENCE_VERSION,
  type FailureGroup,
  buildCompactDebuggingHint,
  type SystemTestRichEvidence,
} from "@servelink/system-test-intelligence";

import { PrismaService } from "../../prisma";
import type {
  SystemTestArtifactRefDto,
  SystemTestArtifactRefTypeDto,
  SystemTestChronologyDiagnosticsDto,
  SystemTestGroupDiagnosticPreviewDto,
  SystemTestGroupEvidenceSummaryDto,
  SystemTestPersistedFailureGroupDto,
  SystemTestPersistedIntelligenceDto,
  SystemTestPersistedSpecSummaryDto,
  SystemTestRichEvidenceDto,
} from "../system-tests/dto/system-test-run-detail.dto";
import type {
  ChronologyDiagnosticsV1,
  PersistedRunIntelligenceRead,
} from "./system-tests-intelligence.types";

function asChronologyInternal(json: unknown): ChronologyDiagnosticsV1 {
  const o = json as ChronologyDiagnosticsV1;
  if (o && o.version === "v1") return o;
  return {
    version: "v1",
    runCreatedAtIso: "",
    runUpdatedAtIso: "",
    caseOrderingBasis: "unknown",
    parsedCaseTimestamps: [],
    duplicateTimestampGroups: [],
    warnings: ["Invalid or legacy chronologyJson shape"],
  };
}

function asStringArray(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is string => typeof x === "string");
}

function parseEvidenceSummary(json: unknown): SystemTestGroupEvidenceSummaryDto {
  if (json == null || typeof json !== "object" || Array.isArray(json)) {
    return { routes: [], selectors: [], artifactPaths: [], sampleLines: [] };
  }
  const o = json as Record<string, unknown>;
  const routes = Array.isArray(o.routes)
    ? o.routes.filter((x): x is string => typeof x === "string")
    : [];
  const selectors = Array.isArray(o.selectors)
    ? o.selectors.filter((x): x is string => typeof x === "string")
    : [];
  const artifactPaths = Array.isArray(o.artifactPaths)
    ? o.artifactPaths.filter((x): x is string => typeof x === "string")
    : [];
  const sampleLines = Array.isArray(o.sampleLines)
    ? o.sampleLines.filter((x): x is string => typeof x === "string")
    : [];
  return { routes, selectors, artifactPaths, sampleLines };
}

function parseDiagnosticPreview(
  json: unknown,
): SystemTestGroupDiagnosticPreviewDto | null {
  if (json == null || typeof json !== "object" || Array.isArray(json)) {
    return null;
  }
  const text = (json as { text?: unknown }).text;
  return typeof text === "string" && text.trim() ? { text: text.trim() } : null;
}

const ARTIFACT_TYPES = new Set<string>([
  "trace",
  "screenshot",
  "video",
  "stdout_log",
  "stderr_log",
  "attachment",
  "html_report_ref",
]);

function parseArtifactRefsDto(json: unknown): SystemTestArtifactRefDto[] {
  if (!Array.isArray(json)) return [];
  const out: SystemTestArtifactRefDto[] = [];
  for (const item of json) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const type = o.type;
    const path = o.path;
    if (typeof type !== "string" || !ARTIFACT_TYPES.has(type)) continue;
    if (typeof path !== "string" || !path.trim()) continue;
    const displayName =
      typeof o.displayName === "string" && o.displayName.trim()
        ? o.displayName.trim()
        : path.replace(/\\/g, "/").split("/").pop() ?? path;
    out.push({
      type: type as SystemTestArtifactRefTypeDto,
      path: path.trim(),
      displayName,
      mimeType: typeof o.mimeType === "string" ? o.mimeType : null,
      sourceCaseId: typeof o.sourceCaseId === "string" ? o.sourceCaseId : null,
      isPrimary: o.isPrimary === true,
      sizeBytes:
        typeof o.sizeBytes === "number" && Number.isFinite(o.sizeBytes)
          ? o.sizeBytes
          : null,
    });
  }
  return out;
}

function parseRichEvidenceDto(json: unknown): SystemTestRichEvidenceDto | null {
  if (json == null || typeof json !== "object" || Array.isArray(json)) {
    return null;
  }
  const o = json as Record<string, unknown>;
  const strTrim = (k: string): string | null => {
    const v = o[k];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  const testStepPath = Array.isArray(o.testStepPath)
    ? o.testStepPath.filter((x): x is string => typeof x === "string").slice(0, 24)
    : [];
  const timeoutMs =
    typeof o.timeoutMs === "number" && Number.isFinite(o.timeoutMs)
      ? o.timeoutMs
      : null;
  const pat = strTrim("primaryArtifactType");
  const primaryArtifactType =
    pat && ARTIFACT_TYPES.has(pat) ? (pat as SystemTestArtifactRefTypeDto) : null;
  return {
    assertionType: strTrim("assertionType"),
    expectedText: strTrim("expectedText"),
    receivedText: strTrim("receivedText"),
    timeoutMs,
    locator: strTrim("locator"),
    selector: strTrim("selector"),
    routeUrl: strTrim("routeUrl"),
    actionName: strTrim("actionName"),
    stepName: strTrim("stepName"),
    testStepPath,
    errorCode: strTrim("errorCode"),
    primaryArtifactPath: strTrim("primaryArtifactPath"),
    primaryArtifactType,
  };
}

function debuggingHintFromPersisted(
  rich: SystemTestRichEvidenceDto | null,
): string | null {
  if (!rich) return null;
  const hint = buildCompactDebuggingHint(rich as SystemTestRichEvidence);
  return hint.trim() ? hint : null;
}

function toChronologyDto(c: ChronologyDiagnosticsV1): SystemTestChronologyDiagnosticsDto {
  return {
    version: "v1",
    runCreatedAtIso: c.runCreatedAtIso,
    runUpdatedAtIso: c.runUpdatedAtIso,
    caseOrderingBasis: c.caseOrderingBasis,
    warnings: c.warnings,
    duplicateTimestampGroupCount: c.duplicateTimestampGroups.length,
    parsedCaseTimestampCount: c.parsedCaseTimestamps.filter((p) => p.iso != null)
      .length,
  };
}

function mapRowToApiDto(row: {
  ingestionVersion: string;
  lastAnalyzedAt: Date;
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
  chronologyJson: unknown;
  ingestionWarningsJson: unknown;
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
    testTitlesJson: unknown;
    evidenceSummaryJson: unknown;
    diagnosticPreviewJson: unknown;
    richEvidenceJson: unknown;
    artifactRefsJson: unknown;
    sortOrder: number;
  }>;
  specSummaries: Array<{
    file: string;
    totalCount: number;
    passedCount: number;
    failedCount: number;
    skippedCount: number;
    passRate: number;
    sortOrder: number;
  }>;
}): SystemTestPersistedIntelligenceDto {
  const ch = toChronologyDto(asChronologyInternal(row.chronologyJson));

  const failureGroups: SystemTestPersistedFailureGroupDto[] =
    row.failureGroups.map((g) => {
      const richEvidence = parseRichEvidenceDto(g.richEvidenceJson);
      const artifactRefs = parseArtifactRefsDto(g.artifactRefsJson);
      return {
        canonicalKey: g.canonicalKey,
        canonicalFingerprint: g.canonicalFingerprint,
        file: g.file,
        projectName: g.projectName,
        title: g.title,
        shortMessage: g.shortMessage,
        fullMessage: g.fullMessage,
        finalStatus: g.finalStatus,
        occurrences: g.occurrences,
        testTitles: asStringArray(g.testTitlesJson),
        evidenceSummary: parseEvidenceSummary(g.evidenceSummaryJson),
        diagnosticPreview: parseDiagnosticPreview(g.diagnosticPreviewJson),
        richEvidence,
        artifactRefs,
        debuggingHint: debuggingHintFromPersisted(richEvidence),
        sortOrder: g.sortOrder,
        family: null,
        incident: null,
      };
    });

  const specSummaries: SystemTestPersistedSpecSummaryDto[] = row.specSummaries.map(
    (s) => ({
      file: s.file,
      totalCount: s.totalCount,
      passedCount: s.passedCount,
      failedCount: s.failedCount,
      skippedCount: s.skippedCount,
      passRate: s.passRate,
      sortOrder: s.sortOrder,
    }),
  );

  return {
    summary: {
      ingestionVersion: row.ingestionVersion,
      lastAnalyzedAt: row.lastAnalyzedAt.toISOString(),
      analysisStatus: row.analysisStatus,
      analysisError: row.analysisError,
      passRate: row.passRate,
      totalCount: row.totalCount,
      passedCount: row.passedCount,
      failedCount: row.failedCount,
      skippedCount: row.skippedCount,
      flakyCount: row.flakyCount,
      durationMs: row.durationMs,
      isStaleVersusCode: row.ingestionVersion !== SYSTEM_TEST_INTELLIGENCE_VERSION,
    },
    ingestionWarnings: asStringArray(row.ingestionWarningsJson),
    chronology: ch,
    failureGroups,
    specSummaries,
  };
}

@Injectable()
export class SystemTestsIntelligenceReadService {
  constructor(private readonly prisma: PrismaService) {}

  async getPersistedForRun(
    runId: string,
  ): Promise<PersistedRunIntelligenceRead | null> {
    const row = await this.prisma.systemTestRunIntelligence.findUnique({
      where: { runId },
      include: {
        failureGroups: { orderBy: { sortOrder: "asc" } },
        specSummaries: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!row) return null;

    const failureGroups = row.failureGroups.map((g) => ({
      canonicalKey: g.canonicalKey,
      canonicalFingerprint: g.canonicalFingerprint,
      file: g.file,
      projectName: g.projectName,
      title: g.title,
      shortMessage: g.shortMessage,
      fullMessage: g.fullMessage,
      finalStatus: g.finalStatus,
      occurrences: g.occurrences,
      testTitles: asStringArray(g.testTitlesJson),
      evidenceSummary: g.evidenceSummaryJson,
      diagnosticPreview: g.diagnosticPreviewJson,
      richEvidenceJson: g.richEvidenceJson,
      artifactRefsJson: g.artifactRefsJson,
      sortOrder: g.sortOrder,
    }));

    const specSummaries = row.specSummaries.map((s) => ({
      file: s.file,
      totalCount: s.totalCount,
      passedCount: s.passedCount,
      failedCount: s.failedCount,
      skippedCount: s.skippedCount,
      passRate: s.passRate,
      sortOrder: s.sortOrder,
    }));

    return {
      ingestionVersion: row.ingestionVersion,
      sourceContentHash: row.sourceContentHash,
      canonicalRunAt: row.canonicalRunAt.toISOString(),
      lastAnalyzedAt: row.lastAnalyzedAt.toISOString(),
      analysisStatus: row.analysisStatus,
      analysisError: row.analysisError,
      status: row.status,
      totalCount: row.totalCount,
      passedCount: row.passedCount,
      failedCount: row.failedCount,
      skippedCount: row.skippedCount,
      flakyCount: row.flakyCount,
      passRate: row.passRate,
      durationMs: row.durationMs,
      branch: row.branch,
      commitSha: row.commitSha,
      chronology: asChronologyInternal(row.chronologyJson),
      ingestionWarnings: asStringArray(row.ingestionWarningsJson),
      failureGroups,
      specSummaries,
    };
  }

  async getPersistedIntelligenceApiDto(
    runId: string,
  ): Promise<SystemTestPersistedIntelligenceDto | null> {
    const row = await this.prisma.systemTestRunIntelligence.findUnique({
      where: { runId },
      include: {
        failureGroups: { orderBy: { sortOrder: "asc" } },
        specSummaries: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!row) return null;
    return mapRowToApiDto(row);
  }

  /**
   * Completed persisted groups only. Pending/failed/missing → null (caller uses raw cases).
   */
  async getFailureGroupsForRun(runId: string): Promise<FailureGroup[] | null> {
    const row = await this.prisma.systemTestRunIntelligence.findUnique({
      where: { runId },
      include: {
        failureGroups: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!row || row.analysisStatus !== "completed") return null;

    return row.failureGroups.map((g) => ({
      key: g.canonicalKey,
      file: g.file,
      title: g.title,
      shortMessage: g.shortMessage,
      occurrences: g.occurrences,
      testTitles: asStringArray(g.testTitlesJson),
    }));
  }
}
