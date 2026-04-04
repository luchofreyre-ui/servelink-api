"use client";

import { TrackedProductContextLink } from "./TrackedProductContextLink";

type Props = {
  productSlug: string;
  comparisonSlug: string;
};

export function ProductComparisonPriorityStrip({ productSlug, comparisonSlug }: Props) {
  return (
    <div
      className="mt-6 rounded-xl border border-neutral-200 bg-white p-4"
      data-testid="product-priority-compare-strip"
    >
      <div className="mb-1 text-sm font-medium">Compare before you buy</div>
      <div className="mb-3 text-xs text-neutral-500">
        See how this stacks up against the strongest alternative for the same job.
      </div>

      <TrackedProductContextLink
        href={`/compare/products/${comparisonSlug}`}
        productSlug={productSlug}
        roleLabel="comparison_entry"
        position={13}
        label={`product_priority_compare:${comparisonSlug}`}
        className="inline-block text-sm font-medium text-neutral-900 underline"
      >
        Open comparison →
      </TrackedProductContextLink>
    </div>
  );
}
