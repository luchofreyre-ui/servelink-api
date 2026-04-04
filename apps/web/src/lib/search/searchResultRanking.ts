import type { SiteSearchDocument } from "@/types/search";

/** Boosts applied on top of lexical match score so authority + funnel stack above encyclopedia noise. */
export const SEARCH_TYPE_PRIORITY: Record<string, number> = {
  authority_problem: 300,
  product_comparison: 200,
  product: 100,
  encyclopedia: 50,
  /** Non-problem authority (methods, surfaces, guides) — still above raw encyclopedia when tied. */
  authority_other: 55,
};

export type SearchRankingType = keyof typeof SEARCH_TYPE_PRIORITY;

export function getSearchRankingType(doc: SiteSearchDocument): SearchRankingType | "default" {
  if (doc.source === "injected") {
    if (doc.type === "product_comparison") return "product_comparison";
    if (doc.type === "product") return "product";
  }
  if (doc.type === "product_comparison" || doc.href.startsWith("/compare/products/")) {
    return "product_comparison";
  }
  if (doc.type === "product" || doc.href.startsWith("/products/")) {
    return "product";
  }
  if (doc.source === "authority" && doc.type === "problem") {
    return "authority_problem";
  }
  if (doc.source === "encyclopedia") {
    return "encyclopedia";
  }
  if (doc.source === "authority") {
    return "authority_other";
  }
  return "default";
}

export function getSearchTypeBoost(doc: SiteSearchDocument): number {
  const t = getSearchRankingType(doc);
  if (t === "default") return 0;
  return SEARCH_TYPE_PRIORITY[t] ?? 0;
}

export type ScoredSearchHit = {
  document: SiteSearchDocument;
  score: number;
};

export function dedupeSearchResultsByHref(hits: ScoredSearchHit[]): ScoredSearchHit[] {
  const byHref = new Map<string, ScoredSearchHit>();
  for (const hit of hits) {
    const existing = byHref.get(hit.document.href);
    if (!existing || hit.score > existing.score) {
      byHref.set(hit.document.href, hit);
    }
  }
  return [...byHref.values()].sort((a, b) => b.score - a.score);
}
