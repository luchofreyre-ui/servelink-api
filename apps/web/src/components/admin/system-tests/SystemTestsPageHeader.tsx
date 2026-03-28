"use client";

import type { SystemTestRunSummary } from "@/types/systemTests";
import { formatDateTime, formatDurationMs, formatPercent, statusPillClass } from "./systemTestsFormatting";

type Props = {
  title?: string;
  subtitle?: string;
  summary: SystemTestRunSummary | null;
};

export function SystemTestsPageHeader(props: Props) {
  const { title = "System tests", subtitle, summary } = props;

  return (
    <header className="space-y-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-3xl text-sm text-white/65">{subtitle}</p> : null}
      </div>

      {summary ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2 text-sm text-white/80">
              <p>
                <span className="text-white/50">Run ID</span>{" "}
                <span className="font-mono text-white">{summary.id}</span>
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
                <span title={summary.branch ?? ""}>
                  Branch: <span className="text-white/80">{summary.branch ?? "—"}</span>
                </span>
                <span title={summary.commitSha ?? ""} className="font-mono">
                  Commit: <span className="text-white/80">{summary.commitSha ?? "—"}</span>
                </span>
                <span>
                  Created: <span className="text-white/80">{formatDateTime(summary.createdAt)}</span>
                </span>
                <span>
                  Duration: <span className="text-white/80">{formatDurationMs(summary.durationMs)}</span>
                </span>
              </div>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusPillClass(summary.status)}`}
            >
              {summary.status}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                ["Total", String(summary.totalCount)],
                ["Passed", String(summary.passedCount)],
                ["Failed", String(summary.failedCount)],
                ["Skipped", String(summary.skippedCount)],
                ["Pass rate", formatPercent(summary.passRate)],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{label}</p>
                <p className="mt-0.5 text-lg font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
