"use client";

import { useEffect, useState } from "react";
import {
  fetchReviewOps,
  type ApiEncyclopediaReviewOpsSummary,
} from "@/lib/api/encyclopediaReview";

export default function ApiEncyclopediaOpsPanel() {
  const [ops, setOps] = useState<ApiEncyclopediaReviewOpsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchReviewOps()
      .then((data) => {
        if (!cancelled) setOps(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load ops summary");
          setOps(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {error}
      </p>
    );
  }

  if (!ops) {
    return <p className="text-sm text-neutral-500">Loading API ops summary…</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Stat label="Total" value={ops.total} />
      <Stat label="Pending" value={ops.pending} />
      <Stat label="Approved" value={ops.approved} />
      <Stat label="Rejected" value={ops.rejected} />
      <Stat label="Live" value={ops.live} />
      <Stat label="Failed" value={ops.failed} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-neutral-900">{value}</div>
    </div>
  );
}
