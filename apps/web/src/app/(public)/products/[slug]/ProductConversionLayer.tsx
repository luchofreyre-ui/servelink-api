import Link from "next/link";

import {
  deriveComparisonSlug,
  deriveProblemContext,
  deriveProblemUseChips,
} from "./productConversionDerives";

type Props = {
  productSlug: string;
};

export function ProductConversionLayer({ productSlug }: Props) {
  const problemContext = deriveProblemContext(productSlug);
  const comparisonSlug = deriveComparisonSlug(productSlug);
  const problemUseChips = deriveProblemUseChips(productSlug);

  return (
    <div className="mt-6 space-y-4">
      {problemUseChips.length > 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="mb-2 text-sm font-medium">Used for these problems</div>

          <div className="flex flex-wrap gap-2">
            {problemUseChips.map((chip) => (
              <Link
                key={chip.slug}
                href={chip.href}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
              >
                {chip.title}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {problemContext ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="mb-1 text-sm font-medium">Why this works for your problem</div>

          <div className="text-xs text-neutral-600">{problemContext}</div>
        </div>
      ) : null}

      <div className="text-xs text-neutral-500">
        If this doesn’t fully remove the buildup, move to a stronger option instead of repeating the same
        process.
      </div>

      {comparisonSlug ? (
        <div className="text-xs">
          <Link href={`/compare/products/${comparisonSlug}`} className="text-neutral-700 underline">
            Compare with alternatives →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
