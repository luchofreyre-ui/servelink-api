import type { FunnelUserPreferences } from "@/lib/analytics/funnelSync";
import {
  countFunnelStageInteractions,
  getFunnelUserPreferences,
  listRecentFunnelStageEvents,
  type FunnelStageEvent,
} from "@/lib/analytics/funnelAnalytics";

export type FunnelReportOptions = {
  sessionLabel?: string;
};

export type FunnelReportData = {
  sessionLabel: string;
  /** True when built on the server — no localStorage reads. */
  serverOnly?: boolean;
  preferences: FunnelUserPreferences;
  interactions: Record<string, number>;
  events: FunnelStageEvent[];
};

/**
 * Structured funnel snapshot: preferences, per-stage counts, and recent events.
 * In the browser reads localStorage; on the server returns empty structures + `serverOnly`.
 */
export function generateFunnelReport(options?: FunnelReportOptions): FunnelReportData {
  const sessionLabel = options?.sessionLabel ?? "";

  if (typeof window === "undefined") {
    return {
      sessionLabel,
      serverOnly: true,
      preferences: {},
      interactions: {},
      events: [],
    };
  }

  return {
    sessionLabel,
    preferences: getFunnelUserPreferences(),
    interactions: countFunnelStageInteractions(),
    events: listRecentFunnelStageEvents(25),
  };
}

/** Plain-text view for logs or copy/export. */
export function formatFunnelReportAsText(data: FunnelReportData): string {
  if (data.serverOnly) {
    return [
      `Funnel performance report (${data.sessionLabel || "local session"})`,
      "",
      "Detailed metrics are collected in the browser (localStorage).",
      "Open this view client-side to see preferences and recent stage actions.",
    ].join("\n");
  }

  const lines: string[] = [
    `Funnel performance report (${data.sessionLabel || "local session"})`,
    "",
    "Preferences:",
    JSON.stringify(data.preferences, null, 2),
    "",
    "Stage interaction counts:",
    JSON.stringify(data.interactions, null, 2),
    "",
    `Recent stage events (up to ${data.events.length}):`,
  ];

  for (const e of data.events) {
    lines.push(`- ${e.at} | ${e.stage} | ${JSON.stringify(e.detail)}`);
  }

  return lines.join("\n");
}
