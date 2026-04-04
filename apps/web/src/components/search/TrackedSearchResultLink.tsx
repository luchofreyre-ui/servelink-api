"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import {
  getRecommendationDestinationType,
  normalizeRoleLabel,
  trackProductRecommendationClick,
} from "@/lib/products/trackProductRecommendationClick";
import type { SearchDocument } from "@/types/search";

type Props = {
  result: SearchDocument;
  index: number;
  children: ReactNode;
  className?: string;
};

function isAuthorityProblem(result: SearchDocument): boolean {
  return result.source === "authority" && result.type === "problem";
}

function mapSearchRoleLabel(result: SearchDocument): string {
  if (isAuthorityProblem(result)) return "search_problem_result";
  if (result.type === "product_comparison") return "comparison_entry";
  if (result.type === "product") return "Best overall";
  return "search_result";
}

function tryInferProductSlug(result: SearchDocument): string | null {
  if (result.type === "product" && result.href.startsWith("/products/")) {
    return result.href.replace("/products/", "").split("/")[0] || null;
  }

  if (result.type === "product_comparison" && result.href.startsWith("/compare/products/")) {
    const compareSlug = result.href.replace("/compare/products/", "").split("/")[0] || "";
    return compareSlug.split("-vs-")[0] || null;
  }

  return null;
}

export default function TrackedSearchResultLink({
  result,
  index,
  children,
  className,
}: Props) {
  const trackingPayload = useMemo(() => {
    const productSlug = tryInferProductSlug(result);

    return {
      eventName: "product_recommendation_click" as const,
      productSlug: productSlug ?? "search-navigation",
      destinationType: getRecommendationDestinationType(result.href),
      destinationUrl: result.href,
      sourcePageType: "search",
      pageType: "search_results_page",
      roleLabel: normalizeRoleLabel(mapSearchRoleLabel(result)),
      position: index,
      isPinned: result.source === "injected",
    };
  }, [result, index]);

  return (
    <Link
      href={result.href}
      className={className}
      onClick={() => {
        trackProductRecommendationClick(trackingPayload);
      }}
    >
      {children}
    </Link>
  );
}
