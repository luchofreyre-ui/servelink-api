"use client";

import type { ReactNode } from "react";
import type { SystemTestRunSummary, SystemTestRunTrendVsPrevious } from "@/types/systemTests";
import { formatDurationMs, formatPercent, statusPillClass } from "./systemTestsFormatting";

type Props = {
  summary: SystemTestRunSummary | null;
  trendVsPrevious: SystemTestRunTrendVsPrevious;
};

function Card(props: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/50">{props.label}</p>
      <div className="mt-2">{props.children}</div>
    </div>
  );
}

function fmtDeltaSigned(n: number | null, suffix = ""): string {
  if (n === null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}${suffix}`;
}

function fmtPctDelta(delta: number | null): string {
  if (delta === null || Number.isNaN(delta)) return "—";
  const pct = delta * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function SystemTestsSummaryCards(props: Props) {
  const { summary, trendVsPrevious } = props;

  if (!summary) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card label="Status">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${statusPillClass(summary.status)}`}
        >
          {summary.status}
        </span>
      </Card>
      <Card label="Pass rate">
        <p className="text-2xl font-semibold text-white">{formatPercent(summary.passRate)}</p>
        <p className="mt-1 text-xs text-white/45">vs previous: {fmtPctDelta(trendVsPrevious.passRateDelta)}</p>
      </Card>
      <Card label="Failed tests">
        <p className="text-2xl font-semibold text-red-200/90">{summary.failedCount}</p>
        <p className="mt-1 text-xs text-white/45">vs previous: {fmtDeltaSigned(trendVsPrevious.failedDelta)}</p>
      </Card>
      <Card label="Duration">
        <p className="text-2xl font-semibold text-white">{formatDurationMs(summary.durationMs)}</p>
        <p className="mt-1 text-xs text-white/45">vs previous: {fmtDeltaSigned(trendVsPrevious.durationDeltaMs, " ms")}</p>
      </Card>
    </div>
  );
}
