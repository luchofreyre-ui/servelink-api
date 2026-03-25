import { SiteSearchGroupedResults } from "@/types/search";
import { GlobalSearchForm } from "./GlobalSearchForm";

const TYPE_BADGE_LABELS: Record<string, string> = {
  encyclopedia: "Encyclopedia",
  method: "Method",
  surface: "Surface",
  problem: "Problem",
  tool: "Tool",
  article: "Article",
  guide: "Guide",
  cluster: "Cluster",
  comparison: "Comparison",
  question: "Question",
};

interface SearchResultsPageProps {
  data: SiteSearchGroupedResults;
}

export function SearchResultsPage({ data }: SearchResultsPageProps) {
  const hasQuery = data.query.trim().length > 0;
  const hasResults = data.total > 0;
  const topResult = hasResults ? data.results[0] : null;

  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8"
      data-testid="search-results-page"
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Search
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Search the Cleaning Encyclopedia
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Find methods, surfaces, problems, tools, guides, and knowledge articles across the platform.
            </p>
            <GlobalSearchForm
              initialQuery={data.query}
              placeholder="Search methods, surfaces, stains, tools, guides..."
              className="max-w-2xl"
            />
          </div>
        </section>

        {!hasQuery ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">
              Try searches like <span className="font-medium text-slate-900">soap scum</span>,{" "}
              <span className="font-medium text-slate-900">shower glass</span>,{" "}
              <span className="font-medium text-slate-900">degreasing</span>, or{" "}
              <span className="font-medium text-slate-900">hard water deposits</span>.
            </p>
          </section>
        ) : null}

        {hasQuery && topResult ? (
          <section
            className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm"
            data-testid="search-best-match"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Best match
            </p>
            <a href={topResult.href} className="mt-2 block">
              <h2 className="text-2xl font-semibold">{topResult.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
                {topResult.description}
              </p>
              <span className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {TYPE_BADGE_LABELS[topResult.type] ?? topResult.type}
              </span>
            </a>
          </section>
        ) : null}

        {hasQuery && !hasResults ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">No results found</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              We could not find anything for <span className="font-medium text-slate-900">“{data.query}”</span>.
              Try a broader term like a surface, problem, method, or guide.
            </p>
          </section>
        ) : null}

        {hasResults ? (
          <section className="space-y-6">
            <div className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{data.total}</span> result
              {data.total === 1 ? "" : "s"} for{" "}
              <span className="font-semibold text-slate-900">“{data.query}”</span>.
            </div>

            {data.grouped.map((group) => (
              <div
                key={group.type}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                data-testid="search-group"
                data-search-group-type={group.type}
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-slate-900">{group.label}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {group.items.length}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {group.items.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-400 hover:shadow-sm"
                    >
                      <div className="mb-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                          {TYPE_BADGE_LABELS[item.type] ?? item.type}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}
