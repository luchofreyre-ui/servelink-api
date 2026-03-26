"use client";

import Link from "next/link";
import type { SystemTestsRunsResponse } from "@/types/systemTests";
import {
  formatDateTime,
  formatDurationMs,
  formatRelativeTime,
  statusPillClass,
  truncateSha,
} from "./systemTestsFormatting";

type Props = {
  runs: SystemTestsRunsResponse;
  /** Newest run id (items[0] when API returns desc). Used for Compare to latest. */
  latestRunId?: string;
};

export function SystemTestsRunsTable(props: Props) {
  const { items } = props.runs;
  const latestId = props.latestRunId ?? items[0]?.id;

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <p className="text-center text-sm font-medium text-white/80">No run history yet</p>
        <p className="mt-2 text-center text-sm text-white/50">
          Once GitHub Actions uploads hosted Playwright results, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-sm text-white/90">
        <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wide text-white/50">
          <tr>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Branch</th>
            <th className="px-4 py-3">Commit</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Passed</th>
            <th className="px-4 py-3">Failed</th>
            <th className="px-4 py-3">Flaky</th>
            <th className="px-4 py-3">Duration</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => {
            const st = r.status.toLowerCase();
            const failed = st === "failed";
            const passed = st === "passed";
            const pill = failed
              ? "bg-red-500/25 text-red-100 ring-red-500/40"
              : passed
                ? "bg-emerald-500/20 text-emerald-100 ring-emerald-500/35"
                : statusPillClass(r.status);
            return (
              <tr key={r.id} className="border-b border-white/5">
                <td
                  className="px-4 py-2 whitespace-nowrap"
                  title={formatDateTime(r.createdAt)}
                >
                  <span className="text-white/90">{formatRelativeTime(r.createdAt)}</span>
                </td>
                <td className="px-4 py-2">{r.source}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.branch ?? "—"}</td>
                <td
                  className="max-w-[120px] truncate px-4 py-2 font-mono text-xs"
                  title={r.commitSha ?? ""}
                >
                  {truncateSha(r.commitSha, 8)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${pill}`}
                  >
                    {r.status}
                  </span>
                  {r.flakyCount > 0 ? (
                    <span className="ml-2 inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-100 ring-1 ring-amber-500/30">
                      flaky {r.flakyCount}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2 text-emerald-200/90">{r.passedCount}</td>
                <td className="px-4 py-2 text-red-200/85">{r.failedCount}</td>
                <td className="px-4 py-2 text-amber-200/85">{r.flakyCount}</td>
                <td className="px-4 py-2 whitespace-nowrap">{formatDurationMs(r.durationMs)}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-3">
                    <Link
                      href={`/admin/system-tests/${r.id}`}
                      className="font-medium text-sky-300 hover:text-sky-200"
                    >
                      View run
                    </Link>
                    {latestId && r.id !== latestId ? (
                      <Link
                        href={`/admin/system-tests/compare?baseRunId=${encodeURIComponent(r.id)}&targetRunId=${encodeURIComponent(latestId)}`}
                        className="text-xs font-medium text-violet-300 hover:text-violet-200"
                      >
                        Compare to latest
                      </Link>
                    ) : (
                      <span className="text-xs text-white/25" title="This row is the latest run">
                        —
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
