"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  EditorialBreadcrumb,
  EditorialCard,
  EditorialCardGrid,
  EditorialHero,
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

  return (
    <EditorialPageShell>
      <PublicSiteHeader />
      {jsonLdSlot}

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 md:px-8 md:pt-14">
        <EditorialBreadcrumb items={breadcrumbs} />

        <div className="mt-8">
          <EditorialHero
            eyebrow="SURFACES"
            title="Protect every surface with the right approach."
            body="Learn the right methods for cleaning and maintaining every surface in your home."
            aside={
              <EditorialMediaFrame
                src="/media/services/recurring-cleaning.jpg"
                alt="Nu Standard professional maintaining finishes with mindful technique."
              />
            }
          />
        </div>

        <div className="mt-10">
          <EditorialSearchPanel
            placeholder="Search surfaces, finishes, materials…"
            value={query}
            onChange={setQuery}
            chips={<EditorialFilterChips chips={[...CHIPS]} activeKey={chip} onChange={setChip} />}
          />
        </div>

        <section className="mt-14" aria-labelledby="surface-cards-heading">
          <h2 id="surface-cards-heading" className="sr-only">
            Surface listings
          </h2>
          <EditorialCardGrid className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <EditorialCard
                key={item.slug}
                href={item.href}
                eyebrow="Surface"
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
