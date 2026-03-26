"use client";

import Link from "next/link";
import { useMemo } from "react";
import { buildSystemTestSupportPayload } from "@/lib/api/systemTests";
import type { SystemTestRunDetailResponse } from "@/types/systemTests";
import { SystemTestsDiagnosticCard } from "./SystemTestsDiagnosticCard";
import { SystemTestsFailureList } from "./SystemTestsFailureList";
import {
  formatDateTime,
  formatDurationMs,
  statusPillClass,
} from "./systemTestsFormatting";

type Props = {
  detail: SystemTestRunDetailResponse;
};

function suiteDurationSum(
  cases: SystemTestRunDetailResponse["cases"],
  suite: string,
): number | null {
  let n = 0;
  let any = false;
  for (const c of cases) {
    if (c.suite !== suite) continue;
    if (c.durationMs != null) {
      n += c.durationMs;
      any = true;
    }
  }
  return any ? n : null;
}

export function SystemTestsRunDetail(props: Props) {
  const { detail } = props;
  const { run, suiteBreakdown, diagnosticReport, cases } = detail;

  const supportPayload = useMemo(
    () => JSON.stringify(buildSystemTestSupportPayload(detail), null, 2),
    [detail],
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/system-tests"
            className="text-sm text-sky-300 hover:text-sky-200"
          >
            ← System tests
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Run{" "}
            <span className="font-mono text-lg text-white/85" title={run.id}>
              {run.id}
            </span>
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/55">
            <span>created: {formatDateTime(run.createdAt)}</span>
            <span>·</span>
            <span>source: {run.source}</span>
            <span>·</span>
            <span>branch: {run.branch ?? "—"}</span>
            <span>·</span>
            <span className="font-mono" title={run.commitSha ?? ""}>
              commit: {run.commitSha ?? "—"}
            </span>
            <span>·</span>
            <span>ingest v{run.ingestVersion}</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-white/45">Status</p>
          <p
            className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${statusPillClass(run.status)}`}
          >
            {run.status}
          </p>
          <p className="mt-2 text-sm text-white/70">
            Duration {formatDurationMs(run.durationMs)}
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Breakdown</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              ["Total", run.totalCount],
              ["Passed", run.passedCount],
              ["Failed", run.failedCount],
              ["Skipped", run.skippedCount],
              ["Flaky", run.flakyCount],
            ] as const
          ).map(([label, n]) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center"
            >
              <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{n}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Suite breakdown</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm text-white/90">
            <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase text-white/50">
              <tr>
                <th className="px-4 py-3">Suite</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Passed</th>
                <th className="px-4 py-3">Failed</th>
                <th className="px-4 py-3">Skipped</th>
                <th className="px-4 py-3">Flaky</th>
                <th className="px-4 py-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {suiteBreakdown.map((row) => (
                <tr key={row.suite} className="border-b border-white/5">
                  <td className="px-4 py-2 font-medium">{row.suite}</td>
                  <td className="px-4 py-2">{row.total}</td>
                  <td className="px-4 py-2 text-emerald-200/90">{row.passed}</td>
                  <td className="px-4 py-2 text-red-200/85">{row.failed}</td>
                  <td className="px-4 py-2">{row.skipped}</td>
                  <td className="px-4 py-2 text-amber-200/85">{row.flaky}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {formatDurationMs(suiteDurationSum(cases, row.suite))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <SystemTestsDiagnosticCard
        diagnosticReport={diagnosticReport}
        supportPayload={supportPayload}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Cases</h2>
        <SystemTestsFailureList cases={cases} />
      </section>
    </div>
  );
}
