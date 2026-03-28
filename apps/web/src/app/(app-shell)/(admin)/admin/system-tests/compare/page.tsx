"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import { fetchAdminSystemTestRunDetail, fetchAdminSystemTestRuns } from "@/lib/api/systemTests";
import { buildSystemTestComparisonReport } from "@/lib/systemTests/buildSystemTestComparisonReport";
import { compareSystemTestRuns } from "@/lib/systemTests/compareSystemTestRuns";
import { sortSystemTestRunsListNewestFirst } from "@/lib/systemTests/sortSystemTestRuns";
import { SystemTestsComparisonGroupsPanel } from "@/components/admin/system-tests/SystemTestsComparisonGroupsPanel";
import { SystemTestsComparisonHeader } from "@/components/admin/system-tests/SystemTestsComparisonHeader";
import { SystemTestsComparisonSummaryCards } from "@/components/admin/system-tests/SystemTestsComparisonSummaryCards";
import { SystemTestsCopyReportButton } from "@/components/admin/system-tests/SystemTestsCopyReportButton";
import { SystemTestsFileHealthComparisonTable } from "@/components/admin/system-tests/SystemTestsFileHealthComparisonTable";
import { SystemTestsOperatorInsightsPanel } from "@/components/admin/system-tests/SystemTestsOperatorInsightsPanel";
import { SystemTestsCompareSelector } from "@/components/admin/system-tests/SystemTestsCompareSelector";
import type { SystemTestRunComparison, SystemTestRunDetailResponse, SystemTestsRunsResponse } from "@/types/systemTests";

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
      setLoadingCompare(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingCompare(true);
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

  const runsForSelector = useMemo(() => {
    if (!runs) return null;
    const { sorted } = sortSystemTestRunsListNewestFirst(runs.items);
    return { ...runs, items: sorted };
  }, [runs]);

  const comparison: SystemTestRunComparison | null = useMemo(() => {
    if (!baseDetail || !targetDetail) return null;
    return compareSystemTestRuns(baseDetail, targetDetail);
  }, [baseDetail, targetDetail]);

  const getComparisonReport = useMemo(() => {
    if (!comparison) return async () => "";
    return async () => buildSystemTestComparisonReport(comparison);
  }, [comparison]);

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
          <Link href="/admin/auth?next=/admin/system-tests/compare" className="mt-4 inline-flex rounded-xl border border-amber-300/30 px-4 py-2 text-sm">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin/system-tests" className="text-sm text-sky-300 hover:text-sky-200">
            ← System tests
          </Link>
        </div>

        {loadingList || !runsForSelector ? (
          <p className="text-sm text-white/60">Loading run list…</p>
        ) : (
          <SystemTestsCompareSelector
            runs={runsForSelector}
            baseRunId={baseRunId || undefined}
            targetRunId={targetRunId || undefined}
          />
        )}

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>
        ) : null}

        {baseRunId && targetRunId && baseRunId !== targetRunId ? (
          loadingCompare ? (
            <p className="text-sm text-white/60">Loading comparison…</p>
          ) : comparison ? (
            <div className="space-y-10">
              <SystemTestsComparisonHeader comparison={comparison} />
              <SystemTestsComparisonSummaryCards comparison={comparison} />
              <SystemTestsComparisonGroupsPanel variant="new" groups={comparison.newFailures} />
              <SystemTestsComparisonGroupsPanel variant="resolved" groups={comparison.resolvedFailures} />
              <SystemTestsComparisonGroupsPanel variant="persistent" groups={comparison.persistentFailures} />
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white">File health comparison</h2>
                <SystemTestsFileHealthComparisonTable rows={comparison.fileHealthChanges} />
              </section>
              <SystemTestsOperatorInsightsPanel insights={comparison.operatorInsights} />
              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-white">Copy comparison report</h2>
                <SystemTestsCopyReportButton getReportText={getComparisonReport} label="Copy comparison report" />
              </section>
            </div>
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
