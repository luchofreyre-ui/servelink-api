import type { Metadata } from "next";
import { SearchResultsPage } from "@/components/search/SearchResultsPage";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import { searchSiteIndex } from "@/search/searchSiteIndex";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Search | Cleaning Encyclopedia",
  description:
    "Search authority pages and pipeline-backed encyclopedia content.",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = (resolvedSearchParams.q ?? "").trim();
  const results = query ? searchSiteIndex({ query, limit: 24 }) : [];

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <SearchResultsPage query={query} results={results} />
      <PublicSiteFooter />
    </div>
  );
}
