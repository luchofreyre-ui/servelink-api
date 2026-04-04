"use client";

import Link from "next/link";

import {
  buildProductRecommendationClickHandler,
  trackProductRecommendationClick,
} from "@/lib/products/productRecommendationTracking";
import { hasComparePage } from "@/lib/products/compareAvailability";
import { buildCompareProductsHref } from "@/lib/products/compareSlugBuilder";
import { getProductPurchaseUrl } from "@/lib/products/getProductPurchaseUrl";

const tracking = (problemSlug: string) => ({
  pageType: "problem_page" as const,
  sourcePageType: "problem" as const,
  problemSlug,
});

function trackingRoleLabelForRow(index: number): string {
  if (index === 0) return "Best overall";
  if (index === 1) return "Heavy";
  return "Maintenance";
}

function displayRoleLabelForRow(index: number): string {
  if (index === 0) return "Best overall";
  if (index === 1) return "Stronger option";
  return "Maintenance";
}

type ScenarioProducts = {
  products?: { slug: string; name?: string }[];
};

/**
 * Top-fold 3-role product selector (execution-first problem hubs).
 * Ordering: products[0] best overall, [1] heavy, [2] maintenance — max 3 rows.
 */
export function AuthorityProblemScenarioTopBuyCard({
  scenario,
  problemSlug,
}: {
  scenario: ScenarioProducts;
  problemSlug: string;
}) {
  const products = (scenario.products ?? []).slice(0, 3);
  if (products.length === 0) return null;

  const t = tracking(problemSlug);
  const topTwo = products.slice(0, 2);
  const canCompare = products.length >= 2 && hasComparePage(topTwo);
  const compareHref = canCompare ? buildCompareProductsHref(topTwo) : null;
  const onCompareClick =
    compareHref ?
      () => {
        trackProductRecommendationClick({
          eventName: "product_recommendation_click",
          productSlug: products[0]!.slug,
          roleLabel: "comparison_entry",
          position: 0,
          pageType: t.pageType,
          sourcePageType: t.sourcePageType,
          problemSlug: t.problemSlug,
          surfaceSlug: null,
          intent: null,
          isPinned: false,
          destinationType: "compare",
          destinationUrl: compareHref,
        });
      }
    : undefined;

  return (
    <div className="mt-4 rounded-xl border border-stone-200/80 bg-white p-4">
      <div className="mb-2 text-sm font-medium text-[#0F172A]">
        Most effective option for this problem
      </div>
      <div className="mb-2 text-xs text-neutral-600">
        This is the fastest way to get results without trial and error.
      </div>

      <div className="mt-3 space-y-2">
        {products.map((p, index) => {
          const href = getProductPurchaseUrl(p.slug);
          const internalHref = `/products/${p.slug}`;
          const purchaseOk = href !== "#";
          const trackHref = purchaseOk ? href : internalHref;
          const onClick = buildProductRecommendationClickHandler({
            productSlug: p.slug,
            roleLabel: trackingRoleLabelForRow(index),
            position: index,
            href: trackHref,
            trackingContext: t,
          });
          const displayName = p.name?.trim() || p.slug;

          return (
            <div
              key={p.slug}
              className="flex items-center justify-between gap-3 rounded-lg border border-stone-200/90 px-3 py-2"
            >
              <div className="min-w-0 text-sm">
                <div className="font-medium text-[#0F172A]">{displayName}</div>
                <div className="text-xs text-neutral-500">{displayRoleLabelForRow(index)}</div>
              </div>

              {purchaseOk ?
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="shrink-0 text-sm text-[#0D9488] underline"
                  onClick={onClick}
                >
                  Buy →
                </a>
              : (
                <Link href={internalHref} className="shrink-0 text-sm text-neutral-600 underline" onClick={onClick}>
                  View details →
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {canCompare && compareHref ?
        <div className="mt-3 text-xs">
          <a
            href={compareHref}
            className="text-neutral-600 underline"
            onClick={onCompareClick}
          >
            Compare top options →
          </a>
        </div>
      : null}

      <div className="mt-2 text-xs text-neutral-500">
        Used in this method. No guesswork required.
      </div>
    </div>
  );
}

/**
 * Inline reinforcement below the primary method / “why this works” content.
 */
export function AuthorityProblemScenarioMethodReinforceLink({
  productSlug,
  problemSlug,
  roleLabel = "Best overall",
  compareProducts,
}: {
  productSlug: string;
  problemSlug: string;
  /** Tracking role aligned with the reinforced row (best / heavy / maintenance). */
  roleLabel?: string;
  /** Same scenario list as the top card; used for optional compare link (top two only). */
  compareProducts?: { slug: string }[];
}) {
  const href = getProductPurchaseUrl(productSlug);
  const internalHref = `/products/${productSlug}`;
  const purchaseOk = href !== "#";
  const trackHref = purchaseOk ? href : internalHref;
  const onClick = buildProductRecommendationClickHandler({
    productSlug,
    roleLabel,
    position: 1,
    href: trackHref,
    trackingContext: tracking(problemSlug),
  });

  const t = tracking(problemSlug);
  const compareSlice = compareProducts?.slice(0, 2) ?? [];
  const canCompare = compareSlice.length >= 2 && hasComparePage(compareSlice);
  const compareHref = canCompare ? buildCompareProductsHref(compareSlice) : null;
  const onCompareFromReinforceClick =
    compareHref ?
      () => {
        trackProductRecommendationClick({
          eventName: "product_recommendation_click",
          productSlug: compareSlice[0]!.slug,
          roleLabel: "comparison_entry",
          position: 2,
          pageType: t.pageType,
          sourcePageType: t.sourcePageType,
          problemSlug: t.problemSlug,
          surfaceSlug: null,
          intent: null,
          isPinned: false,
          destinationType: "compare",
          destinationUrl: compareHref,
        });
      }
    : undefined;

  return (
    <>
      <div className="mt-6 text-sm">
        {purchaseOk ?
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="text-[#0D9488] underline"
            onClick={onClick}
          >
            Use this product for best results →
          </a>
        : (
          <Link href={internalHref} className="text-neutral-600 underline" onClick={onClick}>
            View product details →
          </Link>
        )}
      </div>
      {canCompare && compareHref ?
        <div className="mt-2 text-xs">
          <a href={compareHref} className="text-neutral-500 underline" onClick={onCompareFromReinforceClick}>
            Not sure? Compare them →
          </a>
        </div>
      : null}
    </>
  );
}
