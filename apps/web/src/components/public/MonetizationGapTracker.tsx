import { formatFunnelGapLines } from "@/lib/funnel/funnelGapAudit";
import { buildFunnelGapReport } from "@/lib/funnel/funnelGapReport";

/** Server component: read-only funnel status for transparency pages. */
export function MonetizationGapTracker() {
  const gaps = buildFunnelGapReport();
  const gapLines = formatFunnelGapLines(gaps);
  const isHealthy = gaps.length === 0;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium text-[#0F172A]">Monetization funnel gaps</div>
      <p className="mb-3 text-xs text-neutral-500">
        Tracked execution-first problem hubs: compare path, purchase link, and research coverage for the
        resolved best product.
      </p>
      {isHealthy ?
        <div className="text-sm text-neutral-700">{gapLines[0]}</div>
      : <div className="space-y-2 text-xs text-neutral-700">
          {gapLines.map((line, index) => (
            <div key={`${index}-${line.slice(0, 32)}`} className="border-b border-neutral-100 pb-2 last:border-0">
              {line}
            </div>
          ))}
        </div>
      }
    </div>
  );
}
