"use client";

import type { SystemTestsFlakyCaseRow } from "@/types/systemTests";
import { SystemTestsBadge } from "./SystemTestsBadge";

type Props = {
  rows: SystemTestsFlakyCaseRow[];
  loading?: boolean;
  /** Explains trusted vs blended window. */
  scopeNote?: string;
  /** Overrides default empty copy (trusted-only intelligence). */
  emptyHint?: string;
};

export function SystemTestsFlakyCasesTable(props: Props) {
  const { rows, loading, scopeNote, emptyHint } = props;
  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/55">
        Loading flaky analysis…
      </section>
    );
  }
  if (!rows.length) {
    return (
      <section className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-6 text-center text-sm text-white/50">
        {emptyHint ?? "No trusted instability detected in the current analysis window."}
      </section>
    );
  }

  const top = rows.slice(0, 25);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Flaky signals</h2>
      <p className="text-sm text-white/55">
        Ranked from recent runs — transitions and mixed pass/fail history drive the score.
      </p>
      {scopeNote ? (
        <p className="text-xs text-sky-200/80">{scopeNote}</p>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm text-white/90">
          <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wide text-white/50">
            <tr>
              <th className="px-3 py-3">Case</th>
              <th className="px-3 py-3">Latest</th>
              <th className="px-3 py-3">Prev</th>
              <th className="px-3 py-3 text-right">Δ states</th>
              <th className="px-3 py-3 text-right">Pass</th>
              <th className="px-3 py-3 text-right">Fail</th>
              <th className="px-3 py-3 text-right">Score</th>
              <th className="px-3 py-3">Tag</th>
            </tr>
          </thead>
          <tbody>
            {top.map((r) => (
              <tr key={r.caseKey} className="border-b border-white/5">
                <td className="max-w-[220px] px-3 py-2">
                  <p className="truncate font-medium text-white" title={r.title}>
                    {r.title || "—"}
                  </p>
                  <p className="truncate font-mono text-[11px] text-white/45" title={r.file}>
                    {r.file}
                  </p>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs">{r.latestStatus}</td>
                <td className="whitespace-nowrap px-3 py-2 text-xs">{r.previousStatus ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.transitionCount}</td>
                <td className="px-3 py-2 text-right tabular-nums text-emerald-200/85">{r.passCount}</td>
                <td className="px-3 py-2 text-right tabular-nums text-red-200/80">{r.failCount}</td>
                <td className="px-3 py-2 text-right tabular-nums text-white/90">
                  {r.flakyScore.toFixed(1)}
                </td>
                <td className="px-3 py-2">
                  {r.isCurrentlyFailing ? (
                    <SystemTestsBadge variant="critical">failing</SystemTestsBadge>
                  ) : (
                    <SystemTestsBadge variant="flaky">flaky</SystemTestsBadge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
