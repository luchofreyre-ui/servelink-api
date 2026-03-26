"use client";

import type { SystemTestsCompareResult } from "@/types/systemTests";
import { formatDateTime, formatDurationMs } from "./systemTestsFormatting";

type Props = {
  compare: SystemTestsCompareResult;
};

function runPassRate(r: SystemTestsCompareResult["baseRun"]): number {
  return r.totalCount > 0 ? r.passedCount / r.totalCount : 0;
}

function deltaTone(
  v: number | null,
  kind: "passRate" | "failed" | "flaky" | "duration",
): string {
  if (v == null || Number.isNaN(v)) return "text-white/55";
  if (kind === "passRate") {
    if (v > 0) return "text-emerald-300";
    if (v < 0) return "text-red-300";
    return "text-white/60";
  }
  if (kind === "failed" || kind === "flaky") {
    if (v < 0) return "text-emerald-300";
    if (v > 0) return "text-red-300";
    return "text-white/60";
  }
  if (kind === "duration") {
    if (v < 0) return "text-emerald-300";
    if (v > 0) return "text-amber-200/90";
    return "text-white/60";
  }
  return "text-white/60";
}

function fmtSigned(n: number): string {
  return `${n > 0 ? "+" : ""}${n}`;
}

export function SystemTestsCompareSummary(props: Props) {
  const { compare } = props;
  const { baseRun, targetRun, delta } = compare;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wide text-white/45">Base run</p>
          <p className="mt-1 font-mono text-sm text-white/70">{baseRun.id}</p>
          <p className="mt-2 text-xs text-white/50">{formatDateTime(baseRun.createdAt)}</p>
          <p className="mt-1 text-xs text-white/50">{baseRun.source}</p>
          <p className="mt-1 text-xs text-white/50">{baseRun.branch ?? "—"}</p>
          <p className="mt-1 font-mono text-xs text-white/50">
            {baseRun.commitSha ?? "—"}
          </p>
          <p className="mt-2 text-sm text-white">status {baseRun.status}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wide text-white/45">Target run</p>
          <p className="mt-1 font-mono text-sm text-white/70">{targetRun.id}</p>
          <p className="mt-2 text-xs text-white/50">{formatDateTime(targetRun.createdAt)}</p>
          <p className="mt-1 text-xs text-white/50">{targetRun.source}</p>
          <p className="mt-1 text-xs text-white/50">{targetRun.branch ?? "—"}</p>
          <p className="mt-1 font-mono text-xs text-white/50">
            {targetRun.commitSha ?? "—"}
          </p>
          <p className="mt-2 text-sm text-white">status {targetRun.status}</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-white">Deltas (target − base)</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-white/45">Total</p>
            <p className={`text-lg font-semibold ${deltaTone(delta.totalDelta, "failed")}`}>
              {fmtSigned(delta.totalDelta)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-white/45">Passed</p>
            <p className={`text-lg font-semibold ${delta.passedDelta >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {fmtSigned(delta.passedDelta)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-white/45">Failed</p>
            <p className={`text-lg font-semibold ${deltaTone(delta.failedDelta, "failed")}`}>
              {fmtSigned(delta.failedDelta)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-white/45">Skipped</p>
            <p className="text-lg font-semibold text-white/80">{fmtSigned(delta.skippedDelta)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-white/45">Flaky</p>
            <p className={`text-lg font-semibold ${deltaTone(delta.flakyDelta, "flaky")}`}>
              {fmtSigned(delta.flakyDelta)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-white/45">Duration</p>
            <p className={`text-lg font-semibold ${deltaTone(delta.durationDeltaMs, "duration")}`}>
              {delta.durationDeltaMs != null ? formatDurationMs(delta.durationDeltaMs) : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-white/45">Pass rate</p>
            <p className={`text-lg font-semibold ${deltaTone(delta.passRateDelta ?? null, "passRate")}`}>
              {delta.passRateDelta != null ? `${(delta.passRateDelta * 100).toFixed(1)} pp` : "—"}
            </p>
            <p className="mt-1 text-[10px] text-white/35">
              base {(runPassRate(baseRun) * 100).toFixed(1)}% → target{" "}
              {(runPassRate(targetRun) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
