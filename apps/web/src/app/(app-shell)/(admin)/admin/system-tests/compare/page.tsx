"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import {
  buildSystemTestsComparePayload,
  buildSystemTestsCompareResult,
  fetchAdminSystemTestRunDetail,
  fetchAdminSystemTestRuns,
} from "@/lib/api/systemTests";
import { buildCompareRunIntelligence } from "@/lib/system-tests/compare";
import { buildEnrichedCompareExport } from "@/lib/system-tests/export";
import { SystemTestsCompareSelector } from "@/components/admin/system-tests/SystemTestsCompareSelector";
import { SystemTestsCompareView } from "@/components/admin/system-tests/SystemTestsCompareView";
import type {
  SystemTestRunDetailResponse,
  SystemTestsCompareIntelligence,
  SystemTestsCompareResult,
  SystemTestsRunsResponse,
} from "@/types/systemTests";

function ComparePageInner() {
  const searchParams = useSearchParams();
  const baseRunId = searchParams?.get("baseRunId") ?? "";
  const targetRunId = searchParams?.get("targetRunId") ?? "";

  const [tokenChecked, setTokenChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [runs, setRuns] = useState<SystemTestsRunsResponse | null>(null);
  const [baseDetail, setBaseDetail] = useState<SystemTestRunDetailResponse | null>(null);
  const [targetDetail, setTargetDetail] = useState<SystemTestRunDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [recentWindow, setRecentWindow] = useState<SystemTestRunDetailResponse[]>([]);

  useEffect(() => {
    setToken(getStoredAccessToken());
    setTokenChecked(true);
  }, []);

  useEffect(() => {
    if (!tokenChecked || !token) {
      setLoadingList(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      setError(null);
      try {
        const list = await fetchAdminSystemTestRuns(token, { page: 1, limit: 100 });
        if (!cancelled) setRuns(list);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load runs.");
        }
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tokenChecked]);

  useEffect(() => {
    if (!tokenChecked || !token || !baseRunId || !targetRunId || baseRunId === targetRunId) {
      setBaseDetail(null);
      setTargetDetail(null);
      setRecentWindow([]);
      setLoadingCompare(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingCompare(true);
      setRecentWindow([]);
      setError(null);
      try {
        const [b, t] = await Promise.all([
          fetchAdminSystemTestRunDetail(token, baseRunId),
          fetchAdminSystemTestRunDetail(token, targetRunId),
        ]);
        if (!cancelled) {
          setBaseDetail(b);
          setTargetDetail(t);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load run details.");
          setBaseDetail(null);
          setTargetDetail(null);
        }
      } finally {
        if (!cancelled) setLoadingCompare(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tokenChecked, baseRunId, targetRunId]);

  useEffect(() => {
    if (!tokenChecked || !token || !runs?.items.length || !baseDetail || !targetDetail) {
      setRecentWindow([]);
      return;
    }
    const want = new Set(runs.items.slice(0, 10).map((r) => r.id));
    const have = new Map<string, SystemTestRunDetailResponse>([
      [baseDetail.run.id, baseDetail],
      [targetDetail.run.id, targetDetail],
    ]);
    const missing = [...want].filter((id) => !have.has(id)).slice(0, 8);

    if (missing.length === 0) {
      const merged = [...have.values()].sort(
        (a, b) => new Date(a.run.createdAt).getTime() - new Date(b.run.createdAt).getTime(),
      );
      setRecentWindow(merged);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const settled = await Promise.allSettled(
          missing.map((id) => fetchAdminSystemTestRunDetail(token, id)),
        );
        if (cancelled) return;
        for (const s of settled) {
          if (s.status === "fulfilled") have.set(s.value.run.id, s.value);
        }
        const merged = [...have.values()].sort(
          (a, b) => new Date(a.run.createdAt).getTime() - new Date(b.run.createdAt).getTime(),
        );
        setRecentWindow(merged);
      } catch {
        if (!cancelled) {
          const merged = [...have.values()].sort(
            (a, b) => new Date(a.run.createdAt).getTime() - new Date(b.run.createdAt).getTime(),
          );
          setRecentWindow(merged);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, tokenChecked, runs, baseDetail, targetDetail]);

  const compare: SystemTestsCompareResult | null = useMemo(() => {
    if (!baseDetail || !targetDetail) return null;
    return buildSystemTestsCompareResult(baseDetail, targetDetail);
  }, [baseDetail, targetDetail]);

  const intelligence: SystemTestsCompareIntelligence | null = useMemo(() => {
    if (!baseDetail || !targetDetail) return null;
    return buildCompareRunIntelligence(
      baseDetail,
      targetDetail,
      recentWindow.length >= 2 ? recentWindow : undefined,
    );
  }, [baseDetail, targetDetail, recentWindow]);

  const payload = useMemo(() => {
    if (!compare || !intelligence) return "";
    return JSON.stringify(
      buildEnrichedCompareExport(compare, buildSystemTestsComparePayload(compare), intelligence),
      null,
      2,
    );
  }, [compare, intelligence]);

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
        <div className="mx-auto max-w-lg rounded-2xl border border-amber-400/25 bg-amber-500/10 p-8">
          <p className="font-semibold">Authentication required</p>
          <Link
            href="/admin/auth?next=/admin/system-tests/compare"
            className="mt-4 inline-flex rounded-xl border border-amber-300/30 px-4 py-2 text-sm"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin/system-tests" className="text-sm text-sky-300 hover:text-sky-200">
            ← System tests
          </Link>
        </div>

        {loadingList || !runs ? (
          <p className="text-sm text-white/60">Loading run list…</p>
        ) : (
          <SystemTestsCompareSelector
            runs={runs}
            baseRunId={baseRunId || undefined}
            targetRunId={targetRunId || undefined}
          />
        )}

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {baseRunId && targetRunId && baseRunId !== targetRunId ? (
          loadingCompare ? (
            <p className="text-sm text-white/60">Loading comparison…</p>
          ) : compare && payload && intelligence ? (
            <SystemTestsCompareView compare={compare} payload={payload} intelligence={intelligence} />
          ) : !error ? (
            <p className="text-sm text-white/50">Could not build comparison.</p>
          ) : null
        ) : (
          <p className="text-sm text-white/45">
            Select two distinct runs above, or open this page with{" "}
            <code className="rounded bg-black/40 px-1">baseRunId</code> and{" "}
            <code className="rounded bg-black/40 px-1">targetRunId</code> query params.
          </p>
        )}
      </div>
    </main>
  );
}

export default function AdminSystemTestsComparePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
          <p className="text-sm text-white/60">Loading…</p>
        </main>
      }
    >
      <ComparePageInner />
    </Suspense>
  );
}
