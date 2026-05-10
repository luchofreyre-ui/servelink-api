"use client";

import type { ReactNode } from "react";
import {
  getRecommendationDestinationType,
  normalizeRoleLabel,
  trackProductRecommendationClick,
} from "@/lib/products/trackProductRecommendationClick";

type Props = {
  href: string;
  productSlug: string;
  position: number;
  children: ReactNode;
  className?: string;
  label?: string;
};

export function TrackedProductContextBuyLink({
  href,
  productSlug,
  position,
  children,
  className,
  label,
}: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={className}
      onClick={() => {
        trackProductRecommendationClick({
          eventName: "product_recommendation_click",
          productSlug,
          destinationType: getRecommendationDestinationType(href),
          destinationUrl: href,
          sourcePageType: "product",
          pageType: "product_page",
          roleLabel: normalizeRoleLabel("Best overall"),
          position,
          isPinned: true,
          label,
        });
      }}
    >
      {children}
    </a>
  );
}
