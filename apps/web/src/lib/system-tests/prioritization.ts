import { fixOpportunityToResolutionPreview } from "@/lib/system-tests/fixOpportunityPreview";
import type {
  SystemTestsFailurePattern,
  SystemTestsFlakyCaseRow,
  SystemTestsHistoricalCaseRef,
  SystemTestsDurationRegression,
  SystemTestsAlert,
  SystemTestsTopProblemItem,
  SystemTestsTopProblemType,
} from "@/types/systemTests";
import { lifecycleStateRank } from "@/lib/system-tests/lifecycle";
import type { SystemTestFixOpportunity } from "@/types/systemTestResolution";

const TYPE_ORDER: Record<SystemTestsTopProblemType, number> = {
  regression: 4,
  pattern: 3,
  flaky: 2,
  duration: 1,
};

/** Impact ranking for flaky rows (operator view). */
export function sortFlakyByImpact(rows: SystemTestsFlakyCaseRow[]): SystemTestsFlakyCaseRow[] {
  return [...rows].sort((a, b) => {
    const af = a.isCurrentlyFailing ? 400 : 0;
    const bf = b.isCurrentlyFailing ? 400 : 0;
    const as = af + a.flakyScore * 12 + a.failCount * 25 + a.transitionCount * 8;
    const bs = bf + b.flakyScore * 12 + b.failCount * 25 + b.transitionCount * 8;
    if (bs !== as) return bs - as;
    return b.totalObservations - a.totalObservations;
  });
}

const SEV_SCORE = { high: 30, medium: 18, low: 6 };

/** Patterns: severity, cross-file spread, latest-run spike. */
export function sortPatternsByImpact(patterns: SystemTestsFailurePattern[]): SystemTestsFailurePattern[] {
  return [...patterns].sort((a, b) => {
    const as =
      SEV_SCORE[a.severity] * 100 +
      a.affectedFiles.length * 45 +
      a.affectedCases.length * 12 +
      a.latestRunCount * 22 +
      a.count * 3;
    const bs =
      SEV_SCORE[b.severity] * 100 +
      b.affectedFiles.length * 45 +
      b.affectedCases.length * 12 +
      b.latestRunCount * 22 +
      b.count * 3;
    return bs - as;
  });
}

/** New / persistent failure refs: richer error text and cross-file hints score higher. */
export function sortRegressionsByImpact(refs: SystemTestsHistoricalCaseRef[]): SystemTestsHistoricalCaseRef[] {
  return [...refs].sort((a, b) => {
    const af = (a.detail?.length ?? 0) * 2 + (a.filePath?.includes("/") ? 5 : 0);
    const bf = (b.detail?.length ?? 0) * 2 + (b.filePath?.includes("/") ? 5 : 0);
    if (bf !== af) return bf - af;
    return (b.title ?? "").localeCompare(a.title ?? "");
  });
}

export type TopProblemsSummaryInput = {
  regressions: SystemTestsHistoricalCaseRef[];
  persistentFailures?: SystemTestsHistoricalCaseRef[];
  flakyCases: SystemTestsFlakyCaseRow[];
  patterns: SystemTestsFailurePattern[];
  /** Used only to backfill when data-derived items are thin. */
  alerts?: SystemTestsAlert[];
  durationRegressions?: SystemTestsDurationRegression[];
};

/**
 * Unified top 3–5 issues for dashboard / export. Regressions beat patterns beat flaky beat duration at equal scores.
 */
