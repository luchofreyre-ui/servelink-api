import { cache } from "react";
import {
  apiLiveListItemsToSearchDocuments,
  fetchEncyclopediaPublicListForSearch,
} from "@/lib/encyclopedia/encyclopediaApiPublic.server";
import { getResolvedEncyclopediaIndex } from "@/lib/encyclopedia/loader";
import { detectSearchIntent } from "@/lib/encyclopedia/searchIntent";
import { rankEncyclopediaResults } from "@/lib/encyclopedia/searchRanking";
import type { EncyclopediaCategory, EncyclopediaResolvedIndexEntry } from "@/lib/encyclopedia/types";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getBestComparePair } from "@/lib/products/bestComparePair";
import { getOrderedScenarioProducts } from "@/lib/products/bestProductForContext";
import { buildCompareProductsHref } from "@/lib/products/compareSlugBuilder";
import { buildUnifiedSearchIndex } from "@/search/buildUnifiedSearchIndex";
import {
  dedupeSearchResultsByHref,
  getSearchTypeBoost,
  type ScoredSearchHit,
} from "./searchResultRanking";
import type { SiteSearchDocument } from "@/types/search";

export interface SearchSiteIndexOptions {
  query: string;
  limit?: number;
}

const CURATED_AUTHORITY_PROBLEM_QUERY_ALIASES: Record<string, string> = {
  // dust-buildup
  "dust buildup": "dust-buildup",
  "dust on floors": "dust-buildup",
  "dust on floor": "dust-buildup",
  "floor dust": "dust-buildup",
  "dusty floors": "dust-buildup",
  "dusty floor": "dust-buildup",
  "dust accumulation": "dust-buildup",
  "built up dust": "dust-buildup",

  // surface-haze
  "surface haze": "surface-haze",
  "glass haze": "surface-haze",
  "hazy glass": "surface-haze",
  "film on glass": "surface-haze",
  "haze on glass": "surface-haze",
  "cloudy mirrors": "surface-haze",
  "mirror haze": "surface-haze",
  "shower glass haze": "surface-haze",

  // product-residue-buildup
  "product residue": "product-residue-buildup",
  "product residue buildup": "product-residue-buildup",
  "cleaner residue": "product-residue-buildup",
  "cleaning product residue": "product-residue-buildup",
  "residue from cleaner": "product-residue-buildup",
  "product buildup": "product-residue-buildup",
  "cleaning residue": "product-residue-buildup",
  "residue on surface from cleaner": "product-residue-buildup",

  // grease-buildup
  "grease buildup": "grease-buildup",
  "kitchen grease": "grease-buildup",
  "greasy residue": "grease-buildup",
  "cooked on grease": "grease-buildup",
  "built up grease": "grease-buildup",
  "grease on stovetop": "grease-buildup",
  "stovetop grease": "grease-buildup",
  "cabinet grease": "grease-buildup",
  "grease film": "grease-buildup",
  "sticky grease": "grease-buildup",

  // hard-water-deposits
  "hard water deposits": "hard-water-deposits",
  "hard water spots": "hard-water-deposits",
  "mineral deposits": "hard-water-deposits",
  "water spots": "hard-water-deposits",
  limescale: "hard-water-deposits",
  "hard water buildup": "hard-water-deposits",
  "mineral buildup": "hard-water-deposits",
  "white mineral spots": "hard-water-deposits",
  "calcium buildup": "hard-water-deposits",
  "hard water film": "hard-water-deposits",

  // mold-growth
  "mold growth": "mold-growth",
  "mold buildup": "mold-growth",
  "black mold": "mold-growth",
  "mold on shower caulk": "mold-growth",
  "mold on grout": "mold-growth",
  "bathroom mold": "mold-growth",

  // light-mildew
  "light mildew": "light-mildew",
  "mildew on shower walls": "light-mildew",
  "mildew spots": "light-mildew",
  "surface mildew": "light-mildew",

  // streaking-on-glass
  "streaking on glass": "streaking-on-glass",
  "glass streaks": "streaking-on-glass",
  "streaky glass": "streaking-on-glass",
  "mirror streaks": "streaking-on-glass",
  "window streaks": "streaking-on-glass",

  // cloudy-glass
  "cloudy glass": "cloudy-glass",
  "glass looks cloudy": "cloudy-glass",
  "etched looking glass": "cloudy-glass",

  // smudge-marks
  "smudge marks": "smudge-marks",
  "fingerprints on glass": "smudge-marks",
  "fingerprints and smudges": "smudge-marks",
  "smudges on stainless": "smudge-marks",

  // odor-retention
  "odor retention": "odor-retention",
  "bad smell keeps coming back": "odor-retention",
  "lingering odor": "odor-retention",
  "stuck smell": "odor-retention",

  // limescale-buildup
  "limescale buildup": "limescale-buildup",
  "limescale on faucet": "limescale-buildup",
  "scale buildup": "limescale-buildup",
  "white scale": "limescale-buildup",
};

