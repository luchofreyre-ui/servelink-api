"use client";

import { InlineProductAssist, type InlineAssistProduct } from "@/components/products/InlineProductAssist";
import { buildProductRecommendationClickHandler } from "@/lib/products/productRecommendationTracking";

type Props = {
  topPick: InlineAssistProduct | null;
  secondaryPick: InlineAssistProduct | null;
  buyHref: string | null;
  problemSlug: string;
  intent: string | null;
};

const trackingBase = (problemSlug: string, intent: string | null) => ({
  pageType: "problem_page" as const,
  sourcePageType: "inline_product_assist" as const,
  problemSlug,
  intent,
});

/**
 * Client boundary: click handlers for inline assist (cannot be created in the server problem page).
 */
export function AuthorityProblemInlineAssistTracked({
  topPick,
  secondaryPick,
  buyHref,
  problemSlug,
  intent,
}: Props) {
  const t = trackingBase(problemSlug, intent);

  const handleBuyClick =
    topPick && buyHref
      ? buildProductRecommendationClickHandler({
          productSlug: topPick.slug,
          roleLabel: "Start here",
          position: 1,
          href: buyHref,
          trackingContext: t,
        })
      : undefined;

  const handleCompareClick = () => {
    buildProductRecommendationClickHandler({
      productSlug: topPick?.slug ?? "unknown",
      roleLabel: "Start here",
      position: 1,
      href: "#problem-products",
      trackingContext: t,
    })();
    document.getElementById("problem-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleThumbnailClick = (slug: string) => {
    const position = slug === topPick?.slug ? 1 : 2;
    buildProductRecommendationClickHandler({
      productSlug: slug,
      roleLabel: "Start here",
      position,
      href: `/products/${slug}`,
      trackingContext: t,
    })();
  };

  return (
    <InlineProductAssist
      topPick={topPick}
      secondaryPick={secondaryPick}
      buyHref={buyHref}
      onBuyClick={handleBuyClick}
      onCompareClick={handleCompareClick}
      onThumbnailClick={handleThumbnailClick}
    />
  );
}
