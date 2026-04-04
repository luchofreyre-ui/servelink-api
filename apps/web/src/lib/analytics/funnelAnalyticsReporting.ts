import { getFunnelUserPreferences } from "@/lib/analytics/funnelSync";
import {
  countFunnelStageInteractions,
  listRecentFunnelStageEvents,
} from "@/lib/analytics/funnelStageAnalytics";

export type FunnelReportOptions = {
  /** Optional label for the report header (e.g. admin session id). */
  sessionLabel?: string;
};

/**
 * Builds a text summary of local funnel prefs + recent stage events (browser only).
 * On the server, returns a short notice—no localStorage.
 */
export function generateFunnelReport(options?: FunnelReportOptions): string {
  const label = options?.sessionLabel ?? "local session";

  if (typeof window === "undefined") {
    return [
      `Funnel performance report (${label})`,
      "",
      "Detailed metrics are collected in the browser (localStorage).",
      "Open this view client-side to see preferences and recent stage actions.",
    ].join("\n");
  }

  const prefs = getFunnelUserPreferences();
  const counts = countFunnelStageInteractions();
  const recent = listRecentFunnelStageEvents(25);

  const lines: string[] = [
    `Funnel performance report (${label})`,
    "",
    "Preferences:",
    JSON.stringify(prefs, null, 2),
    "",
    "Stage interaction counts:",
    JSON.stringify(counts, null, 2),
    "",
    `Recent stage events (up to ${recent.length}):`,
  ];

  for (const e of recent) {
    lines.push(`- ${e.at} | ${e.stage} | ${JSON.stringify(e.detail)}`);
  }

  return lines.join("\n");
}
