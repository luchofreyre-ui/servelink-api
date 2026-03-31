"use client";

import { Fragment, useMemo, useState } from "react";

import {
  appendYield,
  formatDurationMs,
  generationYield,
  type BatchReportsAggregates,
  type EncyclopediaBatchPipelineRun,
} from "@/lib/encyclopedia/batchReports.model";

function pct(n: number | null): string {
  if (n == null || !Number.isFinite(n)) {
    return "—";
  }
  return `${Math.round(n * 1000) / 10}%`;
}

function formatTs(value: string | null): string {
  if (!value) {
    return "—";
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

type FilterMode = "all" | "gap" | "expanded";
type FilterBuild = "all" | "ok" | "fail";

export function EncyclopediaBatchRunsTable(props: {
  runs: EncyclopediaBatchPipelineRun[];
  aggregates: BatchReportsAggregates;
}) {
  const [mode, setMode] = useState<FilterMode>("all");
  const [build, setBuild] = useState<FilterBuild>("all");
  const [zeroAppendOnly, setZeroAppendOnly] = useState(false);
  const [failedOnly, setFailedOnly] = useState(false);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return props.runs.filter((r) => {
      if (mode !== "all" && r.mode !== mode) {
        return false;
      }
      if (build === "ok" && r.buildOk !== true) {
        return false;
      }
      if (build === "fail" && r.buildOk !== false) {
        return false;
      }
      if (zeroAppendOnly && (r.promoteSummary?.appendedCount ?? -1) !== 0) {
        return false;
      }
      if (failedOnly && r.buildOk !== false) {
        return false;
      }
      return true;
    });
  }, [props.runs, mode, build, zeroAppendOnly, failedOnly]);

  return (
    <div className="space-y-6" data-testid="encyclopedia-batch-runs-table">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-white/70">
        <span className="font-semibold text-white/55">Filters</span>
        <label className="flex items-center gap-1.5">
          <span className="text-white/45">Mode</span>
          <select
            className="rounded border border-white/15 bg-neutral-900 px-2 py-1 text-white/85"
            value={mode}
            onChange={(e) => setMode(e.target.value as FilterMode)}
          >
            <option value="all">All ({props.aggregates.totalRuns})</option>
            <option value="gap">Gap ({props.aggregates.gapRuns})</option>
            <option value="expanded">Expanded ({props.aggregates.expandedRuns})</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-white/45">Build</span>
          <select
            className="rounded border border-white/15 bg-neutral-900 px-2 py-1 text-white/85"
            value={build}
            onChange={(e) => setBuild(e.target.value as FilterBuild)}
          >
            <option value="all">All</option>
            <option value="ok">OK</option>
            <option value="fail">Failed</option>
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={zeroAppendOnly}
            onChange={(e) => setZeroAppendOnly(e.target.checked)}
            className="rounded border-white/30"
          />
          Zero append only ({props.aggregates.zeroAppendRuns})
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={failedOnly}
            onChange={(e) => setFailedOnly(e.target.checked)}
            className="rounded border-white/30"
          />
          Failed only ({props.aggregates.failedBuilds})
        </label>
        <span className="text-white/40">
          Showing {filtered.length} of {props.runs.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[1100px] text-left text-xs">
          <thead className="border-b border-white/10 bg-black/40 text-white/55">
            <tr>
              <th className="p-2 font-semibold">Batch</th>
              <th className="p-2 font-semibold">Mode</th>
              <th className="p-2 font-semibold">Started</th>
              <th className="p-2 font-semibold">Finished</th>
              <th className="p-2 font-semibold">Duration</th>
              <th className="p-2 font-semibold">Reviewed (t/p/r/rj)</th>
              <th className="p-2 font-semibold">Append +/−</th>
              <th className="p-2 font-semibold">Yield</th>
              <th className="p-2 font-semibold">Scaf / Enr / Gen</th>
              <th className="p-2 font-semibold">Build</th>
              <th className="p-2 font-semibold">Artifacts</th>
              <th className="p-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const open = expandedSlug === r.batchName;
              const ay = appendYield(r);
              const gy = generationYield(r);
              return (
                <Fragment key={r.batchName}>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-2 font-medium text-white/90">{r.batchName}</td>
                    <td className="p-2 text-white/65">{r.mode}</td>
                    <td className="p-2 whitespace-nowrap text-white/55">{formatTs(r.startedAt)}</td>
                    <td className="p-2 whitespace-nowrap text-white/55">{formatTs(r.finishedAt)}</td>
                    <td className="p-2 text-white/55">{formatDurationMs(r.startedAt, r.finishedAt) ?? "—"}</td>
                    <td className="p-2 font-mono text-[11px] text-white/60">
                      {r.reviewedSummary
                        ? `${r.reviewedSummary.total} / ${r.reviewedSummary.promote} / ${r.reviewedSummary.review} / ${r.reviewedSummary.reject}`
                        : "—"}
                    </td>
                    <td className="p-2 font-mono text-[11px] text-white/60">
                      {r.promoteSummary
                        ? `+${r.promoteSummary.appendedCount} / −${r.promoteSummary.skippedCount} (c ${r.promoteSummary.consideredCount})`
                        : "—"}
                    </td>
                    <td className="p-2 text-white/55">
                      append {pct(ay)}
                      <br />
                      gen {pct(gy)}
                    </td>
                    <td className="p-2 font-mono text-[11px] text-white/60">
                      {r.scaffoldPageCount ?? "—"} / {r.enrichedPageCount ?? "—"} / {r.generatedFileCount}
                    </td>
                    <td className="p-2">
                      {r.buildOk == null ? (
                        <span className="text-white/40">—</span>
                      ) : r.buildOk ? (
                        <span className="text-emerald-300/90">ok</span>
                      ) : (
                        <span className="text-rose-300/90">fail{r.buildExitCode != null ? ` (${r.buildExitCode})` : ""}</span>
                      )}
                    </td>
                    <td className="max-w-[200px] p-2 align-top">
                      <div className="space-y-0.5 font-mono text-[10px] leading-snug text-white/45">
                        <div title={r.reportPath}>{r.reportPath}</div>
                        {r.appendedIdsPath ? <div title={r.appendedIdsPath}>{r.appendedIdsPath}</div> : null}
                      </div>
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="text-white/45 hover:text-white/80"
                        aria-expanded={open}
                        onClick={() => setExpandedSlug(open ? null : r.batchName)}
                      >
                        {open ? "▾" : "▸"}
                      </button>
                    </td>
                  </tr>
                  {open ? (
                    <tr className="border-b border-white/5 bg-black/25">
                      <td colSpan={12} className="p-3 text-[11px] text-white/55">
                        <div className="space-y-2">
                          {r.inputRawCandidates ? (
                            <div>
                              <span className="text-white/40">Raw: </span>
                              <code className="text-white/65">{r.inputRawCandidates}</code>
                            </div>
                          ) : null}
                          {r.inputReviewedCandidates ? (
                            <div>
                              <span className="text-white/40">Reviewed: </span>
                              <code className="text-white/65">{r.inputReviewedCandidates}</code>
                            </div>
                          ) : null}
                          {r.error ? (
                            <div className="text-rose-200/80">
                              <span className="text-white/40">Error: </span>
                              {r.error}
                            </div>
                          ) : null}
                          <div>
                            <span className="text-white/40">Steps: </span>
                            <span className="text-white/60">{r.steps.join(" → ") || "—"}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
