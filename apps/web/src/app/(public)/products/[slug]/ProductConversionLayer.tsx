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
  const primaryProblem = problemUseChips[0] ?? null;

  return (
    <div className="mt-6 space-y-4">
      {primaryProblem ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="mb-1 text-sm font-medium">Best fit problem page</div>
          <div className="mb-3 text-xs text-neutral-500">
            Start with the exact cleaning guide this product is most closely tied to.
          </div>

          <TrackedProductContextLink
            href={primaryProblem.href}
            productSlug={productSlug}
            roleLabel="product_problem_chip"
            position={0}
            label={`product_primary_problem:${primaryProblem.slug}`}
            className="inline-block rounded-lg border border-neutral-900 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            {primaryProblem.title}
          </TrackedProductContextLink>
        </div>
      ) : null}

      {problemUseChips.length > 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="mb-1 text-sm font-medium">Used for these problems</div>
          <div className="mb-3 text-xs text-neutral-500">
            Go straight to the exact cleaning problem this product is used for.
          </div>

          <div className="flex flex-wrap gap-2">
            {problemUseChips.map((chip, index) => (
              <TrackedProductContextLink
                key={chip.slug}
                href={chip.href}
                productSlug={productSlug}
                roleLabel="product_problem_chip"
                position={index + 1}
                label={`product_context_chip:${chip.slug}:position_${index + 1}`}
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
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="mb-1 text-sm font-medium">Not fully sure yet?</div>
          <div className="mb-3 text-xs text-neutral-500">
            Compare this product against the strongest alternative before you buy.
          </div>

          <TrackedProductContextLink
            href={`/compare/products/${comparisonSlug}`}
            productSlug={productSlug}
            roleLabel="comparison_entry"
            position={10}
            label={`product_context_compare:${comparisonSlug}`}
            className="text-xs text-neutral-700 underline"
          >
            Compare with alternatives →
          </TrackedProductContextLink>
        </div>
      ) : null}

      {hasPurchaseUrl ? (
        <div className="space-y-3">
          <TrackedProductContextBuyLink
            href={purchaseUrl}
            productSlug={productSlug}
            position={11}
            label={`product_context_buy:${productSlug}:primary`}
            className="inline-block rounded-lg bg-black px-4 py-2 text-sm text-white"
          >
            Buy this option →
          </TrackedProductContextBuyLink>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="mb-1 text-sm font-medium">Ready to move forward?</div>
            <div className="mb-3 text-xs text-neutral-500">
              This sends you straight to the current purchase page for this product.
            </div>

            <TrackedProductContextBuyLink
              href={purchaseUrl}
              productSlug={productSlug}
              position={12}
              label={`product_context_buy:${productSlug}:secondary`}
              className="inline-block rounded-lg border border-neutral-900 px-4 py-2 text-sm text-neutral-900"
            >
              Buy this product now →
            </TrackedProductContextBuyLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}
