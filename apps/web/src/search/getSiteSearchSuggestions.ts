import { buildSiteSearchIndex } from "./buildSiteSearchIndex";
import { SiteSearchResult, SiteSearchSuggestion } from "@/types/search";

const SEARCH_INDEX = buildSiteSearchIndex();

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[\s,/:\-()]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function scoreSuggestion(result: SiteSearchResult, query: string, tokens: string[]): number {
  const title = normalize(result.title);
  const description = normalize(result.description);
  const keywords = result.keywords.map(normalize);

  let score = 0;

  if (title === query) score += 150;
  if (title.startsWith(query)) score += 60;
  if (title.includes(query)) score += 35;

  for (const keyword of keywords) {
    if (keyword === query) score += 80;
    else if (keyword.startsWith(query)) score += 20;
    else if (keyword.includes(query)) score += 8;
  }

  for (const token of tokens) {
    if (title.startsWith(token)) score += 12;
    else if (title.includes(token)) score += 6;

    if (description.includes(token)) score += 2;

    for (const keyword of keywords) {
      if (keyword === token) score += 10;
      else if (keyword.startsWith(token)) score += 4;
      else if (keyword.includes(token)) score += 2;
    }
  }

  return score;
}

function toSuggestion(result: SiteSearchResult): SiteSearchSuggestion {
  return {
    id: result.id,
    type: result.type,
    title: result.title,
    href: result.href,
    subtitle: result.description,
  };
}

export function getSiteSearchSuggestions(rawQuery: string, limit = 8): SiteSearchSuggestion[] {
  const query = normalize(rawQuery);
  const tokens = tokenize(rawQuery);

  if (!query) return [];

  return SEARCH_INDEX.map((result) => ({
    result,
    score: scoreSuggestion(result, query, tokens),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.result.title.localeCompare(b.result.title))
    .slice(0, limit)
    .map((item) => toSuggestion(item.result));
}
