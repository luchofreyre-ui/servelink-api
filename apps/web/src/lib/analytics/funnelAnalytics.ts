/**
 * Barrel for funnel analytics primitives (prefs, stage counts, events).
 * Used by reporting and dashboards.
 */
export { getFunnelUserPreferences, type FunnelUserPreferences } from "@/lib/analytics/funnelSync";
export {
  countFunnelStageInteractions,
  listRecentFunnelStageEvents,
  type FunnelStageEvent,
} from "@/lib/analytics/funnelStageAnalytics";