export function buildTopProblemsSummary(input: TopProblemsSummaryInput): SystemTestsTopProblemItem[] {
  const {
    regressions,
    persistentFailures = [],
    flakyCases,
    patterns,
    alerts = [],
    durationRegressions = [],
  } = input;

  const items: SystemTestsTopProblemItem[] = [];

  const regSorted = sortRegressionsByImpact(regressions);
  if (regSorted.length) {
    const n = regSorted.length;
    items.push({
      title: n === 1 ? "New regression vs prior run" : `${n} new regressions vs prior run`,
      type: "regression",
      severity: n >= 5 ? "high" : n >= 2 ? "medium" : "low",
      impactScore: 1000 + n * 80 + Math.min(n, 8) * 15,
      summary:
        n === 1
          ? `“${regSorted[0].title}” passed before and now fails — inspect first.`
          : `${n} cases that passed on the previous run now fail — triage newest failures first.`,
    });
  }

  const persSorted = sortRegressionsByImpact(persistentFailures);
  if (persSorted.length && items.length < 5) {
    const n = persSorted.length;
    items.push({
      title: n === 1 ? "Persistent failure" : `${n} persistent failures`,
      type: "regression",
      severity: n >= 4 ? "high" : "medium",
      impactScore: 880 + n * 55,
      summary:
        "These cases failed on the latest run and multiple times in the recent window — not a one-off flake.",
    });
  }

  const patSorted = sortPatternsByImpact(patterns);
  for (const p of patSorted.slice(0, 2)) {
    if (items.length >= 5) break;
    const spread = p.affectedFiles.length;
    items.push({
      title: p.label,
      type: "pattern",
      severity: p.severity === "high" ? "high" : p.severity === "medium" ? "medium" : "low",
      impactScore: 720 + p.count * 25 + spread * 40 + p.latestRunCount * 35,
      summary: `${p.count} hit(s) across ${spread} file(s); latest run saw ${p.latestRunCount}. Cluster: ${p.label}.`,
    });
  }

  const flakySorted = sortFlakyByImpact(flakyCases.filter((r) => r.isCurrentlyFailing));
  for (const f of flakySorted.slice(0, 2)) {
    if (items.length >= 5) break;
    items.push({
      title: `Flaky / unstable: ${f.title}`,
      type: "flaky",
      severity: f.transitionCount >= 3 || f.flakyScore >= 12 ? "high" : "medium",
      impactScore: 560 + f.flakyScore * 20 + f.transitionCount * 15,
      summary: `Failing now with ${f.transitionCount} status churns in the window — stabilize or quarantine.`,
    });
  }

  for (const d of sortDurationByImpact(durationRegressions).slice(0, 1)) {
    if (items.length >= 5) break;
    items.push({
      title: `Slowdown: ${d.title}`,
      type: "duration",
      severity: d.deltaMs > 60_000 ? "high" : d.deltaMs > 15_000 ? "medium" : "low",
      impactScore: 400 + Math.min(d.deltaMs / 1000, 120),
      summary: `Duration increased by ~${Math.round(d.deltaMs / 1000)}s vs prior run — check waits or env.`,
    });
  }

  items.sort((x, y) => {
    if (y.impactScore !== x.impactScore) return y.impactScore - x.impactScore;
    return TYPE_ORDER[x.type] - TYPE_ORDER[y.type];
  });

  const seen = new Set<string>();
  const deduped: SystemTestsTopProblemItem[] = [];
  for (const it of items) {
    const k = `${it.type}:${it.title.slice(0, 80)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(it);
    if (deduped.length >= 5) break;
  }

  return deduped.slice(0, 5);
}

function confidenceToTopProblemSeverity(confidence: number | null): SystemTestsTopProblemItem["severity"] {
  if (confidence == null || Number.isNaN(confidence)) return "medium";
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.6) return "medium";
  return "low";
}

/**
 * Converts a summary fix opportunity into a top-issue row with embedded resolution preview
 * (same Phase 10A fields as families list), for dashboard triage.
 */
export function fixOpportunityToTopProblemItem(opp: SystemTestFixOpportunity): SystemTestsTopProblemItem {
  const lifecycleBonus = lifecycleStateRank(opp.lifecycle.lifecycleState) * 25;
  return {
    title: opp.title,
    type: "pattern",
    severity: confidenceToTopProblemSeverity(opp.confidence),
    impactScore: 950 + lifecycleBonus + opp.failureCount * 4 + opp.affectedRunCount * 2,
    summary: `${opp.failureCount} failure${opp.failureCount !== 1 ? "s" : ""} · ${opp.affectedRunCount} run${opp.affectedRunCount !== 1 ? "s" : ""} affected`,
    familyId: opp.familyId,
    familyTitle: opp.title,
    resolutionPreview: fixOpportunityToResolutionPreview(opp),
    operatorState: opp.operatorState,
    lifecycle: opp.lifecycle,
  };
}

/**
 * Prepends high-signal fix opportunities (with previews) ahead of heuristic top problems,
 * deduping pattern rows that share the same title as an opportunity.
 */
export function mergeFixOpportunitiesIntoTopProblems(
  base: SystemTestsTopProblemItem[],
  opportunities: SystemTestFixOpportunity[],
  opts?: { maxOpportunities?: number; maxTotal?: number },
): SystemTestsTopProblemItem[] {
  const maxOpp = opts?.maxOpportunities ?? 3;
  const maxTotal = opts?.maxTotal ?? 5;
  const fromOpp = opportunities.slice(0, maxOpp).map((o) => fixOpportunityToTopProblemItem(o));
  const titles = new Set(fromOpp.map((x) => x.title.toLowerCase().trim()));
  const filteredBase = base.filter((b) => {
    if (b.type !== "pattern") return true;
    return !titles.has(b.title.toLowerCase().trim());
  });
  const merged = [...fromOpp, ...filteredBase];
  merged.sort((a, b) => b.impactScore - a.impactScore);
  return merged.slice(0, maxTotal);
}

function sortDurationByImpact(rows: SystemTestsDurationRegression[]): SystemTestsDurationRegression[] {
  return [...rows].sort((a, b) => b.deltaMs - a.deltaMs);
}
