import Link from "next/link";
import type { SiteSearchDocument } from "@/types/search";

interface SearchResultsPageProps {
  query: string;
  results: SiteSearchDocument[];
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
    case "encyclopedia":
      return "Encyclopedia";
    default:
      return type;
  }
}

export function SearchResultsPage({
  query,
  results,
}: SearchResultsPageProps) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:px-8">
      <div className="space-y-3">
        <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
          Search
        </p>
        <h1 className="font-[var(--font-poppins)] text-4xl font-semibold tracking-tight text-[#0F172A]">
          Results for “{query}”
        </h1>
        <p className="font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
          {results.length} result{results.length === 1 ? "" : "s"} found across
          authority pages and pipeline-backed encyclopedia content.
        </p>
      </div>

      {results.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-[#C9B27C]/20 bg-white/80 p-6 font-[var(--font-manrope)] text-sm text-[#64748B]">
          No results matched this search yet.
        </div>
      ) : (
        <div className="mt-10 grid gap-4">
          {results.map((result) => (
            <article
              key={result.id}
              className="rounded-2xl border border-[#C9B27C]/20 bg-white/80 p-6"
            >
              <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                <span>{formatTypeLabel(result.type)}</span>
                <span>•</span>
                <span>{result.source}</span>
              </div>

              <h2 className="mt-3 font-[var(--font-poppins)] text-2xl font-semibold text-[#0F172A]">
                <Link href={result.href} className="hover:text-[#0D9488]">
                  {result.title}
                </Link>
              </h2>

              <p className="mt-3 font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
                {result.description}
              </p>

              <div className="mt-4">
                <Link
                  href={result.href}
                  className="font-[var(--font-manrope)] text-sm font-medium text-[#0D9488] hover:underline"
                >
                  Open page
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
