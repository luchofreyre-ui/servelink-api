"use client";

import type { SystemTestTrendPoint } from "@/types/systemTests";
import { formatDurationMs, formatPercent } from "./systemTestsFormatting";

type Props = {
  points: SystemTestTrendPoint[];
  /** Newest run id (rightmost). */
  currentRunId: string | null;
  /** The run immediately older than current (for highlight). */
  previousRunId: string | null;
};

export function SystemTestsTrendStrip(props: Props) {
  const { points, currentRunId, previousRunId } = props;

  if (!points.length) {
    return null;
  }

  const maxFailed = Math.max(1, ...points.map((p) => p.failedCount));
  const maxDur = Math.max(1, ...points.map((p) => p.durationMs ?? 0));

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Recent runs</h2>
      <p className="text-xs text-white/50">
        Last {points.length} runs (oldest → newest). Highlights: current vs previous.
      </p>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex min-w-max gap-1 px-2 py-3">
          {points.map((p) => {
            const isCurrent = currentRunId && p.runId === currentRunId;
            const isPrev = previousRunId && p.runId === previousRunId;
            const failedH = Math.round((p.failedCount / maxFailed) * 100);
            const passW = Math.round(p.passRate * 100);
            const durH = p.durationMs != null ? Math.round(((p.durationMs as number) / maxDur) * 100) : 0;
            return (
              <div
                key={p.runId}
                title={`${p.runId} · ${p.createdAt}`}
                className={`flex w-10 flex-col items-center gap-1 ${
                  isCurrent
                    ? "ring-2 ring-violet-400/80 ring-offset-2 ring-offset-neutral-950"
                    : isPrev
                      ? "ring-1 ring-sky-400/60 ring-offset-1 ring-offset-neutral-950"
                      : ""
                }`}
              >
                <div className="flex h-16 w-full flex-col justify-end gap-px rounded-md bg-black/30 p-0.5">
                  <div
                    className="w-full rounded-sm bg-emerald-500/55"
                    style={{ height: `${passW}%`, minHeight: 2 }}
                    title={`Pass rate ${formatPercent(p.passRate)}`}
                  />
                  <div
                    className="w-full rounded-sm bg-red-500/55"
                    style={{ height: `${failedH}%`, minHeight: 2 }}
                    title={`Failed ${p.failedCount}`}
                  />
                  <div
                    className="w-full rounded-sm bg-white/15"
                    style={{ height: `${durH}%`, minHeight: 2 }}
                    title={`Duration ${formatDurationMs(p.durationMs)}`}
                  />
                </div>
                <span className="max-w-[40px] truncate font-mono text-[9px] text-white/40">
                  {p.runId.slice(0, 6)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-white/50">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-emerald-500/55" /> Pass rate
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-red-500/55" /> Failed count
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-white/15" /> Duration
        </span>
        <span className="text-violet-300">Violet ring: current run</span>
        <span className="text-sky-300">Sky ring: previous run</span>
      </div>
    </section>
  );
}