function normalizeAuthorityProblemQueryAlias(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

const STACKABLE_AUTHORITY_PROBLEM_SLUGS = new Set([
  "dust-buildup",
  "surface-haze",
  "product-residue-buildup",
  "grease-buildup",
  "hard-water-deposits",
  "mold-growth",
  "light-mildew",
  "streaking-on-glass",
  "cloudy-glass",
  "smudge-marks",
  "odor-retention",
  "limescale-buildup",
]);

export function tryResolveAuthorityProblemSlugForQuery(query: string): string | null {
  const normalized = normalizeAuthorityProblemQueryAlias(query);

  const aliasSlug = CURATED_AUTHORITY_PROBLEM_QUERY_ALIASES[normalized];
  if (aliasSlug && STACKABLE_AUTHORITY_PROBLEM_SLUGS.has(aliasSlug)) {
    return aliasSlug;
  }

  const hyphenSlug = normalized.replace(/\s+/g, "-");
  if (STACKABLE_AUTHORITY_PROBLEM_SLUGS.has(hyphenSlug)) {
    return hyphenSlug;
  }

  const singleTokenSlug = query.trim().toLowerCase();
  if (STACKABLE_AUTHORITY_PROBLEM_SLUGS.has(singleTokenSlug)) {
    return singleTokenSlug;
  }

  return null;
}

function isAuthorityProblemHrefForSlug(href: string, slug: string): boolean {
  return href === `/problems/${slug}`;
}

function isEncyclopediaProblemHrefForSlug(href: string, slug: string): boolean {
  return href === `/encyclopedia/problems/${slug}`;
}

function applyResolvedProblemDominance(
  results: ScoredSearchHit[],
  resolvedProblemSlug: string | null,
): ScoredSearchHit[] {
  if (!resolvedProblemSlug) return results;

  return results.map((result) => {
    if (isAuthorityProblemHrefForSlug(result.document.href, resolvedProblemSlug)) {
      return {
        ...result,
        score: Math.max(result.score, 10000),
      };
    }

    if (isEncyclopediaProblemHrefForSlug(result.document.href, resolvedProblemSlug)) {
      return {
        ...result,
        score: Math.min(result.score, 25),
      };
    }

    return result;
  });
}

/** Fixed tiers just under dominance max (10_000) so injects beat other high-scoring authority pages (e.g. related problem hubs). */
const INJECT_COMPARE_SCORE = 9990;
const INJECT_PRODUCT_SCORE = 9980;

function buildProblemContextInjections(problemSlug: string, _authorityProblemFinal: number): ScoredSearchHit[] {
  const problem = getProblemPageBySlug(problemSlug);
  if (!problem) return [];

  const scenario = problem.productScenarios?.find((row) => row.products?.length);
  if (!scenario) return [];

  const rawProducts = (scenario.products ?? []).slice(0, 3);
  const ctx = { problemSlug, surface: scenario.surface ?? null };
  const orderedProducts = getOrderedScenarioProducts(rawProducts, ctx);
  const bestProduct = orderedProducts[0] ?? null;
  const comparePair = getBestComparePair(orderedProducts, ctx);

  const injections: ScoredSearchHit[] = [];

  if (comparePair.length === 2) {
    const compareHref = buildCompareProductsHref(comparePair);
    if (compareHref) {
      const doc: SiteSearchDocument = {
        id: `injected-compare-${problemSlug}`,
        title: `Compare ${comparePair[0]!.name ?? comparePair[0]!.slug} vs ${comparePair[1]!.name ?? comparePair[1]!.slug}`,
        href: compareHref,
        type: "product_comparison",
        source: "injected",
        description: "",
        keywords: [problemSlug, comparePair[0]!.slug, comparePair[1]!.slug],
        body: "",
      };
      injections.push({ document: doc, score: INJECT_COMPARE_SCORE });
    }
  }

  if (bestProduct) {
    const doc: SiteSearchDocument = {
      id: `injected-product-${problemSlug}-${bestProduct.slug}`,
      title: bestProduct.name ?? bestProduct.slug,
      href: `/products/${bestProduct.slug}`,
      type: "product",
      source: "injected",
      description: "",
      keywords: [bestProduct.slug, problemSlug],
      body: "",
    };
    injections.push({ document: doc, score: INJECT_PRODUCT_SCORE });
  }

  return injections.slice(0, 2);
}

function mergeSearchDocumentsPreferApi(
  apiDocs: SiteSearchDocument[],
  fileDocs: SiteSearchDocument[],
): SiteSearchDocument[] {
  const byId = new Map<string, SiteSearchDocument>();
  for (const d of fileDocs) {
    byId.set(d.id, d);
  }
  for (const d of apiDocs) {
    byId.set(d.id, d);
  }
  return Array.from(byId.values());
}

const PIPELINE_ENCYCLOPEDIA_CATEGORIES = new Set<EncyclopediaCategory>([
  "problems",
  "methods",
  "surfaces",
]);

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function parseEncyclopediaDocumentId(
  id: string,
): { category: EncyclopediaCategory; slug: string } | null {
  const m = /^encyclopedia:([^:]+):(.+)$/.exec(id);
  if (!m) return null;
  const category = m[1] as EncyclopediaCategory;
  const slug = m[2];
  return { category, slug };
}

function scoreDocument(document: SiteSearchDocument, normalizedQuery: string): number {
  if (!normalizedQuery) {
    return 0;
  }

  let score = 0;
  const title = document.title.toLowerCase();
  const description = document.description.toLowerCase();
  const body = document.body.toLowerCase();
  const href = document.href.toLowerCase();
  const keywords = document.keywords.map((keyword) => keyword.toLowerCase());

  if (title === normalizedQuery) score += 120;
  if (title.includes(normalizedQuery)) score += 80;
  if (href.includes(normalizedQuery)) score += 40;
  if (description.includes(normalizedQuery)) score += 30;
  if (body.includes(normalizedQuery)) score += 15;
  if (keywords.some((keyword) => keyword === normalizedQuery)) score += 60;
  if (keywords.some((keyword) => keyword.includes(normalizedQuery))) score += 25;

  return score;
}

function searchUnifiedDocumentsWithIndex(
  allDocuments: SiteSearchDocument[],
  { query, limit = 24 }: SearchSiteIndexOptions,
): SiteSearchDocument[] {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return [];
  }

  const resolvedByKey = new Map<string, EncyclopediaResolvedIndexEntry>();
  for (const e of getResolvedEncyclopediaIndex()) {
    resolvedByKey.set(`${e.category}:${e.slug}`, e);
  }

  const scored = allDocuments
    .map((document) => ({
      document,
      score: scoreDocument(document, normalizedQuery),
    }))
    .filter((item) => item.score > 0);

  const encScored = scored.filter((x) => x.document.source === "encyclopedia");
  const nonEncScored = scored.filter((x) => x.document.source !== "encyclopedia");

  const pipelineEncScored = encScored.filter((item) => {
    const key = parseEncyclopediaDocumentId(item.document.id);
    return key !== null && PIPELINE_ENCYCLOPEDIA_CATEGORIES.has(key.category);
  });

  const pipelineEncIds = new Set(pipelineEncScored.map((x) => x.document.id));

  const secondaryEncScored = encScored.filter(
    (item) => !pipelineEncIds.has(item.document.id),
  );

  type Scored = (typeof scored)[number];

  const pipelinePairs: { item: Scored; entry: EncyclopediaResolvedIndexEntry }[] = [];
  for (const item of pipelineEncScored) {
    const key = parseEncyclopediaDocumentId(item.document.id);
    if (!key) continue;
    const entry = resolvedByKey.get(`${key.category}:${key.slug}`);
    if (entry) pipelinePairs.push({ item, entry });
  }

  const intent = detectSearchIntent(query);
  const rankedPipelineEntries = rankEncyclopediaResults(
    pipelinePairs.map((p) => p.entry),
    { query, intent },
  );

  const pipelineItemByKey = new Map<string, Scored>();
  for (const p of pipelinePairs) {
    pipelineItemByKey.set(`${p.entry.category}:${p.entry.slug}`, p.item);
  }

  const rankedPipelineDocs: SiteSearchDocument[] = [];
  for (const entry of rankedPipelineEntries) {
    const hit = pipelineItemByKey.get(`${entry.category}:${entry.slug}`);
    if (hit) rankedPipelineDocs.push(hit.document);
  }

  const rankedPipelineDocIds = new Set(rankedPipelineDocs.map((d) => d.id));
  const pipelineMatchedButNotRankOrdered = pipelineEncScored
    .filter((x) => !rankedPipelineDocIds.has(x.document.id))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.document);

  const secondarySorted = [...secondaryEncScored, ...nonEncScored]
    .sort((a, b) => b.score - a.score)
    .map((x) => x.document);

  const mergedOrder: SiteSearchDocument[] = [
    ...rankedPipelineDocs,
    ...pipelineMatchedButNotRankOrdered,
    ...secondarySorted,
  ];

  const seenIds = new Set<string>();
  const mergedDocs: SiteSearchDocument[] = [];
  for (const d of mergedOrder) {
    if (!seenIds.has(d.id)) {
      seenIds.add(d.id);
      mergedDocs.push(d);
    }
  }
  for (const s of scored) {
    if (!seenIds.has(s.document.id)) {
      seenIds.add(s.document.id);
      mergedDocs.push(s.document);
    }
  }

  const scoreById = new Map(scored.map((s) => [s.document.id, s.score]));
  let finalHits: ScoredSearchHit[] = mergedDocs.map((document) => {
    const baseScore = scoreById.get(document.id) ?? 0;
    return {
      document,
      score: baseScore + getSearchTypeBoost(document),
    };
  });

  const resolvedProblemSlug = tryResolveAuthorityProblemSlugForQuery(query);

  if (resolvedProblemSlug) {
    const problemHref = `/problems/${resolvedProblemSlug}`;
    const problemDoc = allDocuments.find((d) => d.href === problemHref);
    if (problemDoc && !finalHits.some((h) => h.document.href === problemHref)) {
      finalHits.push({
        document: problemDoc,
        score: scoreDocument(problemDoc, normalizedQuery) + getSearchTypeBoost(problemDoc),
      });
    }

    const problemHit = finalHits.find((h) => h.document.href === problemHref);
    const authorityProblemFinal =
      problemHit?.score ??
      (problemDoc ? scoreDocument(problemDoc, normalizedQuery) + getSearchTypeBoost(problemDoc) : 0);

    if (authorityProblemFinal > 0) {
      const injectedHits = buildProblemContextInjections(resolvedProblemSlug, authorityProblemFinal);
      finalHits = [...finalHits, ...injectedHits];
    }
  }

  let combined = finalHits;
  if (resolvedProblemSlug) {
    combined = applyResolvedProblemDominance(combined, resolvedProblemSlug);
  }

  const dedupedFinal = dedupeSearchResultsByHref(combined);
  return dedupedFinal.slice(0, limit).map((h) => h.document);
}

