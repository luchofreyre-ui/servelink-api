"use client";

import { useState } from "react";
import { WEB_ENV } from "@/lib/env";

export function RecurringSystemProbe() {
  const [probeResult, setProbeResult] = useState<string | null>(null);
  const [probeError, setProbeError] = useState<string | null>(null);

  async function runProbe(path: string, label: string) {
    setProbeError(null);
    try {
      const res = await fetch(`${WEB_ENV.apiBaseUrl}${path}`, {
        credentials: "include",
      });
      const data = await res.json();
      const result = JSON.stringify({ status: res.status, data }, null, 2);
      console.log(label, { status: res.status, data });
      setProbeResult(result);
    } catch (error) {
      setProbeResult(null);
      setProbeError(error instanceof Error ? error.message : "Recurring probe failed.");
    }
  }

  return (
    <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
      <h3 className="text-lg font-semibold">Recurring System Probe</h3>
      <p className="mt-1 text-sm text-yellow-900">
        Admin-only route probe. Results render inline so operators can copy evidence without blocking the page.
      </p>

      <div className="mt-3 flex flex-col gap-2 text-sm">
        <a href="/admin/ops/recurring" className="text-blue-600 underline">
          Go to /admin/ops/recurring
        </a>

        <button
          type="button"
          onClick={() => void runProbe("/recurring", "RECURRING ROOT")}
          className="rounded bg-black px-3 py-2 text-white"
        >
          Test Recurring Root
        </button>

        <button
          type="button"
          onClick={() => void runProbe("/recurring/debug/routes", "RECURRING DEBUG")}
          className="rounded bg-black px-3 py-2 text-white"
        >
          Test Recurring Debug Routes
        </button>

        {probeError ? (
          <div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-900">
            {probeError}
          </div>
        ) : null}

        {probeResult ? (
          <pre className="max-h-64 overflow-auto rounded border border-yellow-200 bg-white p-3 text-xs text-slate-800">
            {probeResult}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
