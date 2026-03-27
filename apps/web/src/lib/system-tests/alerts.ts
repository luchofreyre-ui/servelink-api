import type {
  SystemTestsAlert,
  SystemTestsFailurePattern,
  SystemTestsFlakyCaseRow,
  SystemTestsHistoricalChanges,
  SystemTestsSummaryResponse,
  SystemTestsTrendInsights,
  SystemTestsTrendPoint,
} from "@/types/systemTests";

const WEIGHT = { critical: 100, warning: 50, info: 10 } as const;

/** Local thresholds — adjust as product learns. */
const PASS_RATE_DROP_CRITICAL = 0.08;
const PASS_RATE_DROP_WARNING = 0.04;
const NEW_REGRESSIONS_CRITICAL = 5;
const NEW_REGRESSIONS_WARNING = 2;
const DURATION_SPIKE_RATIO_CRITICAL = 1.55;
const DURATION_SPIKE_RATIO_WARNING = 1.3;
const FLAKY_FAILING_WARNING = 3;
const FLAKY_FAILING_INFO = 1;
const HIGH_PATTERN_CRITICAL = 4;
const HIGH_PATTERN_WARNING = 2;
const RESOLVED_INFO_THRESHOLD = 3;

export type DashboardAlertInput = {
  trendPoints: SystemTestsTrendPoint[];
  trendInsights: SystemTestsTrendInsights | null;
  summary: SystemTestsSummaryResponse | null;
  flakyCases: SystemTestsFlakyCaseRow[];
  patterns: SystemTestsFailurePattern[];
  historical: SystemTestsHistoricalChanges | null;
};

function mk(
  partial: Omit<SystemTestsAlert, "weight" | "impactScore"> & {
    level: SystemTestsAlert["level"];
    impactScore?: number;
  },
): SystemTestsAlert {
  const w = WEIGHT[partial.level];
  return {
    ...partial,
    weight: w,
    impactScore: partial.impactScore ?? 0,
  };
}

