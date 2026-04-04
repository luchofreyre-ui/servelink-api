"use client";

import { useEffect, useState } from "react";

import {
  formatFunnelReportAsText,
  generateFunnelReport,
  type FunnelReportData,
} from "@/lib/analytics/funnelAnalyticsReporting";

type Props = {
  /** Label for this report instance (browser-local data only). */
  userId?: string;
};

export function FunnelAnalyticsReport({ userId = "local-session" }: Props) {
  const [report, setReport] = useState<FunnelReportData | null>(null);

  useEffect(() => {
    const reportData = generateFunnelReport({ sessionLabel: userId });
    setReport(reportData);
  }, [userId]);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-medium text-neutral-900">Funnel analytics report</h2>
      <p className="mb-3 text-xs text-neutral-500">
        Browser-local snapshot: preferences, stage interaction counts, and recent events.
      </p>
      {!report ?
        <p className="text-sm text-neutral-600">Loading…</p>
      : report.serverOnly ?
        <p className="text-sm text-neutral-600">{formatFunnelReportAsText(report)}</p>
      : <div className="space-y-4 text-xs text-neutral-700">
          <div>
            <div className="mb-1 font-medium text-neutral-800">Preferences</div>
            <pre className="max-h-32 overflow-auto rounded-md bg-neutral-50 p-2 whitespace-pre-wrap break-words">
              {JSON.stringify(report.preferences, null, 2)}
            </pre>
          </div>
          <div>
            <div className="mb-1 font-medium text-neutral-800">Interactions by stage</div>
            <pre className="max-h-32 overflow-auto rounded-md bg-neutral-50 p-2 whitespace-pre-wrap break-words">
              {JSON.stringify(report.interactions, null, 2)}
            </pre>
          </div>
          <div>
            <div className="mb-1 font-medium text-neutral-800">Recent events (up to 25)</div>
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md bg-neutral-50 p-2">
              {report.events.length === 0 ?
                <li className="text-neutral-500">No events recorded yet.</li>
              : report.events.map((e) => (
                  <li key={e.id} className="border-b border-neutral-100 pb-1 last:border-0">
                    <span className="text-neutral-400">{e.at}</span>
                    {" · "}
                    <span className="font-medium">{e.stage}</span>
                    <pre className="mt-0.5 whitespace-pre-wrap break-words text-[11px] text-neutral-600">
                      {JSON.stringify(e.detail)}
                    </pre>
                  </li>
                ))
              }
            </ul>
          </div>
        </div>
      }
    </div>
  );
}

export default FunnelAnalyticsReport;
