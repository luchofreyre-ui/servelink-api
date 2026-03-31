"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchValidationInsights,
  type ApiValidationInsights,
} from "@/lib/api/encyclopediaReview";

export default function ApiEncyclopediaInsightsPanel() {
  const [data, setData] = useState<ApiValidationInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const next = await fetchValidationInsights();
      setData(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load insights");
      setData(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-amber-300 px-3 py-1.5 text-amber-950"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-neutral-500">Loading insights…</p>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-neutral-900">Validation insights (API store)</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800"
        >
          Refresh
        </button>
      </div>

      <p className="text-sm text-neutral-600">
        Slugs with recorded promotion errors:{" "}
        <span className="font-semibold text-neutral-900">{data.totalFailures}</span>
      </p>

      <div>
        <div className="text-sm font-semibold text-neutral-800">Top errors</div>
        <ul className="mt-2 space-y-1 text-sm text-neutral-700">
          {data.topErrors.length === 0 ? (
            <li className="text-neutral-500">No promotion errors in store.</li>
          ) : (
            data.topErrors.map((e) => (
              <li key={e.error}>
                <span className="text-neutral-600">{e.error}</span>
                <span className="text-neutral-400"> — </span>
                <span className="font-medium">{e.count}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
