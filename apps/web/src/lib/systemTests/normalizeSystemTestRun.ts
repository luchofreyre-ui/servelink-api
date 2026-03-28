import { isFailedCaseStatus, isSkippedCaseStatus } from "@/lib/system-tests/shared";
import { groupSystemTestFailures } from "@/lib/systemTests/groupSystemTestFailures";
import { normalizeSystemTestStatus } from "@/lib/systemTests/systemTestStatus";
import { sortSystemTestRunsListOldestFirst } from "@/lib/systemTests/sortSystemTestRuns";
import type {
  SystemTestCaseResult,
  SystemTestFailureEvidenceSummary,
  SystemTestFailureGroup,
  SystemTestPersistedIntelligenceResponse,
  SystemTestRunDetail,
  SystemTestRunDetailMeta,
  SystemTestRunDetailResponse,
  SystemTestRunSummary,
  SystemTestRunsListItem,
  SystemTestSpecBreakdownRow,
  SystemTestTrendPoint,
  SystemTestRunTrendVsPrevious,
} from "@/types/systemTests";

function passRateFromCounts(total: number, passed: number): number {
  if (total <= 0) return 0;
  return passed / total;
}

function nonNegInt(n: unknown, fallback = 0): number {
  if (typeof n === "number" && Number.isFinite(n)) return Math.max(0, Math.floor(n));
  const x = parseInt(String(n), 10);
  if (Number.isFinite(x) && x >= 0) return x;
  return fallback;
}

function trimOrNull(s: string | null | undefined): string | null {
  const t = typeof s === "string" ? s.trim() : "";
  return t ? t : null;
}

function sanitizeCase(c: SystemTestCaseResult, index: number): SystemTestCaseResult {
  const id = typeof c.id === "string" && c.id.trim() ? c.id.trim() : `missing-id-${index}`;
  const title =
    typeof c.title === "string" && c.title.trim() ?
      c.title.trim()
    : typeof c.fullName === "string" && c.fullName.trim() ?
      c.fullName.trim()
    : "unknown";
  const fullName =
    typeof c.fullName === "string" && c.fullName.trim() ? c.fullName.trim() : title;

  return {
    id,
    suite: typeof c.suite === "string" && c.suite.trim() ? c.suite.trim() : "unknown",
    filePath: typeof c.filePath === "string" && c.filePath.trim() ? c.filePath.trim() : "unknown",
    title,
    fullName,
    status: typeof c.status === "string" ? c.status : "unknown",
    retryCount: nonNegInt(c.retryCount, 0),
    durationMs: typeof c.durationMs === "number" && Number.isFinite(c.durationMs) ? c.durationMs : null,
    route: trimOrNull(c.route),
    selector: trimOrNull(c.selector),
    errorMessage: c.errorMessage != null ? String(c.errorMessage) : null,
    errorStack: c.errorStack != null ? String(c.errorStack) : null,
    line: typeof c.line === "number" && Number.isFinite(c.line) ? c.line : null,
    column: typeof c.column === "number" && Number.isFinite(c.column) ? c.column : null,
  };
}

function dedupeAndSanitizeCases(raw: unknown): SystemTestCaseResult[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: SystemTestCaseResult[] = [];
  raw.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const c = sanitizeCase(item as SystemTestCaseResult, index);
    if (seen.has(c.id)) return;
    seen.add(c.id);
    out.push(c);
  });
  return out;
}

export function normalizeRunSummaryFromListItem(item: SystemTestRunsListItem): SystemTestRunSummary {
  const totalCount = nonNegInt(item.totalCount, 0);
  const passedCount = Math.min(nonNegInt(item.passedCount, 0), totalCount);
  const failedCount = Math.min(nonNegInt(item.failedCount, 0), totalCount);
  const skippedCount = Math.min(nonNegInt(item.skippedCount, 0), totalCount);
  return {
    id: item.id,
    status: normalizeSystemTestStatus(item.status),
    createdAt: item.createdAt,
    finishedAt: null,
    durationMs: typeof item.durationMs === "number" && Number.isFinite(item.durationMs) ? item.durationMs : null,
    branch: trimOrNull(item.branch),
    commitSha: trimOrNull(item.commitSha),
    totalCount,
    passedCount,
    failedCount,
    skippedCount,
    passRate: passRateFromCounts(totalCount, passedCount),
  };
}

