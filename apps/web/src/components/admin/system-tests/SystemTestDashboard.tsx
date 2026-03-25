"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import {
  fetchAdminSystemTestRuns,
  fetchAdminSystemTestsSummary,
} from "@/lib/api/systemTests";
import type {
  SystemTestLatestFailure,
  SystemTestRunListItem,
  SystemTestSummaryResponse,
} from "@/types/systemTests";

function pct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function SystemTestDashboard() {
  const [summary, setSummary] = useState<SystemTestSummaryResponse | null>(null);
  const [runs, setRuns] = useState<SystemTestRunListItem[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      setError("Sign in to the admin app to load system tests.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [sum, list] = await Promise.all([
          fetchAdminSystemTestsSummary(token),
          fetchAdminSystemTestRuns(token, { page: 1, limit: 25 }),
        ]);
        if (!cancelled) {
          setSummary(sum);
          setRuns(list.items);
          setTotalRuns(list.total);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load system tests.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-white/60">Loading system test data…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
        {error}
      </div>
    );
  }

  const latest = summary?.latestRun;

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-white/50">Latest status</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {latest?.status ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-white/50">Pass rate</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {pct(summary?.latestPassRate ?? null)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-white/50">Failed tests</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {summary?.latestFailedCount ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-white/50">Last run</p>
          <p className="mt-2 text-sm font-medium text-white">
            {formatWhen(summary?.latestRunAt)}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Suite breakdown (latest run)</h2>
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
              </tr>
            </thead>
            <tbody>
              {(summary?.suiteBreakdown ?? []).length ? (
                summary!.suiteBreakdown.map((row) => (
                  <tr key={row.suite} className="border-b border-white/5">
                    <td className="px-4 py-2 font-medium">{row.suite}</td>
                    <td className="px-4 py-2">{row.total}</td>
                    <td className="px-4 py-2 text-emerald-200/90">{row.passed}</td>
                    <td className="px-4 py-2 text-red-200/90">{row.failed}</td>
                    <td className="px-4 py-2">{row.skipped}</td>
                    <td className="px-4 py-2 text-amber-200/90">{row.flaky}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-white/50" colSpan={6}>
                    No runs ingested yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Recent runs</h2>
          <span className="text-xs text-white/45">{totalRuns} total</span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm text-white/90">
            <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase text-white/50">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Passed</th>
                <th className="px-4 py-3">Failed</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {runs.length ? (
                runs.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-4 py-2 whitespace-nowrap">{formatWhen(r.createdAt)}</td>
                    <td className="px-4 py-2">{r.source}</td>
                    <td className="px-4 py-2">{r.status}</td>
                    <td className="px-4 py-2">{r.passedCount}</td>
                    <td className="px-4 py-2">{r.failedCount}</td>
                    <td className="px-4 py-2">{r.totalCount}</td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/admin/system-tests/${r.id}`}
                        className="text-sm font-medium text-sky-300 hover:text-sky-200"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-white/50" colSpan={7}>
                    No runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Latest failures (up to 20)</h2>
        <div className="space-y-2">
          {(summary?.latestFailures ?? []).length ? (
            (summary!.latestFailures as SystemTestLatestFailure[]).map((f, i) => (
              <div
                key={`${f.runId}-${f.fullName}-${i}`}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{f.fullName}</p>
                    <p className="mt-1 text-xs text-white/50">
                      {f.suite} · {f.filePath}
                    </p>
                    {f.errorMessage ? (
                      <p className="mt-2 text-sm text-red-200/90">{f.errorMessage}</p>
                    ) : null}
                  </div>
                  <Link
                    href={`/admin/system-tests/${f.runId}`}
                    className="shrink-0 text-sm text-sky-300 hover:text-sky-200"
                  >
                    Open run
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/50">No failures on the latest run.</p>
          )}
        </div>
      </section>
    </div>
  );
}
