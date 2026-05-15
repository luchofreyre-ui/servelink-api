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

export type EditorialProblemCard = {
  slug: string;
  title: string;
  summary: string;
  href: string;
  imageSrc?: string | null;
};

const CHIPS = [
  { key: "all", label: "All Problems" },
  { key: "stains", label: "Stains" },
  { key: "damage", label: "Damage" },
  { key: "residue", label: "Residue" },
  { key: "odor", label: "Odor" },
  { key: "discoloration", label: "Discoloration" },
] as const;

function problemThemes(slug: string, title: string): Set<string> {
  const blob = `${slug} ${title}`.toLowerCase();
  const s = new Set<string>();
  s.add("all");
  if (/\bstain|spotting|spot\b|soap.?scum|water.?spot|ring\b/.test(blob)) s.add("stains");
  if (/scratch|etch|damage|wear|chip|crazing/.test(blob)) s.add("damage");
  if (/residue|film|buildup|scum|stuck|tacky/.test(blob)) s.add("residue");
  if (/odor|smell|musty/.test(blob)) s.add("odor");
  if (/discolor|yellow|fade|haze|dull/.test(blob)) s.add("discoloration");
  return s;
}

export function ProblemsHubExperience({
  problems,
  breadcrumbs,
  jsonLdSlot,
  bottomSections,
}: {
  problems: EditorialProblemCard[];
  breadcrumbs: EditorialCrumb[];
  jsonLdSlot?: ReactNode;
  bottomSections?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems.filter((p) => {
      const themes = problemThemes(p.slug, p.title);
      if (!themes.has(chip)) return false;
      if (!q) return true;
      const hay = `${p.title} ${p.summary} ${p.slug}`.toLowerCase();
      return hay.includes(q);
    });
  }, [problems, query, chip]);

  return (
    <EditorialPageShell>
      <PublicSiteHeader />
      {jsonLdSlot}

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 md:px-8 md:pt-14">
        <EditorialBreadcrumb items={breadcrumbs} />

        <div className="mt-8">
          <EditorialHero
            eyebrow="PROBLEMS"
            title="Identify. Understand. Solve."
            body="Explore common cleaning problems, what causes them, and how to resolve them safely."
            aside={
              <EditorialMediaFrame
                src="/media/services/deep-cleaning.jpg"
                alt="Detail-focused cleaning work emphasizing safer problem-solving approaches."
              />
            }
          />
        </div>

        <div className="mt-10">
          <EditorialSearchPanel
            placeholder="Search problems, residues, symptoms…"
            value={query}
            onChange={setQuery}
            chips={<EditorialFilterChips chips={[...CHIPS]} activeKey={chip} onChange={setChip} />}
          />
        </div>

        <section className="mt-14" aria-labelledby="problem-cards-heading">
          <h2 id="problem-cards-heading" className="sr-only">
            Problem listings
          </h2>
          <EditorialCardGrid className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <EditorialCard
                key={p.slug}
                href={p.href}
                eyebrow="Problem"
                title={p.title}
                summary={p.summary}
                ctaLabel="Learn more"
                media={
                  p.imageSrc ? (
                    <EditorialMediaFrame
                      src={p.imageSrc}
                      alt={`Supporting photography for ${p.title}`}
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
              No problems matched — broaden filters or clear search.
            </p>
          ) : null}
        </section>

        <div className="mt-16">
          <EditorialTrustStrip
            variant="dense"
            items={[
              { title: "Surface-First", body: "Define the finish before choosing chemistry." },
              { title: "Test First", body: "When unsure, validate on an inconspicuous area." },
              { title: "Gentle Approach", body: "Start mild and escalate with intention—not impulse." },
              { title: "Know When to Stop", body: "Persistent symptoms may signal moisture or finish limits." },
            ]}
          />
        </div>

        {bottomSections ? <div className="mt-14 space-y-12">{bottomSections}</div> : null}
      </main>

      <PublicSiteFooter />
    </EditorialPageShell>
  );
}
