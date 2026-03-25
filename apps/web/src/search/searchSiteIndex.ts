import {
  SiteSearchGroupedResults,
  SiteSearchResult,
  SiteSearchResultType,
  SiteSearchResultWithScore,
} from "@/types/search";
import { buildSiteSearchIndex } from "./buildSiteSearchIndex";

const SEARCH_INDEX = buildSiteSearchIndex();

const TYPE_LABELS: Record<SiteSearchResultType, string> = {
  encyclopedia: "Encyclopedia",
  method: "Methods",
  surface: "Surfaces",
  problem: "Problems",
  tool: "Tools",
  article: "Articles",
  guide: "Guides",
  cluster: "Clusters",
  comparison: "Comparisons",
  question: "Questions",
};

const TYPE_ORDER: SiteSearchResultType[] = [
  "encyclopedia",
  "problem",
  "surface",
  "method",
  "guide",
  "article",
  "tool",
  "cluster",
  "comparison",
  "question",
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[\s,/:\-()]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function scoreResult(result: SiteSearchResult, query: string, tokens: string[]): number {
  const title = normalize(result.title);
  const description = normalize(result.description);
  const href = normalize(result.href);
  const keywords = result.keywords.map(normalize);

  let score = 0;

  if (title === query) score += 150;
  if (keywords.includes(query)) score += 100;
  if (title.startsWith(query)) score += 70;
  if (title.includes(query)) score += 45;
  if (description.includes(query)) score += 18;
  if (href.includes(query)) score += 12;

  for (const keyword of keywords) {
    if (keyword.startsWith(query)) score += 20;
    else if (keyword.includes(query)) score += 10;
  }

  for (const token of tokens) {
    if (title === token) score += 40;
    if (title.startsWith(token)) score += 20;
    if (title.includes(token)) score += 10;
    if (description.includes(token)) score += 4;
    if (href.includes(token)) score += 3;

    for (const keyword of keywords) {
      if (keyword === token) score += 15;
      else if (keyword.startsWith(token)) score += 6;
      else if (keyword.includes(token)) score += 3;
    }
  }

  if (result.type === "encyclopedia" && (query.includes("encyclopedia") || query.includes("knowledge"))) {
    score += 25;
  }

  if (
    result.type === "problem" &&
    (query.includes("stain") || query.includes("buildup") || query.includes("problem"))
  ) {
    score += 12;
  }

  if (result.type === "surface" && query.includes("surface")) {
    score += 8;
  }

  if (result.type === "method" && (query.includes("method") || query.includes("cleaning"))) {
    score += 8;
  }

  if (result.type === "guide" && query.includes("guide")) {
    score += 10;
  }

  return score;
}

function sortGrouped(
  groupedMap: Map<SiteSearchResultType, SiteSearchResultWithScore[]>,
): SiteSearchGroupedResults["grouped"] {
  return Array.from(groupedMap.entries())
    .sort(
      ([typeA], [typeB]) =>
        TYPE_ORDER.indexOf(typeA) - TYPE_ORDER.indexOf(typeB),
    )
    .map(([type, items]) => ({
      type,
      label: TYPE_LABELS[type],
      items: items.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)),
    }));
}

export function searchSiteIndex(rawQuery: string, limit = 24): SiteSearchGroupedResults {
  const query = normalize(rawQuery);
  const tokens = tokenize(rawQuery);

  if (!query) {
    return {
      query: rawQuery,
      total: 0,
      results: [],
      grouped: [],
    };
  }

  const scored: SiteSearchResultWithScore[] = SEARCH_INDEX.map((result) => ({
    ...result,
    score: scoreResult(result, query, tokens),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);

  const groupedMap = new Map<SiteSearchResultType, SiteSearchResultWithScore[]>();

  for (const item of scored) {
    const current = groupedMap.get(item.type) ?? [];
    current.push(item);
    groupedMap.set(item.type, current);
  }

  return {
    query: rawQuery,
    total: scored.length,
    results: scored,
    grouped: sortGrouped(groupedMap),
  };
}
