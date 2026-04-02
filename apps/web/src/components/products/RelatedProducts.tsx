import Link from "next/link";

import { ProductPurchaseActions } from "@/components/products/ProductPurchaseActions";
import { getRelatedProducts } from "@/lib/products/productRelated";
import type { ProductLike } from "@/lib/products/productRelated";

type RelatedProductLike = ProductLike & {
  name?: string;
  title?: string;
  brand?: string;
  amazonUrl?: string;
  amazonAffiliateUrl?: string;
  isPurchaseAvailable?: boolean;
  buyLabel?: string;
};

type Props = {
  product?: RelatedProductLike;
  mode?: "better" | "similar";
  products?: RelatedProductLike[];
};

function normalizeName(product: RelatedProductLike) {
  return product.name ?? product.title ?? product.slug;
}

function normalizeScore(product: RelatedProductLike) {
  return product.finalScore ?? product.score ?? product.rating?.finalScore ?? null;
}

export default function RelatedProducts({
  product,
  mode = "similar",
  products = [],
}: Props) {
  const items =
    product != null ? getRelatedProducts(product, { mode, limit: 3 }) : products.slice(0, 3);

  if (!items.length) return null;

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-neutral-900">
        {mode === "better" ? "Better alternatives (stronger fit)" : "Similar products (same role)"}
      </h3>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.slug}
            className="rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-[#C9B27C]/60 hover:shadow-sm"
          >
            <Link href={`/products/${item.slug}`} className="block">
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
                {mode === "better"
                  ? "Stronger chemistry fit for this problem"
                  : "Similar cleaning role with comparable behavior"}
              </p>
            </Link>

            <ProductPurchaseActions
              product={{ ...item, name: normalizeName(item) }}
              viewHref={`/products/${item.slug}`}
              compact
            />
          </div>
        ))}
      </div>
    </div>
  );
}
