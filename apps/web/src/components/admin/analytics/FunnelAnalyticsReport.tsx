"use client";

import { useEffect, useState } from "react";

import { generateFunnelReport } from "@/lib/analytics/funnelAnalyticsReporting";

type Props = {
  /** Display label only; data is always from this browser’s localStorage. */
  userId?: string;
};

export function FunnelAnalyticsReport({ userId = "local-session" }: Props) {
  const [report, setReport] = useState<string>("");

  useEffect(() => {
    setReport(generateFunnelReport({ sessionLabel: userId }));
  }, [userId]);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-medium text-neutral-900">Funnel analytics report</h2>
      <p className="mb-2 text-xs text-neutral-500">
        Browser-local snapshot (preferences + recent funnel stage events).
      </p>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs text-neutral-700">
        {report || "Loading…"}
      </pre>
    </div>
  );
}
