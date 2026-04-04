import Link from "next/link";

import { deriveComparisonSlug, deriveProblemContext } from "@/lib/products/productConversionLayer";

export function ProductConversionLayer({ productSlug }: { productSlug: string }) {
  const problemContext = deriveProblemContext(productSlug);
  const relatedComparison = deriveComparisonSlug(productSlug);

  return (
    <>
      {problemContext ? (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="mb-1 text-sm font-medium">Why this works for your problem</div>

          <div className="text-xs text-neutral-600">{problemContext}</div>
        </div>
      ) : null}

      <div className="mt-6 text-xs text-neutral-500">
        If this doesn’t fully remove the buildup, move to a stronger option instead of repeating the same
        process.
      </div>

      {relatedComparison ? (
        <div className="mt-4 text-xs">
          <Link href={`/compare/products/${relatedComparison}`} className="underline">
            Compare with alternatives →
          </Link>
        </div>
      ) : null}
    </>
  );
}