export function normalizeRunSummaryFromDetailMeta(run: SystemTestRunDetailMeta): SystemTestRunSummary {
  const totalCount = nonNegInt(run.totalCount, 0);
  const passedCount = Math.min(nonNegInt(run.passedCount, 0), totalCount);
  const failedCount = Math.min(nonNegInt(run.failedCount, 0), totalCount);
  const skippedCount = Math.min(nonNegInt(run.skippedCount, 0), totalCount);
  return {
    id: run.id,
    status: normalizeSystemTestStatus(run.status),
    createdAt: run.createdAt,
    finishedAt: null,
    durationMs: typeof run.durationMs === "number" && Number.isFinite(run.durationMs) ? run.durationMs : null,
    branch: trimOrNull(run.branch),
    commitSha: trimOrNull(run.commitSha),
    totalCount,
    passedCount,
    failedCount,
    skippedCount,
    passRate: passRateFromCounts(totalCount, passedCount),
  };
}

function accumulateFileRow(
  map: Map<string, { total: number; passed: number; failed: number; skipped: number }>,
  file: string,
  c: SystemTestCaseResult,
) {
  const key = file || "unknown";
  if (!map.has(key)) {
    map.set(key, { total: 0, passed: 0, failed: 0, skipped: 0 });
  }
  const row = map.get(key)!;
  row.total += 1;
  const s = c.status.toLowerCase();
  if (s === "passed" || s === "flaky") {
    row.passed += 1;
  } else if (isSkippedCaseStatus(c.status)) {
    row.skipped += 1;
  } else if (isFailedCaseStatus(c.status)) {
    row.failed += 1;
  } else {
    row.failed += 1;
  }
}

export function buildSpecBreakdownFromCases(cases: SystemTestCaseResult[]): SystemTestSpecBreakdownRow[] {
  const map = new Map<string, { total: number; passed: number; failed: number; skipped: number }>();
  for (const c of cases) {
    accumulateFileRow(map, c.filePath || "unknown", c);
  }

  const rows: SystemTestSpecBreakdownRow[] = [...map.entries()].map(([file, v]) => ({
    file,
    totalCount: v.total,
    passedCount: v.passed,
    failedCount: v.failed,
    skippedCount: v.skipped,
    passRate: passRateFromCounts(v.total, v.passed),
  }));

  return rows.sort((a, b) => {
    if (b.failedCount !== a.failedCount) return b.failedCount - a.failedCount;
    if (a.passRate !== b.passRate) return a.passRate - b.passRate;
    return a.file.localeCompare(b.file);
  });
}

export function buildTrendPointsFromRuns(
  items: SystemTestRunsListItem[],
  opts?: { limit?: number },
): SystemTestTrendPoint[] {
  const limit = opts?.limit ?? 20;
  const { sorted } = sortSystemTestRunsListOldestFirst(items);
  const slice = sorted.slice(Math.max(0, sorted.length - limit));
  return slice.map((r) => ({
    runId: r.id,
    createdAt: r.createdAt,
    durationMs: r.durationMs,
    failedCount: r.failedCount,
    passRate: passRateFromCounts(r.totalCount, r.passedCount),
    status: normalizeSystemTestStatus(r.status),
  }));
}

function persistedSpecsToRows(
  summaries: SystemTestPersistedIntelligenceResponse["specSummaries"],
): SystemTestSpecBreakdownRow[] {
  if (!summaries.length) return [];
  return [...summaries]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ sortOrder: _s, ...row }) => row);
}

