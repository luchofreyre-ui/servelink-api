"use client";

import Link from "next/link";

import { ProductImage } from "@/components/products/ProductImage";
import { ProductPurchaseActions } from "@/components/products/ProductPurchaseActions";
import { getComparisonOpponentSlug } from "@/lib/products/productAuthorityContext";
import { getRelatedProducts } from "@/lib/products/productRelated";
import type { ProductLike } from "@/lib/products/productRelated";
import { getAllPublishedProducts } from "@/lib/products/productPublishing";
import type { ProductRecommendationTrackingContext } from "@/lib/products/productRecommendationTrackingTypes";
import { buildProductRecommendationClickHandler } from "@/lib/products/productRecommendationTracking";
import { getProductPurchaseUrl } from "@/lib/products/getProductPurchaseUrl";

type RelatedProductLike = ProductLike & {
  name?: string;
  title?: string;
  brand?: string;
  amazonUrl?: string;
  amazonAffiliateUrl?: string;
  isPurchaseAvailable?: boolean;
  buyLabel?: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
};

type Props = {
  product?: RelatedProductLike;
  mode?: "better" | "similar";
  products?: RelatedProductLike[];
  trackingContext?: ProductRecommendationTrackingContext;
};

function normalizeName(product: RelatedProductLike) {
  return product.name ?? product.title ?? product.slug;
}

function normalizeScore(product: RelatedProductLike) {
  return product.finalScore ?? product.score ?? product.rating?.finalScore ?? null;
}

/** Comparison opponent first when a primary compare route exists (funnel relevance). */
function prioritizeComparisonOpponentFirst<T extends { slug: string }>(
  currentSlug: string,
  items: T[],
  limit: number,
): T[] {
  const opponent = getComparisonOpponentSlug(currentSlug);
  if (!opponent || items.length === 0) return items;

  const idx = items.findIndex((i) => i.slug === opponent);
  if (idx === 0) return items;
  if (idx > 0) {
    const copy = [...items];
    const [row] = copy.splice(idx, 1);
    return [row, ...copy].slice(0, limit);
  }

  const published = getAllPublishedProducts().find((p) => p.slug === opponent);
  if (!published) return items;

  const rest = items.filter((i) => i.slug !== opponent);
  return [published as unknown as T, ...rest].slice(0, limit);
}

export default function RelatedProducts({
  product,
  mode = "similar",
  products = [],
  trackingContext,
}: Props) {
  const limit = 3;
  const primary =
    product != null ? getRelatedProducts(product, { mode, limit }) : products.slice(0, limit);
  const usedPeerFallback =
    Boolean(product && mode === "better" && !primary.length);
  const rawItems =
    usedPeerFallback ? getRelatedProducts(product!, { mode: "similar", limit }) : primary;
  const items =
    product != null ? prioritizeComparisonOpponentFirst(product.slug, rawItems, limit) : rawItems;

  if (!items.length) return null;

  const heading = usedPeerFallback
    ? "Peer alternative (same role)"
    : mode === "better"
      ? "Better alternatives (stronger fit)"
      : "Similar products (same role)";

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-neutral-900">{heading}</h3>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item, index) => {
          const viewHref = `/products/${item.slug}`;
          const purchaseUrlRaw = getProductPurchaseUrl(item.slug);
          const purchaseUrl = purchaseUrlRaw !== "#" ? purchaseUrlRaw : null;
          const track = (href: string) =>
            buildProductRecommendationClickHandler({
              productSlug: item.slug,
              roleLabel: null,
              position: index + 1,
              href,
              trackingContext,
            })();

          return (
            <div
              key={item.slug}
              className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-[#C9B27C]/60 hover:shadow-sm"
            >
              <ProductImage
                product={{
                  name: normalizeName(item),
                  primaryImageUrl: item.primaryImageUrl,
                  imageUrls: item.imageUrls,
                }}
                aspect="square"
                rounded="xl"
                sizes="(max-width: 768px) 100vw, 20vw"
              />
              <Link href={viewHref} className="block" onClick={() => track(viewHref)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-neutral-900">{normalizeName(item)}</div>
                    {item.brand ? <div className="mt-1 text-sm text-neutral-500">{item.brand}</div> : null}
                  </div>

                  <div className="rounded-xl bg-[#FCFAF5] px-3 py-1 text-sm font-semibold text-neutral-900">
                    {typeof normalizeScore(item) === "number" ? normalizeScore(item)!.toFixed(1) : "—"}
                  </div>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  {usedPeerFallback || mode === "similar"
                    ? "Similar cleaning role with comparable behavior"
                    : "Stronger chemistry fit for this problem"}
                </p>
              </Link>

              <ProductPurchaseActions
                product={{ ...item, name: normalizeName(item) }}
                viewHref={viewHref}
                usedForSummary={item.compatibleProblems?.slice(0, 3).join(" · ")}
                compact
                onPrimaryNavigationClick={
                  purchaseUrl ? () => track(purchaseUrl) : () => track(viewHref)
                }
                onSecondaryNavigationClick={() => track(viewHref)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
