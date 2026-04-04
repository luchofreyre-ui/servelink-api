import { buildFunnelGapReport, type FunnelGap } from "./funnelGapReport";

/**
 * Expansion / ops hook: same data as {@link buildFunnelGapReport}.
 * Call from scheduled jobs or admin scripts to flag unmonetized coverage.
 */
export function checkForMonetizationGaps(): FunnelGap[] {
  return buildFunnelGapReport();
}

/** Logs each gap with `console.warn` for cron / CLI visibility. */
export function reportMonetizationGapsToConsole(): void {
  const gaps = buildFunnelGapReport();
  if (gaps.length === 0) {
    console.log("[monetization] No funnel gaps detected for tracked hubs.");
    return;
  }
  for (const g of gaps) {
    console.warn(`[monetization] ${g.problemSlug} [${g.code}] ${g.detail}`);
  }
}
