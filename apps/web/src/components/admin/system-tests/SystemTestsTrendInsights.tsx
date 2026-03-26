"use client";

import type { SystemTestsTrendInsights as Insights } from "@/types/systemTests";
import { formatDurationMs } from "./systemTestsFormatting";

type Props = {
  insights: Insights | null;
};

function fmtPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function deltaClass(
  value: number | null,
  kind: "passRate" | "failed" | "flaky" | "duration",
): string {
  if (value == null || Number.isNaN(value)) return "text-white/50";
  if (kind === "passRate") {
    if (value > 0) return "text-emerald-300";
    if (value < 0) return "text-red-300";
    return "text-white/60";
  }
  if (kind === "failed" || kind === "flaky") {
    if (value < 0) return "text-emerald-300";
    if (value > 0) return "text-red-300";
    return "text-white/60";
  }
  if (kind === "duration") {
    if (value < 0) return "text-emerald-300";
    if (value > 0) return "text-amber-200/90";
    return "text-white/60";
  }
  return "text-white/60";
}

function fmtSigned(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n > 0 ? "+" : ""}${n}`;
}

export function SystemTestsTrendInsightsPanel(props: Props) {
  const { insights } = props;
  if (!insights) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-sm text-white/50">
        No trend insights yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-wide text-white/45">Latest status</p>
        <p className="mt-2 text-lg font-semibold text-white">{insights.latestStatus}</p>
        <p className="mt-1 text-xs text-white/45">
          Latest pass rate {fmtPct(insights.latestPassRate)}
          {insights.previousPassRate != null ? (
            <> · prev {fmtPct(insights.previousPassRate)}</>
          ) : null}
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-wide text-white/45">Pass rate Δ</p>
        <p className={`mt-2 text-lg font-semibold ${deltaClass(insights.passRateDelta, "passRate")}`}>
          {insights.passRateDelta != null ? fmtPct(insights.passRateDelta) : "—"}
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-wide text-white/45">Failed Δ</p>
        <p className={`mt-2 text-lg font-semibold ${deltaClass(insights.failedDelta, "failed")}`}>
          {fmtSigned(insights.failedDelta)}
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-wide text-white/45">Flaky Δ</p>
        <p className={`mt-2 text-lg font-semibold ${deltaClass(insights.flakyDelta, "flaky")}`}>
          {fmtSigned(insights.flakyDelta)}
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-wide text-white/45">Duration Δ</p>
        <p className={`mt-2 text-lg font-semibold ${deltaClass(insights.durationDeltaMs, "duration")}`}>
          {insights.durationDeltaMs != null ? formatDurationMs(insights.durationDeltaMs) : "—"}
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-wide text-white/45">Streak</p>
        <p className="mt-2 text-sm font-medium text-sky-200/90">{insights.streakLabel}</p>
      </div>
    </div>
  );
}
