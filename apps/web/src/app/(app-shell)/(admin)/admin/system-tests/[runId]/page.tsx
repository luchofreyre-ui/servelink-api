"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import { fetchAdminSystemTestRunDetail, fetchAdminSystemTestRuns } from "@/lib/api/systemTests";
import { analyzeSystemTestHistory } from "@/lib/systemTests/analyzeSystemTestHistory";
import { SystemTestsRunDetail } from "@/components/admin/system-tests/SystemTestsRunDetail";
import { sortSystemTestRunsListNewestFirst } from "@/lib/systemTests/sortSystemTestRuns";
import type { SystemTestRunDetailResponse, SystemTestRunsListItem } from "@/types/systemTests";

export default function AdminSystemTestRunDetailPage() {
  const params = useParams();
  const runId = String(params?.runId ?? "");

  const [tokenChecked, setTokenChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [detail, setDetail] = useState<SystemTestRunDetailResponse | null>(null);
  const [runs, setRuns] = useState<SystemTestRunsListItem[]>([]);
  const [priorDetails, setPriorDetails] = useState<SystemTestRunDetailResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(getStoredAccessToken());
    setTokenChecked(true);
  }, []);

  useEffect(() => {
    if (!tokenChecked || !token) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const list = await fetchAdminSystemTestRuns(token, { limit: 40, page: 1 });
        if (!cancelled) {
          setRuns(list.items);
        }
      } catch {
        if (!cancelled) setRuns([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, tokenChecked]);

  const { sorted: sortedRuns } = useMemo(() => sortSystemTestRunsListNewestFirst(runs), [runs]);

  useEffect(() => {
    if (!tokenChecked || !token || !runId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const d = await fetchAdminSystemTestRunDetail(token, runId);
        if (!cancelled) setDetail(d);
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
  }, [token, tokenChecked, runId]);

  useEffect(() => {
    if (!tokenChecked || !token || !runId || !sortedRuns.length) {
      setPriorDetails([]);
      setHistoryLoading(false);
      return;
    }

    const idx = sortedRuns.findIndex((r) => r.id === runId);
    if (idx < 0) {
      setPriorDetails([]);
      return;
    }

    const older = sortedRuns.slice(idx + 1, idx + 10);
    if (!older.length) {
      setPriorDetails([]);
      setHistoryLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      try {
        const settled = await Promise.allSettled(
          older.map((r) => fetchAdminSystemTestRunDetail(token, r.id)),
        );
        if (cancelled) return;
        const ok = settled
          .filter((s): s is PromiseFulfilledResult<SystemTestRunDetailResponse> => s.status === "fulfilled")
          .map((s) => s.value);
        setPriorDetails(ok);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, tokenChecked, runId, sortedRuns]);

  const historicalAnalysis = useMemo(() => {
    if (!detail) return null;
    return analyzeSystemTestHistory(detail, priorDetails);
  }, [detail, priorDetails]);

  if (!tokenChecked) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-white/60">Checking authentication…</p>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-lg rounded-2xl border border-amber-400/25 bg-amber-500/10 p-8 text-amber-50">
          <h1 className="text-xl font-semibold">Authentication required</h1>
          <Link
            href={`/admin/auth?next=${encodeURIComponent(`/admin/system-tests/${runId}`)}`}
            className="mt-4 inline-flex rounded-xl border border-amber-300/30 bg-amber-500/20 px-4 py-2.5 text-sm font-medium"
          >
            Go to admin sign in
          </Link>
        </div>
      </main>
    );
  }

  if (!runId) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-white/60">Missing run id.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        {loading ? (
          <p className="text-sm text-white/60">Loading run…</p>
        ) : error || !detail ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error || "Run not found."}
          </div>
        ) : (
          <SystemTestsRunDetail
            detail={detail}
            sortedRuns={sortedRuns}
            historicalAnalysis={historicalAnalysis!}
            historyLoading={historyLoading}
          />
        )}
      </div>
    </main>
  );
}
