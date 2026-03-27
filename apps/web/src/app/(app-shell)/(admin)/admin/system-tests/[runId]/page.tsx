"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import { fetchAdminSystemTestRunDetail, fetchAdminSystemTestRuns } from "@/lib/api/systemTests";
import { SystemTestsRunDetail } from "@/components/admin/system-tests/SystemTestsRunDetail";
import type { SystemTestRunDetailResponse } from "@/types/systemTests";

export default function AdminSystemTestRunDetailPage() {
  const params = useParams();
  const runId = String(params?.runId ?? "");

  const [tokenChecked, setTokenChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [detail, setDetail] = useState<SystemTestRunDetailResponse | null>(null);
  const [peerDetails, setPeerDetails] = useState<SystemTestRunDetailResponse[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(getStoredAccessToken());
    setTokenChecked(true);
  }, []);

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
    if (!tokenChecked || !token || !runId || !detail) {
      setPeerDetails([]);
      setPeersLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setPeersLoading(true);
      try {
        const list = await fetchAdminSystemTestRuns(token, { page: 1, limit: 24 });
        if (cancelled) return;
        let ids = list.items.slice(0, 12).map((r) => r.id);
        if (!ids.includes(runId)) {
          ids = [runId, ...ids].slice(0, 12);
        }
        const settled = await Promise.allSettled(
          ids.map((id) => fetchAdminSystemTestRunDetail(token, id)),
        );
        if (cancelled) return;
        const ok = settled
          .filter((s): s is PromiseFulfilledResult<SystemTestRunDetailResponse> => s.status === "fulfilled")
          .map((s) => s.value);
        setPeerDetails(ok.filter((d) => d.run.id !== runId));
      } catch {
        if (!cancelled) setPeerDetails([]);
      } finally {
        if (!cancelled) setPeersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, tokenChecked, runId, detail]);

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
            recentDetailsForExport={peerDetails}
            peersLoading={peersLoading}
          />
        )}
      </div>
    </main>
  );
}
