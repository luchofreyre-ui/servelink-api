"use client";

import type { SystemTestFileHealthComparisonRow } from "@/types/systemTests";
import { formatPercent } from "./systemTestsFormatting";

type Props = {
  rows: SystemTestFileHealthComparisonRow[];
};

function trendBadge(trend: SystemTestFileHealthComparisonRow["trend"]): string {
  switch (trend) {
    case "regressed":
      return "bg-red-500/20 text-red-100 ring-red-500/35";
    case "improved":
      return "bg-emerald-500/20 text-emerald-100 ring-emerald-500/35";
    default:
      return "bg-white/10 text-white/75 ring-white/20";
  }
}

export function SystemTestsFileHealthComparisonTable(props: Props) {
  const { rows } = props;

  if (!rows.length) {
    return <p className="text-sm text-white/55">No per-file data.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-sm text-white/90">
        <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wide text-white/50">
          <tr>
            <th className="px-4 py-3">File</th>
            <th className="px-4 py-3">Base failed / total</th>
            <th className="px-4 py-3">Target failed / total</th>
            <th className="px-4 py-3">Base pass rate</th>
            <th className="px-4 py-3">Target pass rate</th>
            <th className="px-4 py-3">Failed Δ</th>
            <th className="px-4 py-3">Pass rate Δ</th>
            <th className="px-4 py-3">Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.file} className="border-b border-white/5">
              <td className="max-w-[280px] truncate px-4 py-2 font-mono text-xs" title={r.file}>
                {r.file}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {r.baseFailedCount} / {r.baseTotalCount}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {r.targetFailedCount} / {r.targetTotalCount}
              </td>
              <td className="px-4 py-2">{formatPercent(r.basePassRate)}</td>
              <td className="px-4 py-2">{formatPercent(r.targetPassRate)}</td>
              <td className="px-4 py-2">
                {r.failedDelta > 0 ? "+" : ""}
                {r.failedDelta}
              </td>
              <td className="px-4 py-2">
                {(r.passRateDelta * 100).toFixed(2)} pts
              </td>
              <td className="px-4 py-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${trendBadge(r.trend)}`}
                >
                  {r.trend}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
