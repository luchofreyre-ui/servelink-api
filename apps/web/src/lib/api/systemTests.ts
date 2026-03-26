import { API_BASE_URL } from "@/lib/api";
import type {
  SystemTestCaseResult,
  SystemTestRunDetailResponse,
  SystemTestSupportPayload,
  SystemTestsCompareCaseGroup,
  SystemTestsComparePayload,
  SystemTestsCompareResult,
  SystemTestsRunDelta,
  SystemTestsRunsResponse,
  SystemTestsSummaryResponse,
  SystemTestsTrendInsights,
  SystemTestsTrendPoint,
} from "@/types/systemTests";

const FETCH_TIMEOUT_MS = 25_000;

function parseJsonStrict(raw: string, status: number): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`Invalid JSON response (HTTP ${status})`);
  }
}

async function adminJson<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init?.headers as Record<string, string>),
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  const payload = parseJsonStrict(text, response.status) as T & { message?: string };

  if (!response.ok) {
    const msg =
      typeof (payload as { message?: unknown }).message === "string"
        ? String((payload as { message: string }).message)
        : `Request failed: ${response.status}`;
    throw new Error(msg);
  }

  return payload as T;
}

export async function fetchAdminSystemTestsSummary(
  accessToken: string,
): Promise<SystemTestsSummaryResponse> {
  return adminJson<SystemTestsSummaryResponse>(
    accessToken,
    "/api/v1/admin/system-tests/summary",
  );
}

export async function fetchAdminSystemTestRuns(
  accessToken: string,
  query?: { page?: number; limit?: number },
): Promise<SystemTestsRunsResponse> {
  const qs = new URLSearchParams();
  qs.set("page", String(query?.page ?? 1));
  qs.set("limit", String(query?.limit ?? 20));
  return adminJson<SystemTestsRunsResponse>(
    accessToken,
    `/api/v1/admin/system-tests/runs?${qs.toString()}`,
  );
}

export async function fetchAdminSystemTestRunDetail(
  accessToken: string,
  runId: string,
): Promise<SystemTestRunDetailResponse> {
  return adminJson<SystemTestRunDetailResponse>(
    accessToken,
    `/api/v1/admin/system-tests/runs/${encodeURIComponent(runId)}`,
  );
}

function isFailedCaseStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "failed" || s === "timedout" || s === "interrupted";
}

function isFlakyCase(c: SystemTestCaseResult): boolean {
  const s = c.status.toLowerCase();
  if (s === "flaky") return true;
  return c.retryCount > 0 && !isFailedCaseStatus(c.status);
}

/** Stable identity for compare: fullName → title → title::route */
export function systemTestCaseKey(c: SystemTestCaseResult): string {
  const fn = c.fullName?.trim();
  if (fn) return fn;
  const t = c.title?.trim();
  if (t) return t;
  return `${c.title}::${c.route ?? ""}`;
}

function firstByKey(
  cases: SystemTestCaseResult[],
  pred: (c: SystemTestCaseResult) => boolean,
): Map<string, SystemTestCaseResult> {
  const m = new Map<string, SystemTestCaseResult>();
  for (const c of cases) {
    if (!pred(c)) continue;
    const k = systemTestCaseKey(c);
    if (!m.has(k)) m.set(k, c);
  }
  return m;
}

function allFirstByKey(cases: SystemTestCaseResult[]): Map<string, SystemTestCaseResult> {
  const m = new Map<string, SystemTestCaseResult>();
  for (const c of cases) {
    const k = systemTestCaseKey(c);
    if (!m.has(k)) m.set(k, c);
  }
  return m;
}

