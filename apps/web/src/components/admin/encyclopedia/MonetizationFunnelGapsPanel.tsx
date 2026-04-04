import type { FunnelGap } from "@/lib/funnel/funnelGapReport";

type Props = {
  monetizationGaps: FunnelGap[];
  monetizationGapLines: string[];
};

export default function MonetizationFunnelGapsPanel({
  monetizationGaps,
  monetizationGapLines,
}: Props) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-2 text-sm font-medium">Monetization funnel gaps</div>

      <div className="mb-3 text-xs text-neutral-500">
        {monetizationGaps.length === 0
          ? "No monetization gaps detected across the tracked execution-first hubs."
          : `${monetizationGaps.length} gap(s) detected across tracked hubs.`}
      </div>

      <div className="space-y-2">
        {monetizationGapLines.slice(0, 10).map((line, i) => (
          <div key={`${i}-${line.slice(0, 48)}`} className="text-xs text-neutral-700">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
