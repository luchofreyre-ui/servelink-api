import { SearchResultsPage } from "@/components/search/SearchResultsPage";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import { searchSiteIndex } from "@/search/searchSiteIndex";

interface SearchPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolved = (await searchParams) ?? {};
  const query = pickSingle(resolved.q);
  const data = searchSiteIndex(query);

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <main>
        <SearchResultsPage data={data} />
      </main>
      <PublicSiteFooter />
    </div>
  );
}
