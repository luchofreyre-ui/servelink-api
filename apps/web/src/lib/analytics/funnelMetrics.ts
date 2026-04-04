import { countFunnelStageInteractions } from "@/lib/analytics/funnelStageAnalytics";
import { parseFunnelStageFromLabel } from "@/lib/analytics/funnelLabelSummary";

type Counter = Record<string, number>;

export function accumulateFunnelMetrics(labels: string[]): Counter {
  return labels.reduce<Counter>((acc, label) => {
    const stage = parseFunnelStageFromLabel(label);
    acc[stage] = (acc[stage] ?? 0) + 1;
    return acc;
  }, {});
}

export function computeCTR(clicks: number, impressions: number): number {
  if (!impressions) return 0;
  return clicks / impressions;
}

/** Merges live client funnel events with optional batch label counts. */
export function mergeFunnelStageCounts(
  labelCounts: Counter,
  liveCounts?: Record<string, number>,
): Counter {
  const live = liveCounts ?? countFunnelStageInteractions();
  const out: Counter = { ...labelCounts };
  for (const [k, v] of Object.entries(live)) {
    out[k] = (out[k] ?? 0) + v;
  }
  return out;
}
