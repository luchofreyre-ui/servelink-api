"use client";

import Link from "next/link";
import { useCallback } from "react";
import { buildSystemTestReportFromPayload } from "@/lib/systemTests/buildSystemTestReport";
import { buildSystemTestReportPayload } from "@/lib/systemTests/buildSystemTestReportPayload";
import { normalizeRunSummaryFromListItem } from "@/lib/systemTests/normalizeSystemTestRun";
import { fetchAdminSystemTestRunDetail } from "@/lib/api/systemTests";
import type { SystemTestRunsListItem } from "@/types/systemTests";
import {
  formatDateTime,
  formatDurationMs,
  formatPercent,
  formatRelativeTime,
  statusPillClass,
} from "./systemTestsFormatting";
import { SystemTestsCopyReportButton } from "./SystemTestsCopyReportButton";

type Props = {
  runs: SystemTestRunsListItem[];
  /** Newest-first list (caller sorted). */
  latestRunId: string | null;
  accessToken: string;
};

function passRate(run: SystemTestRunsListItem): number {
  return run.totalCount > 0 ? run.passedCount / run.totalCount : 0;
}

export function SystemTestsRunsTable(props: Props) {
  const { runs, latestRunId, accessToken } = props;
  const latestId = latestRunId ?? runs[0]?.id ?? null;

  const makeReportGetter = useCallback(
    (runId: string) => async () => {
      const detail = await fetchAdminSystemTestRunDetail(accessToken, runId);
      const idx = runs.findIndex((r) => r.id === runId);
      const older = idx >= 0 && idx < runs.length - 1 ? runs[idx + 1] : null;
      const prevSummary = older ? normalizeRunSummaryFromListItem(older) : null;
      const payload = buildSystemTestReportPayload({
        currentDetailResponse: detail,
        previousRunSummary: prevSummary,
      });
      return buildSystemTestReportFromPayload(payload);
    },
    [accessToken, runs],
  );

  if (!runs.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <p className="text-center text-sm font-medium text-white/80">No system test runs recorded yet</p>
        <p className="mt-2 text-center text-sm text-white/50">
          Ingest runs via CI uploader to populate this dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-sm text-white/90">
        <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wide text-white/50">
          <tr>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Started</th>
            <th className="px-4 py-3">Duration</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Passed</th>
            <th className="px-4 py-3">Failed</th>
            <th className="px-4 py-3">Skipped</th>
            <th className="px-4 py-3">Pass rate</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => {
            const st = r.status.toLowerCase();
            const failed = st === "failed";
            const passed = st === "passed";
            const pill = failed
              ? "bg-red-500/25 text-red-100 ring-red-500/40"
              : passed
                ? "bg-emerald-500/20 text-emerald-100 ring-emerald-500/35"
                : statusPillClass(r.status);
            const pr = passRate(r);
            return (
              <tr key={r.id} className="border-b border-white/5">
                <td className="px-4 py-2">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${pill}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap" title={formatDateTime(r.createdAt)}>
                  <span className="text-white/90">{formatRelativeTime(r.createdAt)}</span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">{formatDurationMs(r.durationMs)}</td>
                <td className="px-4 py-2">{r.totalCount}</td>
                <td className="px-4 py-2 text-emerald-200/90">{r.passedCount}</td>
                <td className="px-4 py-2 text-red-200/85">{r.failedCount}</td>
                <td className="px-4 py-2">{r.skippedCount}</td>
                <td className="px-4 py-2">{formatPercent(pr)}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end sm:gap-3">
                    <Link href={`/admin/system-tests/${r.id}`} className="font-medium text-sky-300 hover:text-sky-200">
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
                    <div className="inline-flex max-w-[140px] justify-end">
                      <SystemTestsCopyReportButton
                        label="Copy report"
                        getReportText={makeReportGetter(r.id)}
                        className="!space-y-0"
                      />
                    </div>
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
