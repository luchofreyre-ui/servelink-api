"use client";

import type { ReactNode } from "react";
import type { SystemTestRunComparison } from "@/types/systemTests";

type Props = {
  comparison: SystemTestRunComparison;
};

function Card(props: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/50">{props.label}</p>
      <div className="mt-2 text-lg font-semibold text-white">{props.children}</div>
    </div>
  );
}

function fmtSigned(n: number, suffix = ""): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}${suffix}`;
}

export function SystemTestsComparisonSummaryCards(props: Props) {
  const { comparison: c } = props;
  const pr = c.passRateDelta * 100;
  const prSign = pr > 0 ? "+" : "";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card label="Pass rate delta">
        {prSign}
        {pr.toFixed(2)} pts
      </Card>
      <Card label="Failed count delta">{fmtSigned(c.failedDelta)}</Card>
      <Card label="Duration delta">
        {c.durationDeltaMs == null ? "—" : fmtSigned(c.durationDeltaMs, " ms")}
      </Card>
      <Card label="New failure groups">
        <span className="text-red-200/90">{c.newFailures.length}</span>
      </Card>
      <Card label="Resolved failure groups">
        <span className="text-emerald-200/90">{c.resolvedFailures.length}</span>
      </Card>
      <Card label="Persistent failure groups">
        <span className="text-amber-100/90">{c.persistentFailures.length}</span>
      </Card>
    </div>
  );
}
