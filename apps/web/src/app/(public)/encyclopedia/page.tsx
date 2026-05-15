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
  EditorialCard,
  EditorialCardGrid,
} from "@/components/marketing/precision-luxury/ui/PremiumEditorialPrimitives";
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
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]" data-testid="encyclopedia-page">
      <PublicSiteHeader />
      <AuthorityJsonLd data={indexJsonLd} />
      <KnowledgeHubLandingPage />

      <main className="mx-auto max-w-7xl px-6 pb-16 md:px-8">
        <section className="rounded-[24px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-7 shadow-[0_18px_46px_-30px_rgba(15,23,42,0.35)] sm:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                Pipeline migration status
              </p>
              <h2 className="font-[var(--font-poppins)] text-2xl font-semibold tracking-tight text-[#0F172A] sm:text-3xl">
                Unified encyclopedia engine
              </h2>
              <p className="max-w-3xl font-[var(--font-manrope)] text-base leading-relaxed text-[#475569]">
                The public encyclopedia is now being moved onto the file-based content pipeline so the system can scale
                cleanly without duplicate data definitions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 font-[var(--font-manrope)] text-xs text-[#64748B] sm:text-sm">
              <span>{stats.totalCount} mapped</span>
              <span aria-hidden className="hidden text-[#CBD5E1] sm:inline">
                ·
              </span>
              <span>{stats.publishedCount} published</span>
              <span aria-hidden className="hidden text-[#CBD5E1] sm:inline">
                ·
              </span>
              <span>{stats.fileBackedCount} file-backed</span>
              <span aria-hidden className="hidden text-[#CBD5E1] sm:inline">
                ·
              </span>
              <span>{stats.imageReadyCount} image-ready</span>
            </div>
          </div>

          <div className="mt-10">
            <EditorialCardGrid className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {allCategories.map((category) => {
                const summary = categoryMap.get(category);

                return (
                  <EditorialCard
                    key={category}
                    href={buildEncyclopediaCategoryHref(category)}
                    eyebrow="Pipeline category"
                    title={formatEncyclopediaCategoryLabel(category)}
                    summary={`${summary?.publishedCount ?? 0} published · ${summary?.draftCount ?? 0} draft · ${summary?.plannedCount ?? 0} planned · ${summary?.totalCount ?? 0} indexed`}
                    ctaLabel="Open category"
                  />
                );
              })}
            </EditorialCardGrid>
          </div>

          <div className="mt-10 rounded-[18px] border border-[#E8DFD0]/90 bg-white/70 p-6">
            <p className="font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569]">
              <span className="font-semibold text-[#0F172A]">Topic clusters</span> group published problems, methods, and
              surfaces by shared intent—problem-first hubs derived from the index only.
            </p>
            <Link
              href="/encyclopedia/clusters"
              className="mt-4 inline-flex items-center gap-1 font-[var(--font-manrope)] text-sm font-semibold text-[#0D9488] underline-offset-4 hover:underline"
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