export function buildDashboardAlerts(input: DashboardAlertInput): SystemTestsAlert[] {
  const alerts: SystemTestsAlert[] = [];
  const { trendPoints, trendInsights, summary, flakyCases, patterns, historical } = input;

  if (trendInsights?.passRateDelta != null) {
    const d = trendInsights.passRateDelta;
    const pts = Math.abs(d) * 100;
    if (d <= -PASS_RATE_DROP_CRITICAL) {
      alerts.push(
        mk({
          id: "pass-rate-drop-crit",
          level: "critical",
          title: "Sharp pass-rate regression",
          message: `Latest pass rate is ${pts.toFixed(1)} percentage points below the previous run.`,
          operatorSummary:
            "Significant regression detected — investigate new failures introduced in the latest run before shipping.",
          recommendedAction:
            "Triage new regressions vs prior run, then open compare with last green run if available.",
          impactScore: 40 + Math.round(pts * 2),
        }),
      );
    } else if (d <= -PASS_RATE_DROP_WARNING) {
      alerts.push(
        mk({
          id: "pass-rate-drop-warn",
          level: "warning",
          title: "Pass rate slipped",
          message: `Down ${pts.toFixed(1)} points vs the prior run — confirm whether this is expected.`,
          operatorSummary: "Quality bar moved — latest run is materially worse than the one before it.",
          recommendedAction: "Scan failure patterns and flaky table; verify environment or data drift.",
          impactScore: 18 + Math.round(pts),
        }),
      );
    }
  }

  const newReg = historical?.newRegressions.length ?? 0;
  if (newReg >= NEW_REGRESSIONS_CRITICAL) {
    alerts.push(
      mk({
        id: "new-reg-crit",
        level: "critical",
        title: "Burst of new regressions",
        message: `${newReg} case(s) passed on the previous run but fail now — suite integrity is at risk.`,
        operatorSummary:
          "Many tests that were green are now red; this usually means a shared break or bad deploy.",
        recommendedAction:
          "Group by failure pattern, fix the highest-count root cause first, then re-run.",
        impactScore: 45 + newReg * 8,
      }),
    );
  } else if (newReg >= NEW_REGRESSIONS_WARNING) {
    alerts.push(
      mk({
        id: "new-reg-warn",
        level: "warning",
        title: "New regressions surfaced",
        message: `${newReg} case(s) newly failing compared to the prior run.`,
        operatorSummary: "Fresh breakages appeared since the last run — isolate before they spread.",
        recommendedAction: "Open historical “new regressions” and cross-check with recent commits.",
        impactScore: 22 + newReg * 10,
      }),
    );
  }

  if (trendInsights?.durationDeltaMs != null && trendPoints.length >= 2) {
    const sorted = [...trendPoints].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const latest = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    if (
      latest.durationMs != null &&
      prev.durationMs != null &&
      prev.durationMs > 0 &&
      trendInsights.durationDeltaMs > 0
    ) {
      const ratio = latest.durationMs / prev.durationMs;
      if (ratio >= DURATION_SPIKE_RATIO_CRITICAL) {
        alerts.push(
          mk({
            id: "duration-spike-crit",
            level: "critical",
            title: "Suite runtime jumped",
            message: `Latest run took ~${(ratio * 100).toFixed(0)}% of the previous duration.`,
            operatorSummary:
              "End-to-end runtime spiked — parallelism, infra, or a hung step may be dragging the pipeline.",
            recommendedAction: "Check slow cases, CI resources, and new heavy specs; compare durations in run detail.",
            impactScore: 35 + Math.round((ratio - 1) * 40),
          }),
        );
      } else if (ratio >= DURATION_SPIKE_RATIO_WARNING) {
        alerts.push(
          mk({
            id: "duration-spike-warn",
            level: "warning",
            title: "Suite slower than last run",
            message: "Wall-clock increased enough to notice — worth a quick scan.",
            operatorSummary: "Feedback loop is longer; flakiness often rises when tests run hot.",
            recommendedAction: "Review duration regressions in historical changes and trim long waits.",
            impactScore: 15 + Math.round((ratio - 1) * 25),
          }),
        );
      }
    }
  }

  const flakyFailing = flakyCases.filter((r) => r.isCurrentlyFailing).length;
  if (flakyFailing >= FLAKY_FAILING_WARNING) {
    alerts.push(
      mk({
        id: "flaky-failing-warn",
        level: "warning",
        title: "Multiple unstable cases failing",
        message: `${flakyFailing} historically noisy case(s) are red on the latest run.`,
        operatorSummary:
          "Flaky tests failing together erode trust — easy to misread as product regressions.",
        recommendedAction: "Quarantine or fix the top flaky scores; avoid merging on a red flaky cluster.",
        impactScore: 28 + flakyFailing * 6,
      }),
    );
  } else if (flakyFailing >= FLAKY_FAILING_INFO) {
    alerts.push(
      mk({
        id: "flaky-failing-info",
        level: "info",
        title: "Flaky case is failing",
        message: "At least one historically unstable case is failing on the latest run.",
        operatorSummary: "A known-unstable test is red — confirm against solid failures before chasing code bugs.",
        recommendedAction: "Re-run once; if it persists, treat as hard failure until stabilized.",
        impactScore: 8,
      }),
    );
  }

  const highSev = patterns.filter((p) => p.severity === "high");
  if (highSev.length >= HIGH_PATTERN_CRITICAL) {
    alerts.push(
      mk({
        id: "pattern-repeat-crit",
        level: "critical",
        title: "Systemic failure signatures",
        message: `${highSev.length} high-severity error clusters repeat across recent runs.`,
        operatorSummary:
          "The same classes of errors fire often — likely one platform or dependency issue, not random noise.",
        recommendedAction: "Pick the top pattern by hit count and fix root cause before individual tests.",
        impactScore: 42 + highSev.length * 12,
      }),
    );
  } else if (highSev.length >= HIGH_PATTERN_WARNING) {
    alerts.push(
      mk({
        id: "pattern-repeat-warn",
        level: "warning",
        title: "Recurring strong patterns",
        message: `${highSev.length} strong pattern(s) show up across failures — watch for coupling.`,
        operatorSummary: "Failures are clustering; a few fixes may clear many cases.",
        recommendedAction: "Read failure patterns panel and align owners on the dominant category.",
        impactScore: 20 + highSev.length * 10,
      }),
    );
  }

  const resolved = historical?.resolvedFailures.length ?? 0;
  if (resolved >= RESOLVED_INFO_THRESHOLD) {
    alerts.push(
      mk({
        id: "recovery-signal",
        level: "info",
        title: "Green shoots",
        message: `${resolved} case(s) that failed on the previous run now pass.`,
        operatorSummary: "Recent fixes are landing — momentum is positive if the latest run is still acceptable.",
        recommendedAction: "Lock in fixes with a follow-up run; don’t revert stabilizing changes lightly.",
        impactScore: 5 + Math.min(resolved, 12),
      }),
    );
  }

  if (summary?.latestRun && summary.latestFailedCount === 0 && trendInsights?.latestStatus?.toLowerCase() === "passed") {
    const recentFail = trendPoints.slice(-4).some((p) => p.failedCount > 0);
    if (recentFail) {
      alerts.push(
        mk({
          id: "clean-latest",
          level: "info",
          title: "Latest run is clean",
          message: "Zero failures on the newest run after earlier noise.",
          operatorSummary: "You may be past the incident window — good moment to snapshot and protect the branch.",
          recommendedAction: "Tag or merge if policy allows; keep monitoring the next scheduled run.",
          impactScore: 6,
        }),
      );
    }
  }

  alerts.sort((a, b) => b.weight + b.impactScore - (a.weight + a.impactScore));

  return alerts;
}
