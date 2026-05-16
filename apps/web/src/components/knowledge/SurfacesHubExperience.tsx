"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  EditorialBreadcrumb,
  EditorialCard,
  EditorialCardGrid,
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

export type EditorialSurfaceCard = {
  slug: string;
  title: string;
  summary: string;
  href: string;
  imageSrc?: string | null;
};

const CHIPS = [
  { key: "all", label: "All Surfaces" },
  { key: "stone", label: "Stone" },
  { key: "tile", label: "Tile & Grout" },
  { key: "wood", label: "Wood" },
  { key: "glass", label: "Glass" },
  { key: "fabric", label: "Fabric" },
  { key: "metal", label: "Metal" },
] as const;

function surfaceThemes(slug: string, title: string): Set<string> {
  const blob = `${slug} ${title}`.toLowerCase();
  const s = new Set<string>();
  s.add("all");
  if (/stone|marble|granite|quartz|slate|travertine/.test(blob)) s.add("stone");
  if (/tile|grout|ceramic|porcelain/.test(blob)) s.add("tile");
  if (/wood|hardwood|oak|finish|trim|cabinet|walnut/.test(blob)) s.add("wood");
  if (/glass|mirror|shower.?glass|window/.test(blob)) s.add("glass");
  if (/fabric|upholstery|carpet|rug|linen/.test(blob)) s.add("fabric");
  if (/steel|chrome|brass|metal|fixture/.test(blob)) s.add("metal");
  return s;
}

export function SurfacesHubExperience({
  surfaces,
  breadcrumbs,
  jsonLdSlot,
  bottomSections,
}: {
  surfaces: EditorialSurfaceCard[];
  breadcrumbs: EditorialCrumb[];
  jsonLdSlot?: ReactNode;
  bottomSections?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return surfaces.filter((item) => {
      const themes = surfaceThemes(item.slug, item.title);
      if (!themes.has(chip)) return false;
      if (!q) return true;
      const hay = `${item.title} ${item.summary} ${item.slug}`.toLowerCase();
      return hay.includes(q);
    });
  }, [surfaces, query, chip]);

  const featuredSurface = filtered[0];
  const remainingSurfaces = filtered.slice(1);

  return (
    <EditorialPageShell>
      <PublicSiteHeader />
      {jsonLdSlot}

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-8 md:px-8 md:pt-12">
        <EditorialBreadcrumb items={breadcrumbs} />

        <section className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-stretch">
          <div className="relative min-w-0">
            <EditorialMediaFrame
              src="/media/services/recurring-cleaning.jpg"
              alt="Nu Standard professional maintaining finishes with mindful technique."
              aspectClassName="aspect-[16/10] lg:h-full lg:min-h-[520px]"
              frameClassName="rounded-[32px]"
            />
            <div className="mt-5 rounded-[24px] border border-[#C9B27C]/20 bg-white/92 p-5 shadow-[0_22px_62px_-46px_rgba(15,23,42,0.46)] lg:absolute lg:bottom-6 lg:left-6 lg:right-6 lg:mt-0">
              <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                Material protection panel
              </p>
              <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                Identify the finish first; moisture, abrasives, acidity, and dwell time behave differently across materials.
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-between rounded-[34px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-6 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.38)] sm:p-8 lg:p-10">
            <div>
              <p className="font-[var(--font-poppins)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B89F6B]">
                SURFACES
              </p>
              <h1 className="mt-5 font-[var(--font-poppins)] text-[2.4rem] font-semibold leading-[1.03] tracking-[-0.055em] text-[#0F172A] sm:text-5xl lg:text-[3.15rem]">
                Know the finish before the cleaner.
              </h1>
              <p className="mt-5 max-w-xl font-[var(--font-manrope)] text-base leading-7 text-[#475569] sm:text-lg sm:leading-8">
                Learn the right methods for cleaning and maintaining every surface in your home without treating all materials the same.
              </p>
            </div>

            <div className="mt-8">
              <EditorialSearchPanel
                placeholder="Search surfaces, finishes, materials…"
                value={query}
                onChange={setQuery}
                chips={<EditorialFilterChips chips={[...CHIPS]} activeKey={chip} onChange={setChip} ariaLabel="Surface families" />}
                footer={
                  <p className="font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                    Use family chips as material shortcuts; search when you know the exact finish.
                  </p>
                }
              />
            </div>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="surface-cards-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B89F6B]">
                Material index
              </p>
              <h2 id="surface-cards-heading" className="mt-2 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.04em] text-[#0F172A]">
                Surfaces by finish and sensitivity
              </h2>
            </div>
            <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </p>
          </div>

          {featuredSurface ? (
            <a
              href={featuredSurface.href}
              className={`group mt-7 grid gap-6 rounded-[30px] border border-[#C9B27C]/24 bg-white p-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.45)] outline-none sm:p-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] ${editorialInteractiveTransition} hover:-translate-y-0.5 hover:border-[#C9B27C]/45 focus-visible:ring-2 focus-visible:ring-[#C9B27C]/45`}
            >
              <EditorialMediaFrame
                src={featuredSurface.imageSrc ?? "/media/trust/oop-quality-inspection.jpg"}
                alt={`Supporting photography for ${featuredSurface.title}`}
                aspectClassName="aspect-[16/10] lg:h-full"
                frameClassName="rounded-[24px]"
              />
              <div className="flex flex-col justify-center">
                <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B89F6B]">
                  Featured surface
                </p>
                <h3 className="mt-4 font-[var(--font-poppins)] text-3xl font-semibold leading-tight tracking-[-0.05em] text-[#0F172A]">
                  {featuredSurface.title}
                </h3>
                <p className="mt-4 font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
                  {featuredSurface.summary}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 font-[var(--font-manrope)] text-sm font-semibold text-[#0D9488] group-hover:gap-2">
                  Review surface guidance <span aria-hidden>→</span>
                </span>
              </div>
            </a>
          ) : null}

          <EditorialCardGrid className="mt-7 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {remainingSurfaces.map((item, index) => (
              <EditorialCard
                key={item.slug}
                href={item.href}
                eyebrow={index % 3 === 0 ? "Finish risk" : "Surface"}
                title={item.title}
                summary={item.summary}
                ctaLabel="Learn more"
                media={
                  item.imageSrc ? (
                    <EditorialMediaFrame
                      src={item.imageSrc}
                      alt={`Supporting photography for ${item.title}`}
                      aspectClassName="aspect-[16/10]"
                      frameClassName="rounded-none border-0 shadow-none"
                    />
                  ) : undefined
                }
              />
            ))}
          </EditorialCardGrid>
          {filtered.length === 0 ? (
            <p className="mt-6 font-[var(--font-manrope)] text-sm text-[#64748B]">
              No surfaces matched — broaden filters or clear search.
            </p>
          ) : null}
        </section>

        <div className="mt-16">
          <EditorialTrustStrip
            variant="dense"
            items={[
              { title: "Finish-Aware", body: "Every wipe respects coating chemistry." },
              { title: "Compatibility Checks", body: "Cross-reference manufacturer guidance." },
              { title: "Measured Moisture", body: "Especially near seams and porous edges." },
              { title: "Progressive Methods", body: "Escalate only when risk is understood." },
            ]}
          />
        </div>

        {bottomSections ? <div className="mt-14 space-y-12">{bottomSections}</div> : null}
      </main>

      <PublicSiteFooter />
    </EditorialPageShell>
  );
}
