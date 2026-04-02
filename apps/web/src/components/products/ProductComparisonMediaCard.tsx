import Link from "next/link";

import { ProductImageGalleryMini } from "@/components/products/ProductImageGalleryMini";
import { ProductPurchaseActions } from "@/components/products/ProductPurchaseActions";

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
};

export function ProductComparisonMediaCard({
  product,
  subtitle,
  viewHref,
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

      <ProductPurchaseActions
        product={product}
        viewHref={viewHref}
        usedForSummary={product.compatibleProblems?.slice(0, 3).join(" · ")}
      />
    </div>
  );
}
