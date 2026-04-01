import Link from "next/link";

import type { PublishedProductSnapshot } from "@/lib/products/productTypes";

export function ProductCard({ product }: { product: PublishedProductSnapshot }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="block rounded-2xl border border-[#C9B27C] bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{product.brand}</p>
          <h3 className="mt-1 text-xl font-semibold text-neutral-900">{product.title}</h3>
          <p className="mt-1 text-sm text-neutral-600">{product.category}</p>
        </div>
        <div className="rounded-full border border-[#C9B27C] px-3 py-1 text-sm font-semibold text-neutral-900">
          {product.rating.finalScore.toFixed(1)}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-neutral-700">{product.heroVerdict}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {product.warningBadges.map((badge) => (
          <span
            key={badge}
            className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
          >
            {badge}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        Scenario confidence (High / Medium / Situational) is shown on topic and playbook pages where problem +
        surface context is fixed.
      </p>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Best for</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {product.compatibleProblems.slice(0, 4).map((item) => (
            <span
              key={item}
              className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
