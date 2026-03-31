import { cache } from "react";
import {
  apiLiveListItemsToSearchDocuments,
  fetchEncyclopediaPublicListForSearch,
} from "@/lib/encyclopedia/encyclopediaApiPublic.server";
import { getResolvedEncyclopediaIndex } from "@/lib/encyclopedia/loader";
import { detectSearchIntent } from "@/lib/encyclopedia/searchIntent";
import { rankEncyclopediaResults } from "@/lib/encyclopedia/searchRanking";
import type { EncyclopediaCategory, EncyclopediaResolvedIndexEntry } from "@/lib/encyclopedia/types";
import { buildUnifiedSearchIndex } from "./buildUnifiedSearchIndex";
import type { SiteSearchDocument } from "@/types/search";

export interface SearchSiteIndexOptions {
  query: string;
  limit?: number;
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

function scoreDocument(
  document: SiteSearchDocument,
  normalizedQuery: string,
): number {
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

function searchUnifiedDocuments(
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

  return [
    ...rankedPipelineDocs,
    ...pipelineMatchedButNotRankOrdered,
    ...secondarySorted,
  ].slice(0, limit);
}

export const searchSiteIndex = cache(
  (opts: SearchSiteIndexOptions): SiteSearchDocument[] => {
    return searchUnifiedDocuments(buildUnifiedSearchIndex(), opts);
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
  return searchUnifiedDocuments(mergedDocs, opts);
}
