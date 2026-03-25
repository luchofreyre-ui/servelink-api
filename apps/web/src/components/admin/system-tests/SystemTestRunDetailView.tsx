"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import { fetchAdminSystemTestRunDetail } from "@/lib/api/systemTests";
import type { SystemTestRunDetailResponse } from "@/types/systemTests";

type Props = { runId: string };

export function SystemTestRunDetailView(props: Props) {
  const [data, setData] = useState<SystemTestRunDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      setError("Sign in to the admin app to view this run.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const detail = await fetchAdminSystemTestRunDetail(token, props.runId);
        if (!cancelled) setData(detail);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load run.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [props.runId]);

  const copyReport = useCallback(async () => {
    if (!data?.diagnosticReport) return;
    try {
      await navigator.clipboard.writeText(data.diagnosticReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [data?.diagnosticReport]);

  if (loading) {
    return <p className="text-sm text-white/60">Loading run…</p>;
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
        {error || "Run not found."}
      </div>
    );
  }

  const { run, suiteBreakdown, diagnosticReport, cases } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/system-tests"
            className="text-sm text-sky-300 hover:text-sky-200"
          >
            ← System Test Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Run <span className="font-mono text-lg text-white/80">{run.id}</span>
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {run.source}
            {run.branch ? ` · ${run.branch}` : ""}
            {run.commitSha ? ` · ${run.commitSha}` : ""}
          </p>
          <p className="mt-1 text-xs text-white/45">
            {new Date(run.createdAt).toLocaleString()} · ingest v{run.ingestVersion}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
          <p className="text-white/50">Status</p>
          <p className="text-lg font-semibold text-white">{run.status}</p>
          <p className="mt-2 text-white/70">
            {run.passedCount}/{run.totalCount} passed · {run.failedCount} failed ·{" "}
            {run.skippedCount} skipped · {run.flakyCount} flaky
          </p>
          {run.durationMs != null ? (
            <p className="mt-1 text-white/50">{run.durationMs} ms</p>
          ) : null}
        </div>
      </div>

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
              </tr>
            </thead>
            <tbody>
              {suiteBreakdown.map((row) => (
                <tr key={row.suite} className="border-b border-white/5">
                  <td className="px-4 py-2 font-medium">{row.suite}</td>
                  <td className="px-4 py-2">{row.total}</td>
                  <td className="px-4 py-2">{row.passed}</td>
                  <td className="px-4 py-2">{row.failed}</td>
                  <td className="px-4 py-2">{row.skipped}</td>
                  <td className="px-4 py-2">{row.flaky}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Diagnostic report</h2>
          <button
            type="button"
            onClick={() => void copyReport()}
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15"
          >
            {copied ? "Copied" : "Copy diagnostic report"}
          </button>
        </div>
        <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-xs text-emerald-100/90">
          {diagnosticReport}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Test cases</h2>
        <p className="text-xs text-white/45">Failed tests first, then the rest.</p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm text-white/90">
            <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase text-white/50">
              <tr>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Suite</th>
                <th className="px-3 py-2">File</th>
                <th className="px-3 py-2">Test</th>
                <th className="px-3 py-2">Retries</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Route</th>
                <th className="px-3 py-2">Selector</th>
                <th className="px-3 py-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="border-b border-white/5 align-top">
                  <td className="px-3 py-2 whitespace-nowrap">{c.status}</td>
                  <td className="px-3 py-2">{c.suite}</td>
                  <td className="px-3 py-2 max-w-[200px] truncate font-mono text-xs" title={c.filePath}>
                    {c.filePath}
                  </td>
                  <td className="px-3 py-2 max-w-[220px]">{c.title}</td>
                  <td className="px-3 py-2">{c.retryCount}</td>
                  <td className="px-3 py-2">{c.durationMs ?? "—"}</td>
                  <td className="px-3 py-2 max-w-[140px] truncate text-xs">{c.route ?? "—"}</td>
                  <td className="px-3 py-2 max-w-[140px] truncate text-xs">{c.selector ?? "—"}</td>
                  <td className="px-3 py-2 max-w-[240px] text-xs text-red-200/80">
                    {c.errorMessage ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
