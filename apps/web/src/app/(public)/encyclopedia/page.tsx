import type { Metadata } from "next";
import Link from "next/link";
import { buildAuthorityEncyclopediaMetadata } from "@/authority/metadata/authorityMetadata";
import {
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
} from "@/authority/metadata/authoritySchema";
import { AuthorityJsonLd } from "@/components/authority/AuthorityJsonLd";
import { KnowledgeHubLandingPage } from "@/components/knowledge/KnowledgeHubLandingPage";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import {
  getAllEncyclopediaCategories,
  getEncyclopediaCategorySummaries,
  getEncyclopediaHomeStats,
} from "@/lib/encyclopedia/loader";
import {
  buildEncyclopediaCategoryHref,
  formatEncyclopediaCategoryLabel,
} from "@/lib/encyclopedia/slug";

export const metadata: Metadata = buildAuthorityEncyclopediaMetadata();

const ENCYCLOPEDIA_TITLE = "Cleaning encyclopedia";
const ENCYCLOPEDIA_DESCRIPTION =
  "Structured methods, surfaces, problems, and guides—deterministic playbooks for safer home cleaning.";

export default function EncyclopediaPage() {
  const stats = getEncyclopediaHomeStats();
  const categories = getEncyclopediaCategorySummaries();
  const categoryMap = new Map(categories.map((category) => [category.category, category]));
  const allCategories = getAllEncyclopediaCategories();

  const indexJsonLd = [
    buildBreadcrumbListSchema([
      { label: "Home", href: "/" },
      { label: ENCYCLOPEDIA_TITLE, href: "/encyclopedia" },
    ]),
    buildCollectionPageSchema({
      title: ENCYCLOPEDIA_TITLE,
      description: ENCYCLOPEDIA_DESCRIPTION,
      path: "/encyclopedia",
    }),
  ];

  return (
    <div
      className="min-h-screen bg-[#FFF9F3] text-[#0F172A]"
      data-testid="encyclopedia-page"
    >
      <PublicSiteHeader />
      <AuthorityJsonLd data={indexJsonLd} />
      <KnowledgeHubLandingPage />

      <main className="mx-auto max-w-6xl px-6 pb-16 md:px-8">
        <section className="rounded-[32px] border border-[#C9B27C]/20 bg-white/80 p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                Pipeline migration status
              </p>
              <h2 className="font-[var(--font-poppins)] text-3xl font-semibold tracking-tight text-[#0F172A]">
                Unified encyclopedia engine
              </h2>
              <p className="max-w-3xl font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
                The public encyclopedia is now being moved onto the file-based
                content pipeline so the system can scale cleanly without
                duplicate data definitions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 font-[var(--font-manrope)] text-sm text-[#475569]">
              <span>{stats.totalCount} mapped</span>
              <span>{stats.publishedCount} published</span>
              <span>{stats.fileBackedCount} file-backed</span>
              <span>{stats.imageReadyCount} image-ready</span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {allCategories.map((category) => {
              const summary = categoryMap.get(category);

              return (
                <Link
                  key={category}
                  href={buildEncyclopediaCategoryHref(category)}
                  className="rounded-2xl border border-[#C9B27C]/20 bg-[#FFF9F3] p-5 transition hover:border-[#0D9488]/40"
                >
                  <h3 className="font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">
                    {formatEncyclopediaCategoryLabel(category)}
                  </h3>
                  <div className="mt-3 space-y-1 font-[var(--font-manrope)] text-sm text-[#475569]">
                    <div>{summary?.totalCount ?? 0} total</div>
                    <div>{summary?.publishedCount ?? 0} published</div>
                    <div>{summary?.draftCount ?? 0} draft</div>
                    <div>{summary?.plannedCount ?? 0} planned</div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-[#0D9488]/20 bg-[#F0FDFA]/50 p-5">
            <p className="font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
              <span className="font-semibold text-[#0F172A]">Topic clusters</span>{" "}
              group published problems, methods, and surfaces by shared intent—
              problem-first hubs derived from the index only.
            </p>
            <Link
              href="/encyclopedia/clusters"
              className="mt-3 inline-block font-[var(--font-manrope)] text-sm font-semibold text-[#0D9488] hover:underline"
            >
              Browse topic clusters →
            </Link>
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
