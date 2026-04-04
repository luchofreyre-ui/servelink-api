"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { trackSearchResultClick } from "@/lib/analytics/searchClickAnalysis";
import {
  getRecommendationDestinationType,
  normalizeRoleLabel,
  trackProductRecommendationClick,
} from "@/lib/products/trackProductRecommendationClick";
import { tryResolveAuthorityProblemSlugForQuery } from "@/lib/search/searchAuthorityProblemAlias";
import type { SiteSearchDocument } from "@/types/search";

type SearchClickSurface = "title" | "open_page";

type Props = {
  result: SiteSearchDocument;
  index: number;
  clickSurface: SearchClickSurface;
  /** When set, records clickthrough for hub ranking when the result maps to a product slug. */
  searchQuery?: string;
  children: ReactNode;
  className?: string;
};

function mapSearchRoleLabel(result: SiteSearchDocument): string {
  if (result.source === "authority" && result.type === "problem") {
    return "search_problem_result";
  }

  if (result.type === "product_comparison") {
    return "comparison_entry";
  }

  if (result.type === "product") {
    return "Best overall";
  }

  return "search_result";
}

function tryInferProductSlug(result: SiteSearchDocument): string | null {
  if (result.type === "product" && result.href.startsWith("/products/")) {
    return result.href.replace("/products/", "").split("/")[0] || null;
  }

  if (result.type === "product_comparison" && result.href.startsWith("/compare/products/")) {
    const compareSlug = result.href.replace("/compare/products/", "").split("/")[0] || "";
    return compareSlug.split("-vs-")[0] || null;
  }

  return null;
}

function buildSearchResultAnalyticsLabel(args: {
  result: SiteSearchDocument;
  index: number;
  clickSurface: SearchClickSurface;
}): string {
  const rowType =
    args.result.source === "authority" && args.result.type === "problem"
      ? "authority_problem"
      : args.result.type;

  const sourceBucket = args.result.source === "injected" ? "injected" : "organic";
  const topBucket = args.index === 0 ? "top_result" : "non_top_result";

  return [
    "search_result_click",
    rowType,
    sourceBucket,
    args.clickSurface,
    topBucket,
    `position_${args.index}`,
  ].join(":");
}

export default function TrackedSearchResultLink({
  result,
  index,
  clickSurface,
  searchQuery,
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
      label: buildSearchResultAnalyticsLabel({
        result,
        index,
        clickSurface,
      }),
    };
  }, [result, index, clickSurface]);

  return (
    <Link
      href={result.href}
      className={className}
      onClick={() => {
        trackProductRecommendationClick(trackingPayload);
        const productSlug = tryInferProductSlug(result);
        if (productSlug && searchQuery !== undefined && searchQuery !== "") {
          const problemSlug = tryResolveAuthorityProblemSlugForQuery(searchQuery);
          trackSearchResultClick({ productSlug, problemSlug, searchQuery });
        }
      }}
    >
      {children}
    </Link>
  );
}
