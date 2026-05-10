"use client";

import Link from "next/link";

import { buildProductRecommendationClickHandler } from "@/lib/products/productRecommendationTracking";
import type { ProductRecommendationTrackingContext } from "@/lib/products/productRecommendationTrackingTypes";

type AffiliateLinks = { walmart?: string; homedepot?: string };

export function ProductSummaryRailRetailerCtas({
  affiliateLinks,
  productSlug,
  trackingContext,
}: {
  affiliateLinks: AffiliateLinks;
  productSlug: string;
  trackingContext: ProductRecommendationTrackingContext;
}) {
  const links = [
    affiliateLinks.walmart ? { href: affiliateLinks.walmart, label: "View on Walmart" } : null,
    affiliateLinks.homedepot ? { href: affiliateLinks.homedepot, label: "View at Home Depot" } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {links.map((link, index) => {
        const handleClick = buildProductRecommendationClickHandler({
          productSlug,
          roleLabel: "comparison_entry",
          position: index + 1,
          href: link.href,
          trackingContext,
          label: `summary_rail_retailer:${link.label}`,
        });
        return (
          <Link
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center rounded-xl bg-[#1F2937] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            onClick={handleClick}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
