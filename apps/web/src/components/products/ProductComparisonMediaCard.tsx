"use client";

import Link from "next/link";

import { ProductImageGalleryMini } from "@/components/products/ProductImageGalleryMini";
import { TrackedProductPurchaseActions } from "@/components/products/TrackedProductPurchaseActions";
import type { ProductRecommendationTrackingContext } from "@/lib/products/productRecommendationTrackingTypes";

type ProductComparisonMediaCardProps = {
  product: {
    slug: string;
    name: string;
    compatibleProblems?: string[];
    primaryImageUrl?: string | null;
    imageUrls?: string[] | null;
    buyLabel?: string | null;
    isPurchaseAvailable?: boolean | null;
    amazonUrl?: string | null;
    amazonAffiliateUrl?: string | null;
  };
  subtitle?: string;
  viewHref?: string;
  trackingContext: ProductRecommendationTrackingContext;
  purchaseRecommendationPosition: number;
};

export function ProductComparisonMediaCard({
  product,
  subtitle,
  viewHref,
  trackingContext,
  purchaseRecommendationPosition,
}: ProductComparisonMediaCardProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:shadow-sm">
      <ProductImageGalleryMini product={product} />

      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight text-zinc-900">
          {viewHref ? (
            <Link href={viewHref} className="hover:underline">
              {product.name}
            </Link>
          ) : (
            product.name
          )}
        </h3>
        {subtitle ? (
          <p className="text-sm text-zinc-600">{subtitle}</p>
        ) : null}
      </div>

      <TrackedProductPurchaseActions
        product={product}
        viewHref={viewHref}
        trackingContext={trackingContext}
        recommendationPosition={purchaseRecommendationPosition}
        roleLabel="comparison_purchase_grid"
        usedForSummary={product.compatibleProblems?.slice(0, 3).join(" · ")}
      />
    </div>
  );
}
