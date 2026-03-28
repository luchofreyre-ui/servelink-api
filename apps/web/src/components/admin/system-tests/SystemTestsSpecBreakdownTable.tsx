"use client";

import type { SystemTestSpecBreakdownRow } from "@/types/systemTests";
import { formatPercent } from "./systemTestsFormatting";

type Props = {
  rows: SystemTestSpecBreakdownRow[];
};

export function SystemTestsSpecBreakdownTable(props: Props) {
  const { rows } = props;

  if (!rows.length) {
    return <p className="text-sm text-white/50">No per-file breakdown.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-sm text-white/90">
        <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wide text-white/50">
          <tr>
            <th className="px-4 py-3">File</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Passed</th>
            <th className="px-4 py-3">Failed</th>
            <th className="px-4 py-3">Skipped</th>
            <th className="px-4 py-3">Pass rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.file} className="border-b border-white/5">
              <td className="max-w-[420px] truncate px-4 py-2 font-mono text-xs" title={r.file}>
                {r.file}
              </td>
              <td className="px-4 py-2">{r.totalCount}</td>
              <td className="px-4 py-2 text-emerald-200/90">{r.passedCount}</td>
              <td className="px-4 py-2 text-red-200/85">{r.failedCount}</td>
              <td className="px-4 py-2">{r.skippedCount}</td>
              <td className="px-4 py-2">{formatPercent(r.passRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