export function buildSystemTestsTrendPoints(runs: SystemTestsRunsResponse): SystemTestsTrendPoint[] {
  const sorted = [...runs.items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return sorted.map((r) => ({
    runId: r.id,
    createdAt: r.createdAt,
    status: r.status,
    source: r.source,
    branch: r.branch,
    commitSha: r.commitSha,
    durationMs: r.durationMs,
    totalCount: r.totalCount,
    passedCount: r.passedCount,
    failedCount: r.failedCount,
    skippedCount: r.skippedCount,
    flakyCount: r.flakyCount,
    passRate: r.totalCount > 0 ? r.passedCount / r.totalCount : 0,
  }));
}

function streakLabelFromPoints(sortedAsc: SystemTestsTrendPoint[]): string {
  if (!sortedAsc.length) return "No runs";
  let pass = 0;
  for (let i = sortedAsc.length - 1; i >= 0; i--) {
    if (sortedAsc[i].status.toLowerCase() === "passed") pass++;
    else break;
  }
  if (pass > 0) {
    return `${pass} consecutive passing run${pass > 1 ? "s" : ""}`;
  }
  let bad = 0;
  for (let i = sortedAsc.length - 1; i >= 0; i--) {
    const s = sortedAsc[i].status.toLowerCase();
    if (s === "failed" || s === "partial") bad++;
    else break;
  }
  if (bad > 0) {
    return `${bad} consecutive non-passing run${bad > 1 ? "s" : ""}`;
  }
  return "Mixed recent outcomes";
}

export function buildSystemTestsTrendInsights(
  points: SystemTestsTrendPoint[],
): SystemTestsTrendInsights | null {
  if (points.length === 0) return null;
  const sorted = [...points].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const latest = sorted[sorted.length - 1];
  const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null;

  return {
    latestStatus: latest.status,
    latestPassRate: latest.passRate,
    previousPassRate: prev?.passRate ?? null,
    passRateDelta: prev != null ? latest.passRate - prev.passRate : null,
    failedDelta: prev != null ? latest.failedCount - prev.failedCount : null,
    flakyDelta: prev != null ? latest.flakyCount - prev.flakyCount : null,
    durationDeltaMs:
      prev != null && latest.durationMs != null && prev.durationMs != null
        ? latest.durationMs - prev.durationMs
        : null,
    streakLabel: streakLabelFromPoints(sorted),
  };
}

function runPassRate(run: SystemTestRunDetailResponse["run"]): number {
  return run.totalCount > 0 ? run.passedCount / run.totalCount : 0;
}

export function buildSystemTestsCompareResult(
  baseDetail: SystemTestRunDetailResponse,
  targetDetail: SystemTestRunDetailResponse,
): SystemTestsCompareResult {
  const b = baseDetail.run;
  const t = targetDetail.run;

  const passRateDelta = runPassRate(t) - runPassRate(b);

  const delta: SystemTestsRunDelta = {
    totalDelta: t.totalCount - b.totalCount,
    passedDelta: t.passedCount - b.passedCount,
    failedDelta: t.failedCount - b.failedCount,
    skippedDelta: t.skippedCount - b.skippedCount,
    flakyDelta: t.flakyCount - b.flakyCount,
    durationDeltaMs:
      b.durationMs != null && t.durationMs != null ? t.durationMs - b.durationMs : null,
    passRateDelta,
  };

  const baseFail = firstByKey(baseDetail.cases, (c) => isFailedCaseStatus(c.status));
  const targetFail = firstByKey(targetDetail.cases, (c) => isFailedCaseStatus(c.status));
  const baseFlaky = firstByKey(baseDetail.cases, isFlakyCase);
  const targetFlaky = firstByKey(targetDetail.cases, isFlakyCase);
  const allBase = allFirstByKey(baseDetail.cases);
  const allTarget = allFirstByKey(targetDetail.cases);

  const newFailures: SystemTestsCompareCaseGroup[] = [];
  const resolvedFailures: SystemTestsCompareCaseGroup[] = [];
  const stillFailing: SystemTestsCompareCaseGroup[] = [];
  const newFlaky: SystemTestsCompareCaseGroup[] = [];
  const resolvedFlaky: SystemTestsCompareCaseGroup[] = [];

  for (const [k, tc] of targetFail) {
    if (!baseFail.has(k)) {
      newFailures.push({
        key: k,
        title: tc.title,
        targetCase: tc,
      });
    }
  }
  for (const [k, bc] of baseFail) {
    if (!targetFail.has(k)) {
      resolvedFailures.push({
        key: k,
        title: bc.title,
        baseCase: bc,
      });
    }
  }
  for (const [k, bc] of baseFail) {
    const tc = targetFail.get(k);
    if (tc) {
      stillFailing.push({
        key: k,
        title: tc.title,
        baseCase: bc,
        targetCase: tc,
      });
    }
  }

  for (const [k, tc] of targetFlaky) {
    if (!baseFlaky.has(k)) {
      newFlaky.push({
        key: k,
        title: tc.title,
        baseCase: allBase.get(k),
        targetCase: tc,
      });
    }
  }
  for (const [k, bc] of baseFlaky) {
    if (!targetFlaky.has(k)) {
      resolvedFlaky.push({
        key: k,
        title: bc.title,
        baseCase: bc,
        targetCase: allTarget.get(k),
      });
    }
  }

  return {
    baseRun: b,
    targetRun: t,
    delta,
    newFailures,
    resolvedFailures,
    stillFailing,
    newFlaky,
    resolvedFlaky,
  };
}

export function buildSystemTestsComparePayload(compare: SystemTestsCompareResult): SystemTestsComparePayload {
  return {
    baseRunId: compare.baseRun.id,
    targetRunId: compare.targetRun.id,
    base: compare.baseRun,
    target: compare.targetRun,
    delta: compare.delta,
    newFailures: compare.newFailures,
    resolvedFailures: compare.resolvedFailures,
    stillFailing: compare.stillFailing,
    newFlaky: compare.newFlaky,
    resolvedFlaky: compare.resolvedFlaky,
  };
}

/** Build compact support payload: failing cases only + run metadata + diagnostics. */
export function buildSystemTestSupportPayload(
  detail: SystemTestRunDetailResponse,
): SystemTestSupportPayload {
  const { run, suiteBreakdown, diagnosticReport, cases } = detail;
  const failingCases = cases.filter((c) => isFailedCaseStatus(c.status));

  return {
    run: {
      id: run.id,
      createdAt: run.createdAt,
      source: run.source,
      branch: run.branch,
      commitSha: run.commitSha,
      status: run.status,
    },
    summary: {
      total: run.totalCount,
      passed: run.passedCount,
      failed: run.failedCount,
      skipped: run.skippedCount,
      flaky: run.flakyCount,
    },
    suiteBreakdown,
    failingCases,
    diagnosticReport,
  };
}
