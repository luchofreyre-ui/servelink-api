"use client";

import { ProductPurchaseActions } from "@/components/products/ProductPurchaseActions";
import { getProductPurchaseUrl } from "@/lib/products/getProductPurchaseUrl";
import { buildProductRecommendationClickHandler } from "@/lib/products/productRecommendationTracking";
import type { ProductRecommendationTrackingContext } from "@/lib/products/productRecommendationTrackingTypes";

type ProductSubset = {
  name?: string;
  slug?: string;
  amazonUrl?: string | null;
  amazonAffiliateUrl?: string | null;
  isPurchaseAvailable?: boolean | null;
  buyLabel?: string | null;
};

type TrackedProductPurchaseActionsProps = {
  product: ProductSubset;
  /** Internal PDP link for “details”; defaults to `/products/{slug}` when slug present. */
  viewHref?: string;
  trackingContext: ProductRecommendationTrackingContext;
  recommendationPosition: number;
  roleLabel?: string | null;
  pinnedProductSlugs?: readonly string[];
  compact?: boolean;
  usedForSummary?: string | null;
  forcePrimary?: boolean;
  highlight?: boolean;
  viewDetailsLabel?: string;
  inlineCtas?: boolean;
};

export function TrackedProductPurchaseActions({
  product,
  viewHref,
  trackingContext,
  recommendationPosition,
  roleLabel,
  pinnedProductSlugs,
  ...purchaseProps
}: TrackedProductPurchaseActionsProps) {
  const slug = product.slug?.trim();
  const resolvedViewHref = viewHref ?? (slug ? `/products/${slug}` : undefined);
  const purchaseUrlRaw = slug ? getProductPurchaseUrl(slug) : null;
  const purchaseUrl = purchaseUrlRaw && purchaseUrlRaw !== "#" ? purchaseUrlRaw : null;

  const track = (href: string) => {
    if (!slug) return;
    buildProductRecommendationClickHandler({
      productSlug: slug,
      roleLabel,
      position: recommendationPosition,
      href,
      trackingContext,
      pinnedSlugs: pinnedProductSlugs,
    })();
  };

  return (
    <ProductPurchaseActions
      {...purchaseProps}
      product={product}
      viewHref={resolvedViewHref}
      onPrimaryNavigationClick={
        slug && resolvedViewHref
          ? purchaseUrl
            ? () => track(purchaseUrl)
            : () => track(resolvedViewHref)
          : undefined
      }
      onSecondaryNavigationClick={slug && resolvedViewHref ? () => track(resolvedViewHref) : undefined}
    />
  );
}
