import { summarizeFunnelLabel } from "@/lib/analytics/funnelLabelSummary";

type Counter = Record<string, number>;

export function accumulateFunnelMetrics(labels: string[]): Counter {
  return labels.reduce<Counter>((acc, label) => {
    const stage = summarizeFunnelLabel(label);
    acc[stage] = (acc[stage] ?? 0) + 1;
    return acc;
  }, {});
}

export function computeCTR(clicks: number, impressions: number): number {
  if (!impressions) return 0;
  return clicks / impressions;
}
