"use client";

import type { SystemTestRunComparison } from "@/types/systemTests";
import { formatDateTime, formatDurationMs, statusPillClass } from "./systemTestsFormatting";

type Props = {
  comparison: SystemTestRunComparison;
};

function headlineBadgeClass(headline: SystemTestRunComparison["headline"]): string {
  switch (headline) {
    case "Regression detected":
      return "bg-red-500/20 text-red-100 ring-red-500/40";
    case "Improvement detected":
      return "bg-emerald-500/20 text-emerald-100 ring-emerald-500/35";
    case "Mixed change":
      return "bg-amber-500/20 text-amber-100 ring-amber-500/35";
    default:
      return "bg-white/10 text-white/80 ring-white/20";
  }
}

export function SystemTestsComparisonHeader(props: Props) {
  const { comparison } = props;
  const b = comparison.baseRun.summary;
  const t = comparison.targetRun.summary;

  return (
    <header className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Compare runs</h1>
          <p className="mt-1 text-xs text-white/50">
            Base = older reference · Target = newer run (what changed since base).
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${headlineBadgeClass(comparison.headline)}`}
        >
          {comparison.headline}
        </span>
      </div>

      {comparison.chronologyCorrected && comparison.chronologyNote ? (
        <p className="rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
          {comparison.chronologyNote}
        </p>
      ) : null}
      {comparison.chronologyWarning && comparison.chronologyNote && !comparison.chronologyCorrected ? (
        <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {comparison.chronologyNote}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Base run</p>
          <p className="mt-1 font-mono text-sm text-white">{b.id}</p>
          <p className="mt-2 text-xs text-white/55">{formatDateTime(b.createdAt)}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/55">
            <span className={`rounded-full px-2 py-0.5 ring-1 ${statusPillClass(b.status)}`}>{b.status}</span>
            <span>Duration {formatDurationMs(b.durationMs)}</span>
          </div>
          <p className="mt-2 text-xs text-white/50">
            Branch: <span className="text-white/75">{b.branch ?? "—"}</span>
          </p>
          <p className="text-xs text-white/50 font-mono">
            Commit: <span className="text-white/75">{b.commitSha ?? "—"}</span>
          </p>
        </div>
        <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-200/80">Target run</p>
          <p className="mt-1 font-mono text-sm text-white">{t.id}</p>
          <p className="mt-2 text-xs text-white/55">{formatDateTime(t.createdAt)}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/55">
            <span className={`rounded-full px-2 py-0.5 ring-1 ${statusPillClass(t.status)}`}>{t.status}</span>
            <span>Duration {formatDurationMs(t.durationMs)}</span>
          </div>
          <p className="mt-2 text-xs text-white/50">
            Branch: <span className="text-white/75">{t.branch ?? "—"}</span>
          </p>
          <p className="text-xs text-white/50 font-mono">
            Commit: <span className="text-white/75">{t.commitSha ?? "—"}</span>
          </p>
        </div>
      </div>
    </header>
  );
}
