"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import type { AuthorityGuidePageData } from "@/authority/types/authorityPageTypes";
import type { AuthorityGuideCategory } from "@/authority/types/authorityPageTypes";
import {
  EditorialCard,
  EditorialCardGrid,
  EditorialBreadcrumb,
  EditorialMediaFrame,
  EditorialPageShell,
  EditorialTrustStrip,
  editorialInteractiveTransition,
  type EditorialCrumb,
} from "@/components/marketing/precision-luxury/ui/PremiumEditorialPrimitives";
import {
  EditorialFilterChips,
  EditorialSearchPanel,
} from "@/components/marketing/precision-luxury/ui/PremiumEditorialPrimitives.client";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";

const HERO_IMAGE = "/media/homepage/hero-nsm-her-002.jpg";
const CARD_MEDIA = [
  "/media/services/deep-cleaning.jpg",
  "/media/services/recurring-cleaning.jpg",
  "/media/services/move-transition.jpg",
  "/media/trust/oop-quality-inspection.jpg",
] as const;

const CARD_ALT = [
  "Nu Standard deep cleaning photography paired with educational guides.",
  "Nu Standard recurring cleaning imagery illustrating steady maintenance routines.",
  "Nu Standard move-focused cleaning photography supporting transitional home care.",
  "Nu Standard quality inspection moment reinforcing careful finish stewardship.",
] as const;

const FEATURED_ORDER = [
  "chemical-usage-and-safety",
  "cleaning-every-surface",
  "how-to-remove-stains-safely",
  "when-cleaning-damages-surfaces",
] as const;

const TOPIC_CHIPS = [
  { key: "all", label: "All Topics" },
  { key: "safety", label: "Safety" },
  { key: "surfaces", label: "Surfaces" },
  { key: "stains", label: "Stains" },
  { key: "maintenance", label: "Maintenance" },
  { key: "methods", label: "Methods" },
] as const;

function guideCategoryEyebrow(category?: AuthorityGuideCategory): string {
  switch (category) {
    case "anti_pattern":
      return "Anti-pattern";
    case "chemical_safety":
      return "Safety";
    case "failure_analysis":
      return "Methods & diagnosis";
    case "surface_protection":
      return "Surfaces";
    case "stain_removal":
      return "Stains";
    case "foundations":
      return "Maintenance";
    case "safety":
      return "Safety";
    default:
      return "Guide";
  }
}

function topicMatchesChip(guide: AuthorityGuidePageData, chip: string): boolean {
  if (chip === "all") return true;
  const cat = guide.category;
  if (chip === "safety") return cat === "chemical_safety" || cat === "safety";
  if (chip === "surfaces") return cat === "surface_protection" || cat === "foundations";
  if (chip === "stains") return cat === "stain_removal";
  if (chip === "maintenance") return cat === "foundations" || cat === "surface_protection";
  if (chip === "methods") return cat === "failure_analysis" || cat === "anti_pattern";
  return true;
}

