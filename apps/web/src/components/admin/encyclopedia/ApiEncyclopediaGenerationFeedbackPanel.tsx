"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchGenerationFeedback,
  type ApiGenerationFeedback,
} from "@/lib/api/encyclopediaReview";

export default function ApiEncyclopediaGenerationFeedbackPanel() {
  const [data, setData] = useState<ApiGenerationFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchGenerationFeedback();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load generation feedback");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-neutral-900">Generation feedback</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800"
        >
          Refresh
        </button>
      </div>

      {loading ? <div className="text-sm text-neutral-500">Loading…</div> : null}
      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {data ? (
        <>
          <div className="space-y-2">
            <div className="text-sm font-medium text-neutral-800">Critical failures</div>
            {data.criticalFailures.length === 0 ? (
              <div className="text-sm text-neutral-500">No current critical failures.</div>
            ) : (
              <div className="space-y-2">
                {data.criticalFailures.map((item) => (
                  <div key={item.error} className="rounded-lg border border-neutral-200 p-3 text-sm">
                    <div className="font-medium text-neutral-900">{item.error}</div>
                    <div className="text-neutral-600">Count: {item.count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-neutral-800">Guidance</div>
            {data.guidance.length === 0 ? (
              <div className="text-sm text-neutral-500">No guidance available.</div>
            ) : (
              <div className="space-y-2">
                {data.guidance.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="rounded-lg border border-neutral-200 p-3 text-sm text-neutral-800"
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
