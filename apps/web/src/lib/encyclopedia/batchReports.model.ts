export type PipelineMode = "gap" | "expanded";

export type ReviewedTotals = {
  total: number;
  promote: number;
  review: number;
  reject: number;
};

export type PromoteTotals = {
  appendedCount: number;
  skippedCount: number;
  consideredCount: number;
  sourceCandidateCount?: number;
};

export type EncyclopediaBatchPipelineRun = {
  batchName: string;
  fileName: string;
  /** Relative to repo root (e.g. content-batches/encyclopedia/reports/batch-015.pipeline-summary.json). */
  reportPath: string;
  mode: PipelineMode;
  startedAt: string | null;
  finishedAt: string | null;
  reviewedSummary: ReviewedTotals | null;
  promoteSummary: PromoteTotals | null;
  scaffoldPageCount: number | null;
  enrichedPageCount: number | null;
  generatedFileCount: number;
  buildOk: boolean | null;
  buildExitCode: number | null;
  appendedIdsPath: string | null;
  inputRawCandidates: string | null;
  inputReviewedCandidates: string | null;
  steps: string[];
  error?: string;
  /** Milliseconds for sorting; 0 if unparseable. */
  sortTimestampMs: number;
};

export type BatchReportsAggregates = {
  totalRuns: number;
  gapRuns: number;
  expandedRuns: number;
  failedBuilds: number;
  zeroAppendRuns: number;
};

function parseIsoMs(value: unknown): number {
  if (typeof value !== "string") {
    return 0;
  }
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : 0;
}

function pickReviewedSummary(raw: Record<string, unknown>): ReviewedTotals | null {
  const rs = raw.reviewedSummary;
  if (!rs || typeof rs !== "object") {
    return null;
  }
  const o = rs as Record<string, unknown>;
  const total = o.total;
  const promote = o.promote;
  const review = o.review;
  const reject = o.reject;
  if (
    typeof total !== "number" ||
    typeof promote !== "number" ||
    typeof review !== "number" ||
    typeof reject !== "number"
  ) {
    return null;
  }
  return { total, promote, review, reject };
}

function pickPromoteSummary(raw: Record<string, unknown>): PromoteTotals | null {
  const ps = raw.promoteSummary;
  if (!ps || typeof ps !== "object") {
    return null;
  }
  const o = ps as Record<string, unknown>;
  const appendedCount = o.appendedCount;
  const skippedCount = o.skippedCount;
  const consideredCount = o.consideredCount;
  if (
    typeof appendedCount !== "number" ||
    typeof skippedCount !== "number" ||
    typeof consideredCount !== "number"
  ) {
    return null;
  }
  const sourceCandidateCount = o.sourceCandidateCount;
  return {
    appendedCount,
    skippedCount,
    consideredCount,
    ...(typeof sourceCandidateCount === "number" ? { sourceCandidateCount } : {}),
  };
}

function pickScaffoldPageCount(raw: Record<string, unknown>): number | null {
  const sc = raw.scaffold;
  if (!sc || typeof sc !== "object") {
    return null;
  }
  const n = (sc as { pageCount?: unknown }).pageCount;
  return typeof n === "number" ? n : null;
}

function pickEnrichedPageCount(raw: Record<string, unknown>): number | null {
  const en = raw.enriched;
  if (!en || typeof en !== "object") {
    return null;
  }
  const n = (en as { pageCount?: unknown }).pageCount;
  return typeof n === "number" ? n : null;
}

function pickInputFiles(raw: Record<string, unknown>): {
  rawCandidates: string | null;
  reviewedCandidates: string | null;
  appendedIds: string | null;
} {
  const inf = raw.inputFiles;
  if (!inf || typeof inf !== "object") {
    return { rawCandidates: null, reviewedCandidates: null, appendedIds: null };
  }
  const o = inf as Record<string, unknown>;
  return {
    rawCandidates: typeof o.rawCandidates === "string" ? o.rawCandidates : null,
    reviewedCandidates: typeof o.reviewedCandidates === "string" ? o.reviewedCandidates : null,
    appendedIds: typeof o.appendedIds === "string" ? o.appendedIds : null,
  };
}

/**
 * Parse a single pipeline summary file body. Returns null if not a valid batch pipeline summary.
 */
