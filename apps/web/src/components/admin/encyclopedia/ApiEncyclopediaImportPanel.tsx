"use client";

import { useState } from "react";
import {
  importReviewRecords,
  type ApiImportReviewResult,
} from "@/lib/api/encyclopediaReview";

export default function ApiEncyclopediaImportPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiImportReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runImport() {
    try {
      setLoading(true);
      setError(null);
      const next = await importReviewRecords();
      setResult(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-neutral-900">API store import</h2>
        <button
          type="button"
          onClick={() => void runImport()}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Importing…" : "Import review records"}
        </button>
      </div>

      <p className="text-sm text-neutral-600">
        Reads{" "}
        <code className="rounded bg-neutral-100 px-1 text-neutral-800">
          data/encyclopedia/review-import.json
        </code>{" "}
        on the API server (or <code className="rounded bg-neutral-100 px-1">ENCYCLOPEDIA_REVIEW_IMPORT_PATH</code>
        ). Skips slugs already in the store.
      </p>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
        Export the reviewed pipeline corpus from the web app into the API import shape, then run the API
        import. This keeps the current pipeline as the source and avoids manual JSON reshaping. Use{" "}
        <code className="rounded bg-white px-1">npm run export:encyclopedia-review-import</code> in{" "}
        <code className="rounded bg-white px-1">apps/web</code>, then{" "}
        <code className="rounded bg-white px-1">npm run import:encyclopedia-review-records</code> in{" "}
        <code className="rounded bg-white px-1">services/api</code> with{" "}
        <code className="rounded bg-white px-1">ENCYCLOPEDIA_REVIEW_IMPORT_PATH</code> pointing at the exported
        file.
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {result ? (
        <pre className="overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-800">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : (
        <div className="text-sm text-neutral-500">
          Run import to merge new rows into the API-backed review store.
        </div>
      )}
    </section>
  );
}
