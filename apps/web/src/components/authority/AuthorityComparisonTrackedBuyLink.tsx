"use client";

import type { ReactNode } from "react";

import { buildProductRecommendationClickHandler } from "@/lib/products/productRecommendationTracking";
import type { ProductRecommendationTrackingContext } from "@/lib/products/productRecommendationTrackingTypes";
import { getProductPurchaseUrl } from "@/lib/products/getProductPurchaseUrl";

type AuthorityComparisonTrackedBuyLinkProps = {
  productSlug: string;
  roleLabel: string | null;
  position: number;
  trackingContext?: ProductRecommendationTrackingContext;
  pinnedSlugs?: readonly string[];
  className?: string;
  children: ReactNode;
};

export function AuthorityComparisonTrackedBuyLink({
  productSlug,
  roleLabel,
  position,
  trackingContext,
  pinnedSlugs,
  className,
  children,
}: AuthorityComparisonTrackedBuyLinkProps) {
  const href = getProductPurchaseUrl(productSlug);
  const onClick = buildProductRecommendationClickHandler({
    productSlug,
    roleLabel,
    position,
    href,
    trackingContext,
    pinnedSlugs,
  });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
