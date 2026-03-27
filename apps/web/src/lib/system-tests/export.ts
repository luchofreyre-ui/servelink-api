import { buildSystemTestSupportPayload } from "@/lib/api/systemTests";
import type {
  SystemTestRunDetailResponse,
  SystemTestsAlert,
  SystemTestsCompareIntelligence,
  SystemTestsComparePayload,
  SystemTestsCompareResult,
  SystemTestsEnrichedCompareExport,
  SystemTestsEnrichedDiagnosticExport,
  SystemTestsFailurePattern,
  SystemTestsFlakyCaseRow,
} from "@/types/systemTests";
import { buildDashboardAlerts, type DashboardAlertInput } from "./alerts";
import { buildHistoricalChanges } from "./compare";
import { buildFailurePatterns } from "./patterns";
import { buildFlakyCaseAnalysis } from "./flaky";
import { buildTopProblemsSummary } from "./prioritization";

const DIAG_EXCERPT_LEN = 4000;
const MAX_SLOW = 12;
const MAX_FAIL_PREVIEW = 15;
const MAX_PATTERN = 8;

function isoNow(): string {
  return new Date().toISOString();
}

/**
 * Enriched single-run export for AI / support (concise, no full raw history).
 * Field order: alerts → topProblems → regressions → persistent → flaky → patterns → …
 */
export function buildEnrichedDiagnosticExport(
  detail: SystemTestRunDetailResponse,
  options?: {
    recentDetails?: SystemTestRunDetailResponse[];
    flakyRows?: SystemTestsFlakyCaseRow[];
    patterns?: SystemTestsFailurePattern[];
    alerts?: SystemTestsAlert[];
    /** When provided, merges with dashboard-style inputs (trends, summary). */
    dashboardContext?: Pick<
      DashboardAlertInput,
      "trendPoints" | "trendInsights" | "summary"
    >;
  },
): SystemTestsEnrichedDiagnosticExport {
  const basePayload = buildSystemTestSupportPayload(detail);

  const window = options?.recentDetails?.length
    ? [detail, ...options.recentDetails.filter((d) => d.run.id !== detail.run.id)].slice(0, 12)
    : [detail];

  const flakyRows =
    options?.flakyRows ??
    (window.length >= 1 ? buildFlakyCaseAnalysis(window, { maxRuns: 12 }) : []);

  const patterns =
    options?.patterns ??
    (window.length >= 1 ? buildFailurePatterns(window, { maxRuns: 12 }) : []);

  const historical =
    window.length >= 2 ? buildHistoricalChanges(window, { maxRuns: 12 }) : null;

  const ctx = options?.dashboardContext;
  const alerts =
    options?.alerts ??
    buildDashboardAlerts({
      trendPoints: ctx?.trendPoints ?? [],
      trendInsights: ctx?.trendInsights ?? null,
      summary: ctx?.summary ?? null,
      flakyCases: flakyRows,
      patterns,
      historical,
    }).slice(0, 12);

  const topProblems = buildTopProblemsSummary({
    regressions: historical?.newRegressions ?? [],
    persistentFailures: historical?.persistentFailures ?? [],
    flakyCases: flakyRows,
    patterns,
    alerts,
    durationRegressions: historical?.slowestRegressions ?? [],
  });

  const newRegressions = historical?.newRegressions ?? [];
  const persistentFailures = historical?.persistentFailures ?? [];

  const withDuration = detail.cases
    .filter((c) => c.durationMs != null)
    .sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0))
    .slice(0, MAX_SLOW)
    .map((c) => ({
      title: c.title,
      filePath: c.filePath,
      durationMs: c.durationMs,
    }));

  const failingCasesPreview = detail.cases
    .filter((c) => {
      const s = c.status.toLowerCase();
      return s === "failed" || s === "timedout" || s === "interrupted";
    })
    .slice(0, MAX_FAIL_PREVIEW)
    .map((c) => ({
      title: c.title,
      filePath: c.filePath,
      errorMessage: c.errorMessage,
    }));

  const patternsOut = patterns.slice(0, MAX_PATTERN).map((p) => ({
    label: p.label,
    patternCategory: p.patternCategory,
    count: p.count,
    severity: p.severity,
    examples: p.examples.slice(0, 2),
    affectedFiles: p.affectedFiles.slice(0, 8),
  }));

  const flakyTop = flakyRows.slice(0, 10).map((r) => ({
    caseKey: r.caseKey,
    title: r.title,
    latestStatus: r.latestStatus,
    flakyScore: r.flakyScore,
    isCurrentlyFailing: r.isCurrentlyFailing,
  }));

  const notes: string[] = [];
  if (!options?.recentDetails?.length) {
    notes.push("Limited to this run until peer runs load — open the dashboard for the full window.");
  }
  if (newRegressions.length) {
    notes.push(`${newRegressions.length} case(s) regressed vs the previous run in this window.`);
  }

  let compareHints: string[] | undefined;
  if (window.length >= 2) {
    const asc = [...window].sort(
      (a, b) => new Date(a.run.createdAt).getTime() - new Date(b.run.createdAt).getTime(),
    );
    const older = asc[asc.length - 2]?.run.id;
    const newer = asc[asc.length - 1]?.run.id;
    if (older && newer && older !== newer) {
      compareHints = [
        `Suggested pairing: older run ${older} as base vs newer ${newer} as target.`,
        `/admin/system-tests/compare?baseRunId=${encodeURIComponent(older)}&targetRunId=${encodeURIComponent(newer)}`,
      ];
    }
  }

  return {
    version: 1,
    generatedAt: isoNow(),
    run: basePayload.run,
    summary: basePayload.summary,
    alerts,
    topProblems,
    newRegressions,
    persistentFailures,
    flakyCases: flakyTop,
    patterns: patternsOut,
    slowCases: withDuration,
    failingCasesPreview,
    diagnosticReportExcerpt: (detail.diagnosticReport ?? "").slice(0, DIAG_EXCERPT_LEN),
    notes,
    compareHints,
  };
}

function comparePairingNote(compare: SystemTestsCompareResult): string {
  const { baseRun, targetRun } = compare;
  const bt = new Date(baseRun.createdAt).getTime();
  const tt = new Date(targetRun.createdAt).getTime();
  if (tt > bt) return "Target is newer than base — good for forward regression triage.";
  if (tt < bt) return "Base is newer than target — you are diffing backward in time.";
  return "Base and target share the same timestamp — confirm run order.";
}

/**
 * Wrap API compare payload with intelligence for AI / operators.
 */
export function buildEnrichedCompareExport(
  compare: SystemTestsCompareResult,
  payload: SystemTestsComparePayload,
  intelligence: SystemTestsCompareIntelligence,
): SystemTestsEnrichedCompareExport {
  const topProblems = buildTopProblemsSummary({
    regressions: intelligence.newRegressions,
    persistentFailures: intelligence.persistentFailures,
    flakyCases: [],
    patterns: [],
    durationRegressions: intelligence.slowestRegressions,
  });

  return {
    version: 1,
    generatedAt: isoNow(),
    topProblems,
    compare: payload,
    intelligence,
    notes: [
      comparePairingNote(compare),
      `${compare.newFailures.length} new failure(s), ${compare.resolvedFailures.length} resolved, ${compare.stillFailing.length} still failing.`,
    ],
  };
}

export type { DashboardAlertInput };
