"use client";

import { useCallback, useEffect, useState } from "react";
import {
  approveReview,
  fetchReviewList,
  promoteApproved,
  rejectReview,
  retryFailed,
  type ApiEncyclopediaReviewRecord,
} from "@/lib/api/encyclopediaReview";

export default function ApiEncyclopediaReviewPanel() {
  const [items, setItems] = useState<ApiEncyclopediaReviewRecord[]>([]);
  const [promoting, setPromoting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPromote, setLastPromote] = useState<string | null>(null);
  const [lastRetry, setLastRetry] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchReviewList();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load API review list");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleApprove(slug: string) {
    setError(null);
    await approveReview(slug);
    await load();
  }

  async function handleReject(slug: string) {
    setError(null);
    await rejectReview(slug);
    await load();
  }

  async function handlePromote() {
    setPromoting(true);
    setError(null);
    setLastPromote(null);
    setLastRetry(null);
    try {
      const result = await promoteApproved();
      setLastPromote(JSON.stringify(result, null, 2));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Promote failed");
    } finally {
      setPromoting(false);
    }
  }

  async function handleRetryFailed() {
    setRetrying(true);
    setError(null);
    setLastRetry(null);
    setLastPromote(null);
    try {
      const result = await retryFailed();
      setLastRetry(JSON.stringify(result, null, 2));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handlePromote()}
          disabled={promoting || retrying}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {promoting ? "Promoting…" : "Promote approved (API store)"}
        </button>
        <button
          type="button"
          onClick={() => void handleRetryFailed()}
          disabled={promoting || retrying}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 disabled:opacity-60"
        >
          {retrying ? "Retrying…" : "Retry failed"}
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800"
        >
          Refresh
        </button>
      </div>

      {lastPromote ? (
        <pre className="max-h-48 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
          {lastPromote}
        </pre>
      ) : null}
      {lastRetry ? (
        <pre className="max-h-48 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
          {lastRetry}
        </pre>
      ) : null}

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No rows in the API review store. Populate{" "}
            <code className="rounded bg-neutral-100 px-1">services/api/data/encyclopedia/review-store.json</code>{" "}
            or use the CLI.
          </p>
        ) : null}
        {items.map((item) => (
          <div
            key={item.slug}
            className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="font-semibold text-neutral-900">{item.title}</div>
            <div className="text-sm text-neutral-600">
              Review: {item.reviewStatus} · Publish: {item.publishStatus}
              {item.source ? (
                <>
                  {" "}
                  · Source: {item.source}
                  {item.sourceDetail ? ` (${item.sourceDetail})` : null}
                  {item.importedAt ? ` · Imported ${item.importedAt}` : null}
                </>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleApprove(item.slug)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => void handleReject(item.slug)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800"
              >
                Reject
              </button>
            </div>
            {item.promotionErrors && item.promotionErrors.length > 0 ? (
              <div className="text-xs text-red-600">{item.promotionErrors.join(", ")}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
