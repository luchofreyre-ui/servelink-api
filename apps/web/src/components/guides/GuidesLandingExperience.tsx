"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import type { AuthorityGuidePageData } from "@/authority/types/authorityPageTypes";
import type { AuthorityGuideCategory } from "@/authority/types/authorityPageTypes";
import {
  EditorialCard,
  EditorialCardGrid,
  EditorialHero,
  EditorialBreadcrumb,
  EditorialMediaFrame,
  EditorialPageShell,
  EditorialTrustStrip,
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

  return (
    <EditorialPageShell>
      <PublicSiteHeader />
      {jsonLdSlot}
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 md:px-8 md:pt-14">
        <EditorialBreadcrumb items={breadcrumbs} />

        <div className="mt-8">
          <EditorialHero
            eyebrow="THE NU STANDARD GUIDE"
            title="Expert guidance for a cleaner, healthier home."
            body="Practical cleaning knowledge, surface care, and safety guidance—organized so you can act with confidence."
            aside={
              <EditorialMediaFrame src={HERO_IMAGE} alt="Nu Standard cleaning professional caring for a calm home interior." priority />
            }
          />
        </div>

        <div className="mt-10">
          <EditorialTrustStrip
            variant="mini"
            items={[
              {
                title: "Trusted Knowledge",
                body: "Researched and written with professional standards.",
              },
              {
                title: "Safety First",
                body: "Surface protection and chemical safety are at the core.",
              },
            ]}
          />
        </div>

        <div className="mt-10">
          <EditorialSearchPanel
            placeholder="Search surfaces, stains, methods, and guides…"
            value={query}
            onChange={setQuery}
            chips={
              <EditorialFilterChips chips={[...TOPIC_CHIPS]} activeKey={topic} onChange={setTopic} ariaLabel="Topics" />
            }
          />
        </div>

        <section className="mt-14" aria-labelledby="featured-guides-heading">
          <h2 id="featured-guides-heading" className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">
            Featured guides
          </h2>
          <div className="mt-6">
            <EditorialCardGrid>
              {filteredFeatured.map((guide, index) => (
                <EditorialCard
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  eyebrow={guideCategoryEyebrow(guide.category)}
                  title={guide.title}
                  summary={guide.summary ?? guide.description}
                  ctaLabel="Read Guide"
                  media={
                    <EditorialMediaFrame
                      src={CARD_MEDIA[index % CARD_MEDIA.length]}
                      alt={CARD_ALT[index % CARD_ALT.length] ?? "Nu Standard editorial photography."}
                      aspectClassName="aspect-[16/10]"
                      frameClassName="rounded-none border-0 shadow-none"
                    />
                  }
                />
              ))}
            </EditorialCardGrid>
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
