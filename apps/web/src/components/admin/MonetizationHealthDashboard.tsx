import { formatFunnelGapLines } from "@/lib/funnel/funnelGapAudit";
import type { FunnelGap } from "@/lib/funnel/funnelGapReport";

type Props = {
  monetizationGaps: FunnelGap[];
  monetizationGapLines: string[];
};

/**
 * Server-fed monetization snapshot (gap report is not available in the browser bundle).
 */
export function MonetizationHealthDashboard({ monetizationGaps, monetizationGapLines }: Props) {
  const gapCount = monetizationGaps.length;
  const lines =
    monetizationGapLines.length > 0 ?
      monetizationGapLines
    : formatFunnelGapLines(monetizationGaps);
  const status = gapCount === 0 ? "Healthy" : "Issues detected";

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-medium text-neutral-900">Monetization health</h2>
      <div className="text-sm text-neutral-700">
        Status:{" "}
        <span className={gapCount === 0 ? "font-medium text-emerald-700" : "font-medium text-amber-800"}>
          {status}
        </span>
        <span className="text-neutral-500"> — {gapCount} gap(s) on server snapshot</span>
      </div>
      <ul className="max-h-48 list-inside list-disc space-y-1 overflow-y-auto text-xs text-neutral-600">
        {lines.map((line, idx) => (
          <li key={`${idx}-${line.slice(0, 40)}`}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
