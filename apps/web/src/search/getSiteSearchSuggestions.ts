import { cache } from "react";
import { buildUnifiedSearchIndex } from "./buildUnifiedSearchIndex";

export const getSiteSearchSuggestions = cache((limit = 8): string[] => {
  const suggestions = buildUnifiedSearchIndex()
    .map((document) => document.title)
    .filter(Boolean)
    .slice(0, limit);

  return Array.from(new Set(suggestions));
});
