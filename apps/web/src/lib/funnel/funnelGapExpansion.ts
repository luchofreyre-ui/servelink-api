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

/**
 * On-demand expansion check: highlights common unmonetized paths (compare, research)
 * plus a generic line for other gap codes. Use from admin or scheduled jobs.
 */
export function warnMonetizationExpansionGaps(): void {
  const gaps = buildFunnelGapReport();
  if (gaps.length === 0) {
    console.log("[monetization:expansion] No funnel gaps detected for tracked hubs.");
    return;
  }
  for (const gap of gaps) {
    if (gap.code === "missing_compare") {
      console.warn(`[monetization:expansion] Missing compare page for ${gap.problemSlug}`);
    } else if (gap.code === "missing_research") {
      console.warn(`[monetization:expansion] Missing research for ${gap.problemSlug}`);
    } else {
      console.warn(
        `[monetization:expansion] ${gap.problemSlug} [${gap.code}] ${gap.detail}`,
      );
    }
  }
}