/**
 * Test and tooling entrypoint: query + limit, default unified index (file-backed).
 */
export function searchUnifiedDocuments(
  query: string,
  opts: { limit?: number } = {},
): SiteSearchDocument[] {
  return searchUnifiedDocumentsWithIndex(buildUnifiedSearchIndex(), {
    query,
    limit: opts.limit ?? 24,
  });
}

export const searchSiteIndex = cache(
  (opts: SearchSiteIndexOptions): SiteSearchDocument[] => {
    return searchUnifiedDocumentsWithIndex(buildUnifiedSearchIndex(), opts);
  },
);

/** Merges API live encyclopedia pages (public `/api/v1/encyclopedia/list`) into the index, then runs site search. */
export async function searchSiteIndexIncludingApiLivePages(
  opts: SearchSiteIndexOptions,
): Promise<SiteSearchDocument[]> {
  const [apiItems, fileDocuments] = await Promise.all([
    fetchEncyclopediaPublicListForSearch(),
    Promise.resolve(buildUnifiedSearchIndex()),
  ]);
  const apiDocuments = apiLiveListItemsToSearchDocuments(apiItems);
  const mergedDocs = mergeSearchDocumentsPreferApi(apiDocuments, fileDocuments);
  return searchUnifiedDocumentsWithIndex(mergedDocs, opts);
}
