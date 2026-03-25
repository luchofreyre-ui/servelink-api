import { GlobalSearchForm } from "@/components/search/GlobalSearchForm";

const featuredSections = [
  {
    title: "Methods",
    href: "/methods",
    description: "Explore proven cleaning methods, what they solve, and where they should or should not be used.",
  },
  {
    title: "Surfaces",
    href: "/surfaces",
    description: "Learn how different materials behave, what damages them, and which methods are compatible.",
  },
  {
    title: "Problems",
    href: "/problems",
    description: "Understand soap scum, grease, hard water deposits, dust buildup, and other common cleaning issues.",
  },
  {
    title: "Tools",
    href: "/tools",
    description: "See how professional tools are used, when they help, and where misuse creates damage risk.",
  },
  {
    title: "Guides",
    href: "/guides",
    description: "Read long-form guides on chemical safety, why cleaning fails, and system-level cleaning standards.",
  },
  {
    title: "Clusters",
    href: "/clusters",
    description: "Follow grouped learning paths around recurring cleaning patterns and problem families.",
  },
];

export function KnowledgeHubLandingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Encyclopedia
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Cleaning Encyclopedia
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              The structured knowledge system behind methods, surfaces, problems, tools, and cleaning guidance
              across the platform. Use search to find a specific answer fast, or browse by topic.
            </p>

            <div data-testid="encyclopedia-hero-search">
              <GlobalSearchForm
                placeholder="Search methods, surfaces, stains, tools, guides..."
                className="max-w-2xl"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredSections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p>
            </a>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">How to use this encyclopedia</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Start with search</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Search for a stain, surface, method, or guide to get to the right topic quickly.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Browse by topic</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Navigate methods, surfaces, problems, tools, and guides to understand the system more deeply.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Apply safely</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use the encyclopedia to understand why a method works, when it fails, and how damage risk changes by surface.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
