"use client";

import Link from "next/link";

import { buildCompareProductsHref, buildCompareSlug } from "@/lib/products/compareSlugBuilder";
import { hasComparePage } from "@/lib/products/compareAvailability";
import { getProductPurchaseUrl } from "@/lib/products/getProductPurchaseUrl";
import {
  getRecommendationDestinationType,
  normalizeRoleLabel,
  trackProductRecommendationClick,
} from "@/lib/products/productRecommendationTracking";

type Props = {
  problemSlug: string;
  bestProductSlug: string;
  compareProducts: { slug: string }[];
};

export function AuthorityProblemBestNextMoveClose({ problemSlug, bestProductSlug, compareProducts }: Props) {
  const topTwo = compareProducts.slice(0, 2);
  const canCompare = topTwo.length >= 2 && hasComparePage(topTwo);
  const compareHref = canCompare ? buildCompareProductsHref(topTwo) : null;
  const compareSegment = canCompare ? buildCompareSlug(topTwo) : null;

  const purchaseHref = getProductPurchaseUrl(bestProductSlug);
  const purchaseOk = purchaseHref !== "#";
  const productDetailsHref = `/products/${bestProductSlug}`;
  const allProductsHref = `/problems/${problemSlug}#problem-products`;

  const base = {
    pageType: "problem_page" as const,
    sourcePageType: "problem" as const,
    problemSlug,
    surfaceSlug: null as string | null,
    intent: null as string | null,
  };

  const trackBuy = (destinationUrl: string) => {
    trackProductRecommendationClick({
      eventName: "product_recommendation_click",
      productSlug: bestProductSlug,
      roleLabel: normalizeRoleLabel("Best overall"),
      position: 30,
      pageType: base.pageType,
      sourcePageType: base.sourcePageType,
      problemSlug: base.problemSlug,
      surfaceSlug: base.surfaceSlug,
      intent: base.intent,
      isPinned: false,
      destinationType: getRecommendationDestinationType(destinationUrl),
      destinationUrl,
      label: `authority_close_buy:${bestProductSlug}`,
    });
  };

  return (
    <div
      className="mb-8 max-w-3xl rounded-xl border border-stone-200/90 bg-white p-5 shadow-sm"
      data-testid="authority-problem-best-next-move"
    >
      <div className="mb-1 text-sm font-semibold text-[#0F172A]">Best next move</div>
      <p className="mb-4 text-xs text-neutral-600">
        Start with the strongest recommended option for this problem.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {purchaseOk ?
          <a
            href={purchaseHref}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white"
            onClick={() => trackBuy(purchaseHref)}
          >
            Buy the recommended option →
          </a>
        : (
          <Link
            href={productDetailsHref}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-900 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
            onClick={() => trackBuy(productDetailsHref)}
          >
            View recommended product →
          </Link>
        )}

        {canCompare && compareHref && compareSegment ?
          <a
            href={compareHref}
            className="inline-flex items-center justify-center rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-stone-50"
            onClick={() => {
              trackProductRecommendationClick({
                eventName: "product_recommendation_click",
                productSlug: topTwo[0]!.slug,
                roleLabel: normalizeRoleLabel("comparison_entry"),
                position: 31,
                pageType: base.pageType,
                sourcePageType: base.sourcePageType,
                problemSlug: base.problemSlug,
                surfaceSlug: base.surfaceSlug,
                intent: base.intent,
                isPinned: false,
                destinationType: "compare",
                destinationUrl: compareHref,
                label: `authority_close_compare:${compareSegment}`,
              });
            }}
          >
            Compare top options →
          </a>
        : null}
      </div>

      <div className="mt-4 text-xs">
        <Link
          href={allProductsHref}
          className="text-neutral-600 underline"
          onClick={() => {
            trackProductRecommendationClick({
              eventName: "product_recommendation_click",
              productSlug: bestProductSlug,
              roleLabel: normalizeRoleLabel("comparison_entry"),
              position: 32,
              pageType: base.pageType,
              sourcePageType: base.sourcePageType,
              problemSlug: base.problemSlug,
              surfaceSlug: base.surfaceSlug,
              intent: base.intent,
              isPinned: false,
              destinationType: getRecommendationDestinationType(allProductsHref),
              destinationUrl: allProductsHref,
              label: `authority_close_products:${problemSlug}`,
            });
          }}
        >
          See all recommended products
        </Link>
      </div>
    </div>
  );
}
