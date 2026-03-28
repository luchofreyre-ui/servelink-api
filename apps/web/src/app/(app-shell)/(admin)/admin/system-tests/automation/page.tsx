"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import {
  fetchSystemTestsAutomationJob,
  fetchSystemTestsAutomationJobs,
  fetchSystemTestsAutomationStatus,
  postSystemTestsEvaluateAlert,
  postSystemTestsGenerateTriage,
  postSystemTestsRunDigest,
  postSystemTestsSendJob,
} from "@/lib/api/systemTestsAutomation";
import { SystemTestsAutomationControls } from "@/components/admin/system-tests/SystemTestsAutomationControls";
import { SystemTestsAutomationHeader } from "@/components/admin/system-tests/SystemTestsAutomationHeader";
import { SystemTestsAutomationJobsTable } from "@/components/admin/system-tests/SystemTestsAutomationJobsTable";
import { SystemTestsAutomationPayloadPreview } from "@/components/admin/system-tests/SystemTestsAutomationPayloadPreview";
import type {
  SystemTestsAutomationJobDetail,
  SystemTestsAutomationJobRow,
  SystemTestsAutomationStatus,
} from "@/types/systemTestsAutomation";

function deliveryFromPayload(p: unknown): { title: string; bodyText: string } {
  const o = p as { delivery?: { title?: string; bodyText?: string } };
  return {
    title: o?.delivery?.title ?? "—",
    bodyText: o?.delivery?.bodyText ?? "",
  };
}

export default function AdminSystemTestsAutomationPage() {
  const [tokenChecked, setTokenChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<SystemTestsAutomationStatus | null>(null);
  const [jobs, setJobs] = useState<SystemTestsAutomationJobRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SystemTestsAutomationJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    setToken(getStoredAccessToken());
    setTokenChecked(true);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [st, j] = await Promise.all([
        fetchSystemTestsAutomationStatus(token),
        fetchSystemTestsAutomationJobs(token, 80),
      ]);
      setStatus(st);
      setJobs(j.items);
      setSelectedId((prev) => {
        if (prev && j.items.some((x) => x.id === prev)) return prev;
        return j.items[0]?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load automation data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!tokenChecked || !token) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [token, tokenChecked, refresh]);

  useEffect(() => {
    if (!token || !selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      try {
        const { job } = await fetchSystemTestsAutomationJob(token, selectedId);
        if (!cancelled) setDetail(job);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, selectedId]);

  const selectedRow = jobs.find((j) => j.id === selectedId) ?? null;
  const previewFromDetail = detail ? deliveryFromPayload(detail.payloadJson) : null;

  const runAction = async (
    key: string,
    fn: () => Promise<{ jobId?: string; pipelineJobId?: string; mode?: string }>,
  ) => {
    if (!token) return;
    setBusy(key);
    setActionMsg(null);
    try {
      const r = await fn();
      const ref = r.pipelineJobId ?? r.jobId ?? "—";
      const mode = r.mode ? ` (${r.mode})` : "";
      setActionMsg(`OK · ${ref}${mode}`);
      await refresh();
      if (r.jobId) setSelectedId(r.jobId);
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  if (!tokenChecked) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
        <p className="text-sm text-white/60">Checking authentication…</p>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-lg rounded-2xl border border-amber-400/25 bg-amber-500/10 p-8 text-amber-50">
          <h1 className="text-xl font-semibold">Authentication required</h1>
          <Link
            href="/admin/auth?next=/admin/system-tests/automation"
            className="mt-4 inline-flex rounded-xl border border-amber-300/30 bg-amber-500/20 px-4 py-2.5 text-sm font-medium"
          >
            Go to admin sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/system-tests" className="text-sm text-sky-300 hover:text-sky-200">
            ← System tests
          </Link>
          <Link href="/admin/system-tests/pipeline" className="text-sm text-sky-300 hover:text-sky-200">
            Pipeline queue →
          </Link>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>
        ) : null}

        <SystemTestsAutomationHeader status={status} loading={loading && !status} />

        {actionMsg ? (
          <p className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/75">
            {actionMsg}
          </p>
        ) : null}

        <SystemTestsAutomationControls
          busy={busy}
          selectedJobId={selectedId}
          onDigest={() => runAction("digest", () => postSystemTestsRunDigest(token))}
          onAlert={() => runAction("alert", () => postSystemTestsEvaluateAlert(token))}
          onTriage={() => runAction("triage", () => postSystemTestsGenerateTriage(token))}
          onSendSelected={
            selectedId ?
              () =>
                runAction("sendSel", async () => {
                  await postSystemTestsSendJob(token, selectedId);
                  return { jobId: selectedId };
                })
            : undefined
          }
        />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Recent jobs</h2>
          <SystemTestsAutomationJobsTable
            jobs={jobs}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
          />
        </section>

        <SystemTestsAutomationPayloadPreview
          title={previewFromDetail?.title ?? selectedRow?.payloadPreview.title ?? "—"}
          bodyExcerpt={
            previewFromDetail?.bodyText ?? selectedRow?.payloadPreview.bodyExcerpt ?? ""
          }
          payloadJson={detail?.payloadJson ?? null}
          loading={detailLoading}
        />
      </div>
    </main>
  );
}
