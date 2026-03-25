export type SiteSearchResultType =
  | "encyclopedia"
  | "method"
  | "surface"
  | "problem"
  | "tool"
  | "article"
  | "guide"
  | "cluster"
  | "comparison"
  | "question";

export interface SiteSearchResult {
  id: string;
  type: SiteSearchResultType;
  title: string;
  href: string;
  description: string;
  keywords: string[];
}

export interface SiteSearchResultWithScore extends SiteSearchResult {
  score: number;
}

export interface SiteSearchSuggestion {
  id: string;
  type: SiteSearchResultType;
  title: string;
  href: string;
  subtitle: string;
}

export interface SiteSearchGroupedResults {
  query: string;
  total: number;
  results: SiteSearchResultWithScore[];
  grouped: Array<{
    type: SiteSearchResultType;
    label: string;
    items: SiteSearchResultWithScore[];
  }>;
}