export function tryParsePipelineSummaryJson(
  content: string,
  fileName: string,
  reportPathRelative: string,
): EncyclopediaBatchPipelineRun | null {
  let data: unknown;
  try {
    data = JSON.parse(content) as unknown;
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") {
    return null;
  }
  const raw = data as Record<string, unknown>;
  if (typeof raw.batchName !== "string") {
    return null;
  }
  if (raw.mode !== "gap" && raw.mode !== "expanded") {
    return null;
  }
  const startedAt = typeof raw.startedAt === "string" ? raw.startedAt : null;
  const finishedAt = typeof raw.finishedAt === "string" ? raw.finishedAt : null;
  const sortTimestampMs = parseIsoMs(finishedAt) || parseIsoMs(startedAt);

  const build = raw.build;
  let buildOk: boolean | null = null;
  let buildExitCode: number | null = null;
  if (build && typeof build === "object") {
    const b = build as { ok?: unknown; exitCode?: unknown };
    if (typeof b.ok === "boolean") {
      buildOk = b.ok;
    }
    if (typeof b.exitCode === "number") {
      buildExitCode = b.exitCode;
    }
  }

  const genCount = raw.generatedFileCount;
  const generatedFileCount = typeof genCount === "number" ? genCount : 0;

  const steps = Array.isArray(raw.steps) ? raw.steps.filter((s): s is string => typeof s === "string") : [];

  const inputs = pickInputFiles(raw);

  let error: string | undefined;
  if (typeof raw.error === "string" && raw.error.trim()) {
    error = raw.error;
  }

  return {
    batchName: raw.batchName,
    fileName,
    reportPath: reportPathRelative,
    mode: raw.mode,
    startedAt,
    finishedAt,
    reviewedSummary: pickReviewedSummary(raw),
    promoteSummary: pickPromoteSummary(raw),
    scaffoldPageCount: pickScaffoldPageCount(raw),
    enrichedPageCount: pickEnrichedPageCount(raw),
    generatedFileCount,
    buildOk,
    buildExitCode,
    appendedIdsPath: inputs.appendedIds,
    inputRawCandidates: inputs.rawCandidates,
    inputReviewedCandidates: inputs.reviewedCandidates,
    steps,
    error,
    sortTimestampMs,
  };
}

export function sortBatchPipelineRuns(runs: EncyclopediaBatchPipelineRun[]): EncyclopediaBatchPipelineRun[] {
  return [...runs].sort((a, b) => {
    if (b.sortTimestampMs !== a.sortTimestampMs) {
      return b.sortTimestampMs - a.sortTimestampMs;
    }
    return b.fileName.localeCompare(a.fileName);
  });
}

export function summarizeBatchReports(runs: readonly EncyclopediaBatchPipelineRun[]): BatchReportsAggregates {
  let failedBuilds = 0;
  let zeroAppendRuns = 0;
  for (const r of runs) {
    if (r.buildOk === false) {
      failedBuilds += 1;
    }
    const a = r.promoteSummary?.appendedCount;
    if (typeof a === "number" && a === 0) {
      zeroAppendRuns += 1;
    }
  }
  return {
    totalRuns: runs.length,
    gapRuns: runs.filter((r) => r.mode === "gap").length,
    expandedRuns: runs.filter((r) => r.mode === "expanded").length,
    failedBuilds,
    zeroAppendRuns,
  };
}

export function formatDurationMs(startedAt: string | null, finishedAt: string | null): string | null {
  const a = startedAt ? Date.parse(startedAt) : NaN;
  const b = finishedAt ? Date.parse(finishedAt) : NaN;
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) {
    return null;
  }
  const sec = Math.round((b - a) / 1000);
  if (sec < 60) {
    return `${sec}s`;
  }
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export function appendYield(run: EncyclopediaBatchPipelineRun): number | null {
  const p = run.promoteSummary;
  if (!p || p.consideredCount <= 0) {
    return null;
  }
  return p.appendedCount / p.consideredCount;
}

export function generationYield(run: EncyclopediaBatchPipelineRun): number | null {
  if (run.promoteSummary == null || run.promoteSummary.appendedCount <= 0) {
    return null;
  }
  return run.generatedFileCount / run.promoteSummary.appendedCount;
}
