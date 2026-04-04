"use client";

import { useEffect, useMemo, useState } from "react";

import { countFunnelStageInteractions } from "@/lib/analytics/funnelStageAnalytics";

const STAGE_ORDER = [
  "search_top_result",
  "search_non_top_result",
  "compare_entry",
  "product_context",
  "authority_close",
  "product_buy",
  "unknown",
] as const;

export function FunnelStageDashboard() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const counts = useMemo(() => {
    void tick;
    return countFunnelStageInteractions();
  }, [tick]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const orderedKeys = [
    ...STAGE_ORDER.filter((k) => (counts[k] ?? 0) > 0),
    ...Object.keys(counts).filter(
      (k) => !STAGE_ORDER.includes(k as (typeof STAGE_ORDER)[number]),
    ),
  ];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-neutral-900">Funnel stage interactions</h2>
        <button
          type="button"
          className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
          onClick={() => setTick((n) => n + 1)}
        >
          Refresh
        </button>
      </div>
      <p className="mb-3 text-xs text-neutral-500">
        Client-side counts from tracked funnel labels (this browser). Higher bars mean more recent
        activity for that stage.
      </p>
      {total === 0 ?
        <p className="text-xs text-neutral-600">No funnel stage events recorded yet.</p>
      : <ul className="space-y-2">
          {orderedKeys.map((stage) => {
            const n = counts[stage] ?? 0;
            if (!n) return null;
            const pct = Math.round((n / total) * 100);
            return (
              <li key={stage}>
                <div className="flex justify-between text-xs text-neutral-700">
                  <span className="font-medium">{stage}</span>
                  <span className="text-neutral-500">
                    {n} ({pct}%)
                  </span>
                </div>
                <div className="mt-0.5 h-2 overflow-hidden rounded bg-neutral-100">
                  <div
                    className="h-full rounded bg-teal-600/80"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      }
    </div>
  );
}