function evidenceSummaryFromPersistedSamples(
  sampleLines: string[],
): SystemTestFailureEvidenceSummary {
  return {
    messageLine: sampleLines[0] ?? null,
    assertionLine:
      sampleLines.find((l) => /Expected:|Received:|toHave|locator|Timed out/i.test(l)) ?? null,
    locationLine: null,
    diagnosticLines: sampleLines.slice(0, 4),
  };
}

function mapPersistedFailureGroup(
  pg: SystemTestPersistedIntelligenceResponse["failureGroups"][number],
  clientByKey: Map<string, SystemTestFailureGroup>,
): SystemTestFailureGroup {
  const cg = clientByKey.get(pg.canonicalKey);
  if (cg) {
    return {
      ...cg,
      fingerprint: pg.canonicalFingerprint,
      file: pg.file,
      projectName: pg.projectName ?? cg.projectName,
      title: pg.title,
      shortMessage: pg.shortMessage,
      fullMessage: pg.fullMessage ?? cg.fullMessage,
      finalStatus: pg.finalStatus ?? cg.finalStatus,
      occurrences: pg.occurrences,
      testTitles: [...pg.testTitles].sort((a, b) => a.localeCompare(b)),
      diagnosticPreview: cg.diagnosticPreview ?? pg.diagnosticPreview?.text ?? null,
      richEvidence: pg.richEvidence,
      artifactRefs: pg.artifactRefs ?? [],
      debuggingHint: pg.debuggingHint,
      family: pg.family ?? null,
      incident: pg.incident ?? null,
    };
  }

  const ev = evidenceSummaryFromPersistedSamples(pg.evidenceSummary.sampleLines ?? []);
  return {
    key: pg.canonicalKey,
    fingerprint: pg.canonicalFingerprint,
    file: pg.file,
    projectName: pg.projectName,
    title: pg.title,
    shortMessage: pg.shortMessage,
    fullMessage: pg.fullMessage,
    finalStatus: pg.finalStatus,
    occurrences: pg.occurrences,
    testTitles: [...pg.testTitles].sort((a, b) => a.localeCompare(b)),
    evidenceLines: [],
    evidenceSummary: ev,
    diagnosticPreview: pg.diagnosticPreview?.text ?? null,
    richEvidence: pg.richEvidence,
    artifactRefs: pg.artifactRefs ?? [],
    debuggingHint: pg.debuggingHint,
    family: pg.family ?? null,
    incident: pg.incident ?? null,
  };
}

export function normalizeSystemTestRunDetail(detail: SystemTestRunDetailResponse): SystemTestRunDetail {
  const cases = dedupeAndSanitizeCases(detail.cases);
  const clientGroups = groupSystemTestFailures(cases);
  const pi = detail.persistedIntelligence;

  if (
    pi &&
    pi.summary.analysisStatus === "completed" &&
    pi.failureGroups.length > 0
  ) {
    const clientByKey = new Map(clientGroups.map((g) => [g.key, g]));
    const failureGroups = [...pi.failureGroups]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((pg) => mapPersistedFailureGroup(pg, clientByKey));

    const specsFromPi = persistedSpecsToRows(pi.specSummaries);
    return {
      summary: normalizeRunSummaryFromDetailMeta(detail.run),
      specs: specsFromPi.length ? specsFromPi : buildSpecBreakdownFromCases(cases),
      failureGroups,
    };
  }

  return {
    summary: normalizeRunSummaryFromDetailMeta(detail.run),
    specs: buildSpecBreakdownFromCases(cases),
    failureGroups: clientGroups,
  };
}

export function trendVsPrevious(
  current: SystemTestRunSummary,
  previous: SystemTestRunSummary | null,
): SystemTestRunTrendVsPrevious {
  if (!previous) {
    return {
      previousRunId: null,
      passRateDelta: null,
      failedDelta: null,
      durationDeltaMs: null,
    };
  }
  return {
    previousRunId: previous.id,
    passRateDelta: current.passRate - previous.passRate,
    failedDelta: current.failedCount - previous.failedCount,
    durationDeltaMs:
      current.durationMs != null && previous.durationMs != null
        ? current.durationMs - previous.durationMs
        : null,
  };
}
