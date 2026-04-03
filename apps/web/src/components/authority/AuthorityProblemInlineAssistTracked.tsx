"use client";

import { InlineProductAssist } from "@/components/products/InlineProductAssist";
import { buildProductRecommendationClickHandler } from "@/lib/products/productRecommendationTracking";

type Props = {
  viewHref: string;
  buyHref: string | null;
  topProductSlug: string | null;
  problemSlug: string;
  intent: string | null;
};

/**
 * Client boundary: click handlers for inline assist (cannot be created in the server problem page).
 * Handler logic matches AuthorityProblemDetailPage spec (inline_product_assist).
 */
export function AuthorityProblemInlineAssistTracked({
  viewHref,
  buyHref,
  topProductSlug,
  problemSlug,
  intent,
}: Props) {
  const handleInlineAssistViewClick = buildProductRecommendationClickHandler({
    productSlug: topProductSlug ?? "unknown",
    roleLabel: "Start here",
    position: 1,
    href: viewHref,
    trackingContext: {
      pageType: "problem_page",
      sourcePageType: "inline_product_assist",
      problemSlug,
      intent,
    },
  });

  const handleInlineAssistBuyClick = topProductSlug
    ? buildProductRecommendationClickHandler({
        productSlug: topProductSlug,
        roleLabel: "Start here",
        position: 1,
        href: buyHref ?? "",
        trackingContext: {
          pageType: "problem_page",
          sourcePageType: "inline_product_assist",
          problemSlug,
          intent,
        },
      })
    : undefined;

  return (
    <InlineProductAssist
      viewHref={viewHref}
      buyHref={buyHref}
      onViewClick={handleInlineAssistViewClick}
      onBuyClick={handleInlineAssistBuyClick}
    />
  );
}
