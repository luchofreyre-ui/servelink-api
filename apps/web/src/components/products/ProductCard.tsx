import clsx from "clsx";
import Link from "next/link";

import { ProductImage } from "@/components/products/ProductImage";
import { ProductPurchaseActions } from "@/components/products/ProductPurchaseActions";
import type { PublishedProductSnapshot } from "@/lib/products/productTypes";

const labelStyles: Record<string, string> = {
  "Best overall": "text-emerald-600",
  "Best for heavy buildup": "text-amber-600",
  "Best for maintenance": "text-blue-600",
  "Professional-grade option": "text-purple-600",
};

export type ProductCardProps = {
  product: PublishedProductSnapshot;
  label?: string;
  fitLabel?: string;
  highlight?: boolean;
};

export function ProductCard({ product, label, fitLabel, highlight = false }: ProductCardProps) {
  const scoreNum = product.rating.finalScore;

  const rootClass = clsx(
    "rounded-2xl bg-white transition space-y-0",
    highlight
      ? "rounded-xl border-2 border-emerald-500 p-6 shadow-md"
      : label === "Best overall"
        ? "border border-emerald-500 p-5 shadow-sm hover:shadow-sm"
        : label
          ? "border border-neutral-200 p-5 shadow-sm hover:shadow-sm"
          : "border border-[#C9B27C] p-5 shadow-sm hover:shadow-sm",
  );

  return (
    <div className={rootClass}>
      {highlight ? (
        <p className="mb-3 text-xs text-neutral-600">
          Best balance of cleaning power, surface safety, and everyday usability.
        </p>
      ) : null}

      {label && !highlight ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <span
            className={`inline-flex rounded-full border border-current/15 bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              labelStyles[label] || "text-green-700"
            }`}
          >
            {label}
          </span>
          {label === "Best overall" ? (
            <span className="text-[11px] font-medium text-neutral-500">Top pick</span>
          ) : null}
        </div>
      ) : null}

      {label === "Best overall" && !highlight ? (
        <p className="mb-3 text-xs text-neutral-600">
          Best balance of cleaning power, surface safety, and everyday usability.
        </p>
      ) : null}

      <ProductImage
        product={{
          name: product.title,
          primaryImageUrl: product.primaryImageUrl,
          imageUrls: product.imageUrls,
        }}
        aspect="square"
        rounded="xl"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
      />

      <Link href={`/products/${product.slug}`} className="mt-3 block">
        <h3 className="text-base font-semibold leading-tight text-zinc-900">{product.title}</h3>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-500">{product.brand}</p>
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
        {typeof scoreNum === "number" && Number.isFinite(scoreNum) ? (
          <span className="font-medium text-neutral-800">Score: {scoreNum.toFixed(1)}</span>
        ) : null}
        {fitLabel ? (
          <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-700">
            Fit: {fitLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {product.warningBadges.map((badge) => (
          <span
            key={badge}
            className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
          >
            {badge}
          </span>
        ))}
      </div>

      <p className="mt-3 text-sm leading-6 text-neutral-600">
        <span className="font-medium text-neutral-800">Used for:</span>{" "}
        {product.bestUseCases?.[0]?.trim() || "targeted cleaning applications"}
      </p>

      <div className="mt-4 border-t border-neutral-100 pt-4">
        <ProductPurchaseActions
          product={{ ...product, name: product.title }}
          viewHref={`/products/${product.slug}`}
          forcePrimary
          highlight={highlight}
        />
      </div>
    </div>
  );
}
