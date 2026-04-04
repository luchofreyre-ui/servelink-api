"use client";

import { useEffect, useState } from "react";

import { getFunnelUserPreferences } from "@/lib/analytics/funnelSync";
import { getSearchRecommendations } from "@/lib/search/searchRecommendation";
import type { SiteSearchDocument } from "@/types/search";

import SearchResultsSessionTracker from "./SearchResultsSessionTracker";
import TrackedSearchResultLink from "./TrackedSearchResultLink";

interface SearchResultsPageProps {
  query: string;
  results: SiteSearchDocument[];
}

function formatSourceLabel(source: SiteSearchDocument["source"]): string {
  if (source === "injected") return "Authority stack";
  return source;
}

function formatTypeLabel(type: SiteSearchDocument["type"]): string {
  switch (type) {
    case "problem":
      return "Problem";
    case "method":
      return "Method";
    case "surface":
      return "Surface";
    case "guide":
      return "Guide";
    case "question":
      return "Question";
    case "cluster":
      return "Cluster";
    case "comparison":
      return "Comparison";
    case "product_comparison":
      return "Compare";
    case "product":
      return "Product";
    case "encyclopedia":
      return "Encyclopedia";
    default:
      return type;
  }
}

function isAuthorityProblem(result: SiteSearchDocument): boolean {
  return result.source === "authority" && result.type === "problem";
}

function getSearchIntentSublabel(result: SiteSearchDocument): string | null {
  if (isAuthorityProblem(result)) {
    return "Start here";
  }
  if (result.type === "product_comparison") {
    return "Compare options";
  }
  if (result.type === "product") {
    return "Buy recommended product";
  }
  return null;
}

function getSearchDisplayTitle(result: SiteSearchDocument): string {
  if (result.type === "product_comparison" && result.title.startsWith("Compare ")) {
    return result.title;
  }
  return result.title;
}

function getSearchAnalyticsSourceBucket(result: SiteSearchDocument): "injected" | "organic" {
  return result.source === "injected" ? "injected" : "organic";
}

void getSearchAnalyticsSourceBucket;

function groupResultsByType(
  results: SiteSearchDocument[],
): { type: SiteSearchDocument["type"]; items: SiteSearchDocument[] }[] {
  const typeOrder: SiteSearchDocument["type"][] = [];
  const byType = new Map<
    SiteSearchDocument["type"],
    SiteSearchDocument[]
  >();

  for (const r of results) {
    if (!byType.has(r.type)) {
      typeOrder.push(r.type);
      byType.set(r.type, []);
    }
    byType.get(r.type)!.push(r);
  }

  return typeOrder.map((type) => ({
    type,
    items: byType.get(type)!,
  }));
}

function ResultArticle({
  result,
  bestMatchId,
  isTopResult,
  index,
  searchQuery,
}: {
  result: SiteSearchDocument;
  bestMatchId: string | null;
  isTopResult: boolean;
  index: number;
  searchQuery: string;
}) {
  const isBest = bestMatchId !== null && result.id === bestMatchId;
  const intentSublabel = getSearchIntentSublabel(result);
  const displayTitle = getSearchDisplayTitle(result);

  return (
    <article
      className={
        isTopResult
          ? "rounded-xl border border-neutral-900 bg-white p-4"
          : "rounded-xl border border-neutral-200 bg-white p-4"
      }
      data-testid={isBest ? "search-best-match" : undefined}
    >
      {isTopResult && isAuthorityProblem(result) ? (
        <div className="mb-2 text-xs font-medium text-neutral-700">Best place to start</div>
      ) : null}

      <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">
        <span>{formatTypeLabel(result.type)}</span>
        <span>•</span>
        <span>{formatSourceLabel(result.source)}</span>
      </div>

      {intentSublabel ? (
        <div className="mt-1 text-xs text-neutral-500">{intentSublabel}</div>
      ) : null}

      <h2 className="mt-3 font-[var(--font-poppins)] text-2xl font-semibold text-[#0F172A]">
        <TrackedSearchResultLink
          result={result}
          index={index}
          clickSurface="title"
          searchQuery={searchQuery}
          className="hover:text-[#0D9488]"
        >
          {displayTitle}
        </TrackedSearchResultLink>
      </h2>

      {result.type === "product_comparison" ? (
        <div className="mt-1 text-xs text-neutral-500">See which option is better for this problem.</div>
      ) : null}

      {result.type === "product" ? (
        <div className="mt-1 text-xs text-neutral-500">Direct buy path from the recommended solution.</div>
      ) : null}

      {result.description ? (
        <p className="mt-3 font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
          {result.description}
        </p>
      ) : null}

      <div className="mt-4">
        <TrackedSearchResultLink
          result={result}
          index={index}
          clickSurface="open_page"
          searchQuery={searchQuery}
          className="font-[var(--font-manrope)] text-sm font-medium text-[#0D9488] hover:underline"
        >
          Open page
        </TrackedSearchResultLink>
      </div>
    </article>
  );
}

export function SearchResultsPage({
  query,
  results,
}: SearchResultsPageProps) {
  const [displayResults, setDisplayResults] = useState(results);

  useEffect(() => {
    setDisplayResults(getSearchRecommendations(results, query, getFunnelUserPreferences()));
  }, [results, query]);

  const bestMatchId = displayResults.length > 0 ? displayResults[0]!.id : null;
  const topId = displayResults[0]?.id ?? null;
  const indexById = new Map(displayResults.map((r, i) => [r.id, i] as const));
  const groups = groupResultsByType(displayResults);

  return (
    <main
      className="mx-auto max-w-5xl px-6 py-16 md:px-8"
      data-testid="search-results-page"
    >
      <SearchResultsSessionTracker />
      <div className="space-y-3">
        <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
          Search
        </p>
        <h1 className="font-[var(--font-poppins)] text-4xl font-semibold tracking-tight text-[#0F172A]">
          Results for “{query}”
        </h1>
        <p className="font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
          {displayResults.length} result{displayResults.length === 1 ? "" : "s"} found across
          authority pages and pipeline-backed encyclopedia content.
        </p>
      </div>

      {displayResults.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-[#C9B27C]/20 bg-white/80 p-6 font-[var(--font-manrope)] text-sm text-[#64748B]">
          No results matched this search yet.
        </div>
      ) : (
        <div className="mt-10 grid gap-10">
          {groups.map(({ type, items }) => (
            <section
              key={type}
              className="grid gap-4"
              data-testid="search-group"
            >
              <h2 className="font-[var(--font-poppins)] text-lg font-semibold tracking-tight text-[#0F172A]">
                {formatTypeLabel(type)}
              </h2>
              <div className="grid gap-4">
                {items.map((result) => (
                  <ResultArticle
                    key={result.id}
                    result={result}
                    bestMatchId={bestMatchId}
                    isTopResult={topId !== null && result.id === topId}
                    index={indexById.get(result.id) ?? 0}
                    searchQuery={query}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
