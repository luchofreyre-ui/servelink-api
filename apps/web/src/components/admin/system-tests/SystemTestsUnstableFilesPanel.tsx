"use client";

import type { SystemTestFileHistoryProfile } from "@/types/systemTests";

type Props = {
  files: SystemTestFileHistoryProfile[];
  loading?: boolean;
  maxRows?: number;
};

function trendLabel(t: SystemTestFileHistoryProfile["trend"]): string {
  return t;
}

export function SystemTestsUnstableFilesPanel(props: Props) {
  const { files, loading, maxRows = 12 } = props;

  const ranked = [...files].sort((a, b) => {
    if (b.instabilityScore !== a.instabilityScore) return b.instabilityScore - a.instabilityScore;
    if (b.failedInPriorRuns !== a.failedInPriorRuns) return b.failedInPriorRuns - a.failedInPriorRuns;
    return a.file.localeCompare(b.file);
  });

  const visible = ranked.filter((f) => f.failedInPriorRuns > 0 || f.instabilityScore > 0).slice(0, maxRows);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Top unstable files</h2>
      <p className="text-xs text-white/45">From prior window only; higher instability score = more historical failure churn.</p>
      {loading ? (
        <p className="text-sm text-white/55">Loading file history…</p>
      ) : !visible.length ? (
        <p className="text-sm text-white/55">No unstable file signal in the loaded prior window.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm text-white/90">
            <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase text-white/50">
              <tr>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Failed in priors</th>
                <th className="px-4 py-3">Avg failed</th>
                <th className="px-4 py-3">Worst</th>
                <th className="px-4 py-3">Instability</th>
                <th className="px-4 py-3">Trend</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((f) => (
                <tr key={f.file} className="border-b border-white/5">
                  <td className="max-w-[320px] truncate px-4 py-2 font-mono text-xs" title={f.file}>
                    {f.file}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {f.failedInPriorRuns}/{f.historyWindowSize}
                  </td>
                  <td className="px-4 py-2">{f.averageFailedCount.toFixed(2)}</td>
                  <td className="px-4 py-2">{f.worstFailedCount}</td>
                  <td className="px-4 py-2 font-medium text-amber-100/90">{f.instabilityScore}</td>
                  <td className="px-4 py-2 text-xs capitalize text-white/70">{trendLabel(f.trend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
