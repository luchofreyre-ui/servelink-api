import type { FunnelGap } from "@/lib/funnel/funnelGapReport";
import { summarizeMonetizationHealth } from "@/lib/funnel/funnelGapExpansion";

type Props = {
  monetizationGaps: FunnelGap[];
};

export function MonetizationHealthDashboard({ monetizationGaps }: Props) {
  const { gapCount, hasGaps } = summarizeMonetizationHealth(monetizationGaps);

  return (
    <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
      <h4 className="text-sm font-medium text-neutral-900">Monetization Health Dashboard</h4>
      <p className="text-sm text-neutral-700">Gap count: {gapCount}</p>
      <p className="text-sm text-neutral-700">Status: {hasGaps ? "Gaps detected" : "No gaps"}</p>
    </div>
  );
}

export default MonetizationHealthDashboard;
