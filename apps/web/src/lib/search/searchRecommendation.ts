import type { FunnelUserPreferences } from "@/lib/analytics/funnelSync";
import { tryResolveAuthorityProblemSlugForQuery } from "@/lib/search/searchAuthorityProblemAlias";
import type { SiteSearchDocument } from "@/types/search";

function behaviorBoost(
  doc: SiteSearchDocument,
  searchQuery: string,
  prefs: FunnelUserPreferences | null | undefined,
): number {
  let score = 0;
  const resolved = tryResolveAuthorityProblemSlugForQuery(searchQuery);

  if (resolved && doc.href.includes(`/problems/${resolved}`)) {
    score += 40;
  }
  if (doc.keywords.some((k) => k === resolved)) {
    score += 10;
  }

  const hub = prefs?.lastEngagedProblemSlug;
  if (hub) {
    if (doc.href.includes(`/problems/${hub}`) || doc.keywords.includes(hub)) {
      score += 80;
    }
    if (doc.type === "product" && doc.keywords.includes(hub)) {
      score += 30;
    }
    if (doc.type === "product_comparison" && doc.keywords.some((k) => k.includes(hub))) {
      score += 25;
    }
  }

  const surface = prefs?.lastEngagedSurface;
  if (surface) {
    const s = surface.toLowerCase();
    if (doc.keywords.some((k) => k.toLowerCase().includes(s))) {
      score += 15;
    }
  }

  return score;
}

/**
 * Reorders search rows using local funnel preferences + query resolution (no filtering).
 */
export function getSearchRecommendations(
  results: readonly SiteSearchDocument[],
  searchQuery: string,
  prefs: FunnelUserPreferences | null | undefined,
): SiteSearchDocument[] {
  if (results.length <= 1) return [...results];

  const indexed = results.map((doc, index) => ({
    doc,
    index,
    boost: behaviorBoost(doc, searchQuery, prefs),
  }));

  indexed.sort((a, b) => {
    if (b.boost !== a.boost) return b.boost - a.boost;
    return a.index - b.index;
  });

  return indexed.map((row) => row.doc);
}
