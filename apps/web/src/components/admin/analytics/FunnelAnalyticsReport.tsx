"use client";

import { useEffect, useState } from "react";

import {
  formatFunnelReportAsText,
  generateFunnelReport,
  type FunnelReportData,
} from "@/lib/analytics/funnelAnalyticsReporting";

type Props = {
  userId?: string;
};

export function FunnelAnalyticsReport({ userId = "local-session" }: Props) {
  const [report, setReport] = useState<FunnelReportData | null>(null);

  useEffect(() => {
    const reportData = generateFunnelReport({ sessionLabel: userId });
    setReport(reportData);
  }, [userId]);

  if (!report) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <p className="text-sm text-neutral-600">Loading…</p>
      </div>
    );
  }

  if (report.serverOnly) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <pre className="max-h-96 overflow-auto text-xs text-neutral-700">{formatFunnelReportAsText(report)}</pre>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="mb-2 font-[var(--font-poppins)] text-base font-semibold text-neutral-900">Funnel Report</h3>
      <p className="mb-1 text-xs text-neutral-700">
        Preferences: {JSON.stringify(report.preferences)}
      </p>
      <p className="mb-1 text-xs text-neutral-700">
        Interactions: {JSON.stringify(report.interactions)}
      </p>
      <p className="text-xs text-neutral-700">Recent Events: {JSON.stringify(report.events)}</p>
    </div>
  );
}

export default FunnelAnalyticsReport;
