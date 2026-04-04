import type { CleaningProductResearch } from "@/lib/products/productResearchTypes";

type Props = {
  research: CleaningProductResearch;
};

/**
 * Compact “decision layer” above the fold: verdict, best-use chips, and avoid bullets.
 */
export function ProductResearchDecisionPanels({ research }: Props) {
  const verdict = research.verdictSummary?.trim();
  const bestUses = research.useInsteadOf?.filter(Boolean) ?? [];
  const avoidUses = research.commonMisusePatterns?.filter(Boolean) ?? [];

  if (!verdict && bestUses.length === 0 && avoidUses.length === 0) return null;

  return (
    <div className="space-y-4" data-testid="product-research-decision-panels">
      {verdict || bestUses.length ?
        <div className="rounded-xl border border-neutral-200 bg-white p-4" data-testid="product-research-best-for">
          <div className="mb-1 text-sm font-medium">Best for</div>
          {verdict ?
            <div className="mb-2 text-xs text-neutral-600">{verdict}</div>
          : null}
          {bestUses.length ?
            <div className="flex flex-wrap gap-2">
              {bestUses.slice(0, 4).map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700"
                >
                  {item}
                </span>
              ))}
            </div>
          : null}
        </div>
      : null}

      {avoidUses.length ?
        <div className="rounded-xl border border-neutral-200 bg-white p-4" data-testid="product-research-avoid-if">
          <div className="mb-1 text-sm font-medium">Avoid this if</div>
          <ul className="space-y-1 text-xs text-neutral-600">
            {avoidUses.slice(0, 3).map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
          <div className="mt-2 text-xs text-neutral-500">
            If results plateau, switch to a stronger chemistry instead of repeating the same approach.
          </div>
        </div>
      : null}
    </div>
  );
}
