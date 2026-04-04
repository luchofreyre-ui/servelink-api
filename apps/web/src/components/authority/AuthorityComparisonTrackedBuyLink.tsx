"use client";

import Link from "next/link";
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
  const outbound = getProductPurchaseUrl(productSlug);
  const internalHref = `/products/${productSlug}`;
  const purchaseOk = outbound !== "#";
  const trackHref = purchaseOk ? outbound : internalHref;
  const onClick = buildProductRecommendationClickHandler({
    productSlug,
    roleLabel,
    position,
    href: trackHref,
    trackingContext,
    pinnedSlugs,
  });

  if (purchaseOk) {
    return (
      <a
        href={outbound}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={internalHref} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