function searchHaystack(guide: AuthorityGuidePageData): string {
  return [guide.title, guide.description, guide.summary, guide.intro, guide.category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function GuidesLandingExperience({
  guides,
  breadcrumbs,
  jsonLdSlot,
}: {
  guides: AuthorityGuidePageData[];
  breadcrumbs: EditorialCrumb[];
  jsonLdSlot?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string>("all");

  const featured = useMemo(() => {
    const map = new Map(guides.map((g) => [g.slug, g]));
    return FEATURED_ORDER.map((slug) => map.get(slug)).filter(Boolean) as AuthorityGuidePageData[];
  }, [guides]);

  const featuredSet = useMemo(() => new Set<string>(FEATURED_ORDER), []);

  const restGuides = useMemo(
    () => guides.filter((g) => !featuredSet.has(g.slug)).sort((a, b) => a.title.localeCompare(b.title)),
    [guides, featuredSet],
  );

  const filteredRest = useMemo(() => {
    const q = query.trim().toLowerCase();
    return restGuides.filter((guide) => {
      if (!topicMatchesChip(guide, topic)) return false;
      if (!q) return true;
      return searchHaystack(guide).includes(q);
    });
  }, [restGuides, query, topic]);

  const filteredFeatured = useMemo(() => {
    const q = query.trim().toLowerCase();
    return featured.filter((guide) => {
      if (!topicMatchesChip(guide, topic)) return false;
      if (!q) return true;
      return searchHaystack(guide).includes(q);
    });
  }, [featured, query, topic]);

  const primaryFeatured = filteredFeatured[0];
  const supportingFeatured = filteredFeatured.slice(1);

  return (
    <EditorialPageShell>
      <PublicSiteHeader />
      {jsonLdSlot}
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-8 md:px-8 md:pt-12">
        <EditorialBreadcrumb items={breadcrumbs} />

        <section className="mt-7 overflow-hidden rounded-[34px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-5 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.38)] sm:p-7 lg:p-9">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-stretch lg:gap-8">
            <div className="flex min-w-0 flex-col justify-between rounded-[28px] border border-[#E8DFD0]/80 bg-white/75 p-6 sm:p-8">
              <div>
                <p className="font-[var(--font-poppins)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B89F6B]">
                  THE NU STANDARD GUIDE
                </p>
                <h1 className="mt-5 font-[var(--font-poppins)] text-[2.45rem] font-semibold leading-[1.02] tracking-[-0.055em] text-[#0F172A] sm:text-5xl lg:text-[3.35rem]">
                  Expert guidance for a cleaner, healthier home.
                </h1>
                <p className="mt-5 max-w-xl font-[var(--font-manrope)] text-base leading-7 text-[#475569] sm:text-lg sm:leading-8">
                  Practical cleaning knowledge, surface care, and safety guidance—organized so you can act with confidence.
                </p>
              </div>
              <div className="mt-8 grid gap-3 font-[var(--font-manrope)] text-sm leading-6 text-[#475569] sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="rounded-[20px] border border-[#E8DFD0]/80 bg-[#FFF9F3] p-4">
                  <p className="font-semibold text-[#0F172A]">Surface-first</p>
                  <p className="mt-1 text-xs leading-5">Start with the material before choosing method or chemistry.</p>
                </div>
                <div className="rounded-[20px] border border-[#E8DFD0]/80 bg-[#FFF9F3] p-4">
                  <p className="font-semibold text-[#0F172A]">Safety before strength</p>
                  <p className="mt-1 text-xs leading-5">Escalate carefully, with compatibility and stop-points visible.</p>
                </div>
              </div>
            </div>

            <div className="relative min-w-0">
              <EditorialMediaFrame
                src={HERO_IMAGE}
                alt="Nu Standard cleaning professional caring for a calm home interior."
                priority
                aspectClassName="aspect-[16/11] lg:h-full lg:min-h-[520px]"
                frameClassName="rounded-[30px]"
              />
              {primaryFeatured ? (
                <a
                  href={`/guides/${primaryFeatured.slug}`}
                  className={`group mt-5 block rounded-[26px] border border-[#C9B27C]/24 bg-white/95 p-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.5)] outline-none lg:absolute lg:bottom-6 lg:left-6 lg:right-6 lg:mt-0 ${editorialInteractiveTransition} hover:-translate-y-0.5 hover:border-[#C9B27C]/45 focus-visible:ring-2 focus-visible:ring-[#C9B27C]/45`}
                >
                  <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B89F6B]">
                    Featured guide · {guideCategoryEyebrow(primaryFeatured.category)}
                  </p>
                  <h2 className="mt-3 font-[var(--font-poppins)] text-2xl font-semibold leading-tight tracking-[-0.04em] text-[#0F172A]">
                    {primaryFeatured.title}
                  </h2>
                  <p className="mt-3 max-w-2xl font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                    {primaryFeatured.summary ?? primaryFeatured.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 font-[var(--font-manrope)] text-sm font-semibold text-[#0D9488] group-hover:gap-2">
                    Read the feature <span aria-hidden>→</span>
                  </span>
                </a>
              ) : null}
            </div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)] lg:items-start">
            <EditorialSearchPanel
              placeholder="Search surfaces, stains, methods, and guides…"
              value={query}
              onChange={setQuery}
              chips={
                <EditorialFilterChips chips={[...TOPIC_CHIPS]} activeKey={topic} onChange={setTopic} ariaLabel="Topics" />
              }
              footer={
                <p className="font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                  Search stays close to the feature so browsing feels guided, not like a raw index.
                </p>
              }
            />
            <div className="rounded-[20px] border border-[#E8DFD0]/90 bg-white/80 p-5 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
              <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                Knowledge path
              </p>
              <p className="mt-3">
                Choose a topic, then use the guide cards to move from diagnosis to safer next steps.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="featured-guides-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B89F6B]">
                Curated first
              </p>
              <h2 id="featured-guides-heading" className="mt-2 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.04em] text-[#0F172A]">
                Featured paths through the library
              </h2>
            </div>
          </div>
          <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            {supportingFeatured.map((guide, index) => (
              <EditorialCard
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                eyebrow={guideCategoryEyebrow(guide.category)}
                title={guide.title}
                summary={guide.summary ?? guide.description}
                ctaLabel="Read guide"
                media={
                  index === 0 ? (
                    <EditorialMediaFrame
                      src={CARD_MEDIA[(index + 1) % CARD_MEDIA.length]}
                      alt={CARD_ALT[(index + 1) % CARD_ALT.length] ?? "Nu Standard editorial photography."}
                      aspectClassName="aspect-[16/10]"
                      frameClassName="rounded-none border-0 shadow-none"
                    />
                  ) : undefined
                }
              />
            ))}
          </div>
          {filteredFeatured.length === 0 ? (
            <p className="mt-4 font-[var(--font-manrope)] text-sm text-[#64748B]">No guides match your filters.</p>
          ) : null}
        </section>

        {filteredRest.length > 0 ? (
          <section className="mt-16" aria-labelledby="more-guides-heading">
            <h2 id="more-guides-heading" className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">
              More references
            </h2>
            <div className="mt-6">
              <EditorialCardGrid className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredRest.map((guide, index) => (
                  <EditorialCard
                    key={guide.slug}
                    href={`/guides/${guide.slug}`}
                    eyebrow={guideCategoryEyebrow(guide.category)}
                    title={guide.title}
                    summary={guide.summary ?? guide.description}
                    ctaLabel="Read Guide"
                    media={
                      <EditorialMediaFrame
                        src={CARD_MEDIA[(index + 2) % CARD_MEDIA.length]}
                        alt={
                          CARD_ALT[(index + 2) % CARD_ALT.length] ?? "Nu Standard editorial photography."
                        }
                        aspectClassName="aspect-[16/10]"
                        frameClassName="rounded-none border-0 shadow-none"
                      />
                    }
                  />
                ))}
              </EditorialCardGrid>
            </div>
          </section>
        ) : null}

        <div className="mt-16">
          <EditorialTrustStrip
            items={[
              { title: "Surface-First Guidance" },
              { title: "Safety Before Strength" },
              { title: "Know When to Stop" },
              { title: "Professional Standards" },
            ]}
          />
        </div>

        <section className="mt-12 rounded-[18px] border border-[#E8DFD0]/90 bg-white/70 p-6 font-[var(--font-manrope)] text-sm text-[#475569]">
          <a href="/encyclopedia/clusters" className="font-semibold text-[#0D9488] underline-offset-4 hover:underline">
            Topic clusters
          </a>
          — mid-level hubs that group related problems, methods, and surfaces.
        </section>
      </main>
      <PublicSiteFooter />
    </EditorialPageShell>
  );
}
