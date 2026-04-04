import {
  countFunnelStageInteractions,
  getFunnelUserPreferences,
  listRecentFunnelStageEvents,
  type FunnelStageEvent,
} from "@/lib/analytics/funnelAnalytics";
import type { FunnelUserPreferences } from "@/lib/analytics/funnelSync";

export type FunnelReportOptions = {
  sessionLabel?: string;
};

export type FunnelReportData = {
  sessionLabel: string;
  preferences: FunnelUserPreferences;
  interactions: Record<string, number>;
  events: FunnelStageEvent[];
  serverOnly: boolean;
};

/**
 * Structured funnel snapshot. On the server, prefs/events read as empty (no localStorage).
 */
export function generateFunnelReport(options?: FunnelReportOptions): FunnelReportData {
  const sessionLabel = options?.sessionLabel ?? "";
  const preferences = getFunnelUserPreferences();
  const interactions = countFunnelStageInteractions();
  const events = listRecentFunnelStageEvents(25);

  return {
    sessionLabel,
    preferences,
    interactions,
    events,
    serverOnly: typeof window === "undefined",
  };
}

export function formatFunnelReportAsText(data: FunnelReportData): string {
  return JSON.stringify(data, null, 2);
}
