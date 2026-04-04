"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { recordProductClick } from "@/lib/products/productClickData";
import {
  getRecommendationDestinationType,
  normalizeRoleLabel,
  trackProductRecommendationClick,
} from "@/lib/products/trackProductRecommendationClick";

type Props = {
  href: string;
  productSlug: string;
  roleLabel:
    | "product_problem_chip"
    | "comparison_entry"
    | "Best overall"
    | "search_result";
  position: number;
  children: ReactNode;
  className?: string;
  label?: string;
};

function normalizeProductContextRoleLabel(
  roleLabel: Props["roleLabel"],
): ReturnType<typeof normalizeRoleLabel> {
  if (roleLabel === "product_problem_chip") {
    return normalizeRoleLabel("comparison_entry");
  }

  return normalizeRoleLabel(roleLabel);
}

export function TrackedProductContextLink({
  href,
  productSlug,
  roleLabel,
  position,
  children,
  className,
  label,
}: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        const problemMatch = /^\/problems\/([^/]+)/.exec(href);
        if (problemMatch?.[1]) {
          recordProductClick(problemMatch[1], productSlug);
        }
        trackProductRecommendationClick({
          eventName: "product_recommendation_click",
          productSlug,
          destinationType: getRecommendationDestinationType(href),
          destinationUrl: href,
          sourcePageType: "product",
          pageType: "product_page",
          roleLabel: normalizeProductContextRoleLabel(roleLabel),
          position,
          isPinned: true,
          label,
        });
      }}
    >
      {children}
    </Link>
  );
}
