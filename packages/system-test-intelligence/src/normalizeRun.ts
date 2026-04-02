import { isFailedStatus } from "./status.js";
import type { IntelRunSnapshot, SpecSummaryRow, SystemTestCaseRowInput, SystemTestRunRowInput } from "./types.js";

/** Canonical JSON-serializable payload for content hashing (caller applies SHA-256 or similar). */
export function buildRunSourceContentPayload(
  run: SystemTestRunRowInput,
  cases: SystemTestCaseRowInput[],
): unknown {
  const sorted = [...cases].sort((a, b) => a.id.localeCompare(b.id));
  return {
    runUpdatedAt: run.updatedAt,
    totals: {
      totalCount: run.totalCount,
      passedCount: run.passedCount,
      failedCount: run.failedCount,
      skippedCount: run.skippedCount,
      flakyCount: run.flakyCount,
      status: run.status,
      durationMs: run.durationMs,
    },
    cases: sorted.map((c) => ({
      id: c.id,
      status: c.status,
      retryCount: c.retryCount,
      filePath: c.filePath,
      title: c.title,
      fullName: c.fullName,
      suite: c.suite,
      errorMessage: c.errorMessage,
      errorStack: c.errorStack,
      durationMs: c.durationMs,
      line: c.line,
      column: c.column,
      route: c.route,
      selector: c.selector,
    })),
  };
}

export function passRateFromRunRow(run: SystemTestRunRowInput): number {
  if (run.totalCount <= 0) return 0;
  return run.passedCount / run.totalCount;
}

export function passRateFromSnapshot(run: IntelRunSnapshot): number {
  if (run.totalCount <= 0) return 0;
  return run.passedCount / run.totalCount;
}

type FileAgg = {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
};

function accumulateFile(map: Map<string, FileAgg>, c: SystemTestCaseRowInput) {
  const key = c.filePath?.trim() || "unknown";
  if (!map.has(key)) {
    map.set(key, { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 });
  }
  const b = map.get(key)!;
  b.total += 1;
  const s = c.status.toLowerCase();
  if (s === "passed" || s === "flaky") {
    b.passed += 1;
    if (c.retryCount > 0 || s === "flaky") b.flaky += 1;
  } else if (s === "skipped") {
    b.skipped += 1;
  } else if (isFailedStatus(c.status)) {
    b.failed += 1;
  } else {
    b.failed += 1;
  }
}

export function buildSpecSummaryRows(
  cases: SystemTestCaseRowInput[],
): Omit<SpecSummaryRow, "sortOrder">[] {
  const map = new Map<string, FileAgg>();
  for (const c of cases) {
    accumulateFile(map, c);
  }
  const rows = [...map.entries()].map(([file, v]) => ({
    file,
    totalCount: v.total,
    passedCount: v.passed,
    failedCount: v.failed,
    skippedCount: v.skipped,
    passRate: v.total > 0 ? v.passed / v.total : 0,
  }));
  rows.sort((a, b) => {
    if (b.failedCount !== a.failedCount) return b.failedCount - a.failedCount;
    return a.file.localeCompare(b.file);
  });
  return rows;
}

export function withSpecSortOrder(
  rows: Omit<SpecSummaryRow, "sortOrder">[],
): SpecSummaryRow[] {
  return rows.map((r, sortOrder) => ({ ...r, sortOrder }));
}
