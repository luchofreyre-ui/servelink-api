import { getProductPurchaseUrl } from "@/lib/products/getProductPurchaseUrl";

import {
  deriveComparisonSlug,
  deriveProblemContext,
  deriveProblemUseChips,
} from "./productConversionDerives";
import { TrackedProductContextBuyLink } from "./TrackedProductContextBuyLink";
import { TrackedProductContextLink } from "./TrackedProductContextLink";

type Props = {
  productSlug: string;
};

export function ProductConversionLayer({ productSlug }: Props) {
  const problemContext = deriveProblemContext(productSlug);
  const comparisonSlug = deriveComparisonSlug(productSlug);
  const problemUseChips = deriveProblemUseChips(productSlug);
  const purchaseUrl = getProductPurchaseUrl(productSlug);
  const hasPurchaseUrl = Boolean(purchaseUrl && purchaseUrl !== "#");

  return (
    <div className="mt-6 space-y-4">
      {problemUseChips.length > 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="mb-2 text-sm font-medium">Used for these problems</div>

          <div className="flex flex-wrap gap-2">
            {problemUseChips.map((chip, index) => (
              <TrackedProductContextLink
                key={chip.slug}
                href={chip.href}
                productSlug={productSlug}
                roleLabel="product_problem_chip"
                position={index}
                label={`product_context_chip:${chip.slug}:position_${index}`}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
              >
                {chip.title}
              </TrackedProductContextLink>
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
          <TrackedProductContextLink
            href={`/compare/products/${comparisonSlug}`}
            productSlug={productSlug}
            roleLabel="comparison_entry"
            position={10}
            label={`product_context_compare:${comparisonSlug}`}
            className="text-neutral-700 underline"
          >
            Compare with alternatives →
          </TrackedProductContextLink>
        </div>
      ) : null}

      {hasPurchaseUrl ? (
        <div>
          <TrackedProductContextBuyLink
            href={purchaseUrl}
            productSlug={productSlug}
            position={11}
            label={`product_context_buy:${productSlug}`}
            className="inline-block rounded-lg bg-black px-4 py-2 text-sm text-white"
          >
            Buy this option →
          </TrackedProductContextBuyLink>
        </div>
      ) : null}
    </div>
  );
}
