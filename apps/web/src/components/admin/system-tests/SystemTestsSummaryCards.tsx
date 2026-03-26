"use client";

import type { ReactNode } from "react";
import type { SystemTestsSummaryResponse } from "@/types/systemTests";
import {
  formatDateTime,
  formatDurationMs,
  formatPercent,
  statusPillClass,
} from "./systemTestsFormatting";

type Props = {
  summary: SystemTestsSummaryResponse | null;
  totalRuns: number;
  /** Mean duration across loaded run rows (client-side; API has no global average). */
  averageDurationMs: number | null;
};

function Card(props: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/50">{props.label}</p>
      <div className="mt-2">{props.children}</div>
    </div>
  );
}

export function SystemTestsSummaryCards(props: Props) {
  const { summary, totalRuns, averageDurationMs } = props;
  const latest = summary?.latestRun;

  if (!summary?.latestRun && totalRuns === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center">
        <p className="text-lg font-medium text-white">No hosted system test runs yet</p>
        <p className="mt-2 text-sm text-white/55">
          Ingest runs via{" "}
          <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-emerald-100/90">
            POST /api/v1/admin/system-tests/report
          </code>{" "}
          (e.g. CI uploader) to populate this dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card label="Latest status">
        {latest ? (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${statusPillClass(latest.status)}`}
          >
            {latest.status}
          </span>
        ) : (
          <span className="text-lg font-semibold text-white">—</span>
        )}
      </Card>
      <Card label="Total runs">
        <p className="text-2xl font-semibold text-white">{totalRuns}</p>
      </Card>
      <Card label="Last run source">
        <p className="text-lg font-medium text-white">{latest?.source ?? "—"}</p>
      </Card>
      <Card label="Pass rate (latest)">
        <p className="text-2xl font-semibold text-white">{formatPercent(summary?.latestPassRate ?? null)}</p>
      </Card>
      <Card label="Failed (latest)">
        <p className="text-2xl font-semibold text-red-200/90">{summary?.latestFailedCount ?? "—"}</p>
      </Card>
      <Card label="Flaky (latest)">
        <p className="text-2xl font-semibold text-amber-200/90">{latest?.flakyCount ?? "—"}</p>
      </Card>
      <Card label="Avg duration (loaded page)">
        <p className="text-2xl font-semibold text-white">{formatDurationMs(averageDurationMs)}</p>
      </Card>
      <Card label="Latest run time">
        <p className="text-sm font-medium text-white" title={summary?.latestRunAt ?? ""}>
          {formatDateTime(summary?.latestRunAt)}
        </p>
      </Card>
    </div>
  );
}
