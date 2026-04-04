import { syncFunnelInteraction } from "@/lib/analytics/funnelSync";
import { trackFunnelStageAction } from "@/lib/analytics/funnelStageAnalytics";
import { recordProductClick } from "@/lib/products/productClickData";
import { tryResolveAuthorityProblemSlugForQuery } from "@/lib/search/searchAuthorityProblemAlias";

export type SearchResultClickPayload = {
  productSlug: string;
  problemSlug: string | null;
  searchQuery: string;
};

/**
 * Ties search-result product clicks to problem hubs for clickthrough ranking.
 * Safe to call from client search UI on each product/comparison navigation.
 */
export function trackSearchResultClick(payload: SearchResultClickPayload): void {
  if (payload.problemSlug) {
    recordProductClick(payload.problemSlug, payload.productSlug);
    trackFunnelStageAction("search_result_click", payload);
    syncFunnelInteraction("search_result_click", {
      problemSlug: payload.problemSlug,
      productSlug: payload.productSlug,
    });
  }
  if (process.env.NODE_ENV !== "production") {
    console.log("[searchClickAnalysis]", payload);
  }
}

/** Resolves stackable hub from query when the caller does not already have it. */
export function trackSearchResultClickWithQuery(
  productSlug: string,
  searchQuery: string,
): void {
  const problemSlug = tryResolveAuthorityProblemSlugForQuery(searchQuery);
  trackSearchResultClick({ productSlug, problemSlug, searchQuery });
}
