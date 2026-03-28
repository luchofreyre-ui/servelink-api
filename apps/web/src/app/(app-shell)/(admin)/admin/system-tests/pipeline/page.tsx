"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import {
  fetchSystemTestsPipelineJobs,
  fetchSystemTestsPipelineJobsForRun,
  postSystemTestsPipelineRequeueAnalysis,
  postSystemTestsPipelineRetryJob,
} from "@/lib/api/systemTestsPipeline";
import { SystemTestsPipelineJobsTable } from "@/components/admin/system-tests/SystemTestsPipelineJobsTable";
import type { SystemTestPipelineJobRow } from "@/types/systemTestsPipeline";

export default function AdminSystemTestsPipelinePage() {
  const [tokenChecked, setTokenChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [jobs, setJobs] = useState<SystemTestPipelineJobRow[]>([]);
  const [runFilter, setRunFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [retryBusy, setRetryBusy] = useState<string | null>(null);
  const [requeueBusy, setRequeueBusy] = useState(false);

  useEffect(() => {
    setToken(getStoredAccessToken());
    setTokenChecked(true);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const runId = runFilter.trim();
      const items = runId
        ? (await fetchSystemTestsPipelineJobsForRun(token, runId, 80)).items
        : (await fetchSystemTestsPipelineJobs(token, 100)).items;
      setJobs(items);
      setSelectedId((prev) => {
        if (prev && items.some((x) => x.id === prev)) return prev;
        return items[0]?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pipeline jobs.");
    } finally {
      setLoading(false);
    }
  }, [token, runFilter]);

  useEffect(() => {
    if (!tokenChecked || !token) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [token, tokenChecked, refresh]);

  const selected = jobs.find((j) => j.id === selectedId) ?? null;

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/system-tests" className="text-sm text-sky-300 hover:text-sky-200">
            ← System tests
          </Link>
          <Link href="/admin/system-tests/automation" className="text-sm text-sky-300 hover:text-sky-200">
            Automation jobs →
          </Link>
        </div>

        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline queue</h1>
          <p className="mt-1 max-w-3xl text-sm text-white/60">
            Analysis and automation stage jobs (BullMQ when Redis is configured; otherwise runs inline).
          </p>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>
        ) : null}

        {actionMsg ? (
          <p className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/75">{actionMsg}</p>
        ) : null}

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-white/50">
            Filter by run ID
            <input
              value={runFilter}
              onChange={(e) => setRunFilter(e.target.value)}
              placeholder="Leave empty for recent jobs"
              className="w-72 rounded-lg border border-white/15 bg-black/30 px-3 py-2 font-mono text-sm text-white placeholder:text-white/30"
            />
          </label>
          <button
            type="button"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            onClick={() => void refresh()}
            disabled={loading}
          >
            Refresh
          </button>
          {runFilter.trim() && token ?
            <button
              type="button"
              className="rounded-lg border border-sky-500/30 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100 hover:bg-sky-500/25 disabled:opacity-40"
              disabled={requeueBusy}
              onClick={async () => {
                setRequeueBusy(true);
                setActionMsg(null);
                try {
                  const r = await postSystemTestsPipelineRequeueAnalysis(token, runFilter.trim(), {
                    force: true,
                  });
                  setActionMsg(`Requeued analysis · ${r.pipelineJobId} (${r.mode})`);
                  await refresh();
                } catch (e) {
                  setActionMsg(e instanceof Error ? e.message : "Requeue failed.");
                } finally {
                  setRequeueBusy(false);
                }
              }}
            >
              Requeue analysis (force)
            </button>
          : null}
        </div>

        <SystemTestsPipelineJobsTable
          jobs={jobs}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={loading}
          retryBusyId={retryBusy}
          onRetry={
            token ?
              async (id) => {
                setRetryBusy(id);
                setActionMsg(null);
                try {
                  const r = await postSystemTestsPipelineRetryJob(token, id);
                  setActionMsg(`Retry queued · ${r.pipelineJobId} (${r.mode})`);
                  await refresh();
                } catch (e) {
                  setActionMsg(e instanceof Error ? e.message : "Retry failed.");
                } finally {
                  setRetryBusy(null);
                }
              }
            : undefined
          }
        />

        {selected ?
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="text-sm font-semibold text-white">Payload</h2>
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-black/40 p-3 font-mono text-[11px] text-white/70">
              {JSON.stringify(selected.payloadJson, null, 2)}
            </pre>
          </section>
        : null}
      </div>
    </main>
  );
}
