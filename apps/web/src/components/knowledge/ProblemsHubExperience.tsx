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

  const featuredProblem = filtered[0];
  const remainingProblems = filtered.slice(1);

  return (
    <EditorialPageShell>
      <PublicSiteHeader />
      {jsonLdSlot}

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-8 md:px-8 md:pt-12">
        <EditorialBreadcrumb items={breadcrumbs} />

        <section className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
          <div className="rounded-[34px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-6 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.38)] sm:p-8 lg:p-10">
            <p className="font-[var(--font-poppins)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B89F6B]">
              PROBLEMS
            </p>
            <h1 className="mt-5 font-[var(--font-poppins)] text-[2.4rem] font-semibold leading-[1.03] tracking-[-0.055em] text-[#0F172A] sm:text-5xl lg:text-[3.15rem]">
              What are you seeing?
            </h1>
            <p className="mt-5 max-w-xl font-[var(--font-manrope)] text-base leading-7 text-[#475569] sm:text-lg sm:leading-8">
              Start with the symptom, understand the likely cause, then choose a safer next step.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                ["Identify", "Name the residue, mark, odor, or damage pattern."],
                ["Understand", "Separate cleaning problems from finish or moisture limits."],
                ["Solve", "Escalate only when the surface can tolerate the method."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-[20px] border border-[#E8DFD0]/85 bg-white/78 p-4">
                  <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B89F6B]">
                    {title}
                  </p>
                  <p className="mt-2 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="relative">
              <EditorialMediaFrame
                src="/media/services/deep-cleaning.jpg"
                alt="Detail-focused cleaning work emphasizing safer problem-solving approaches."
                aspectClassName="aspect-[16/10]"
                frameClassName="rounded-[30px]"
              />
              <div className="mt-5 rounded-[24px] border border-[#C9B27C]/20 bg-white/92 p-5 shadow-[0_22px_62px_-46px_rgba(15,23,42,0.46)] lg:absolute lg:bottom-5 lg:left-5 lg:right-5 lg:mt-0">
                <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                  Diagnostic panel
                </p>
                <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                  The right answer starts by identifying whether a mark is removable soil, mineral residue, chemical damage, or a material limit.
                </p>
              </div>
            </div>
            <EditorialSearchPanel
              placeholder="Search problems, residues, symptoms…"
              value={query}
              onChange={setQuery}
              chips={<EditorialFilterChips chips={[...CHIPS]} activeKey={chip} onChange={setChip} ariaLabel="Problem themes" />}
              footer={
                <p className="font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                  Filters act like diagnosis shortcuts; broaden them when a symptom overlaps categories.
                </p>
              }
            />
          </div>
        </section>

        <section className="mt-14" aria-labelledby="problem-cards-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B89F6B]">
                Diagnostic index
              </p>
              <h2 id="problem-cards-heading" className="mt-2 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.04em] text-[#0F172A]">
                Problems by symptom and cause
              </h2>
            </div>
            <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </p>
          </div>

          {featuredProblem ? (
            <a
              href={featuredProblem.href}
              className={`group mt-7 grid gap-6 rounded-[30px] border border-[#C9B27C]/24 bg-white p-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.45)] outline-none sm:p-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] ${editorialInteractiveTransition} hover:-translate-y-0.5 hover:border-[#C9B27C]/45 focus-visible:ring-2 focus-visible:ring-[#C9B27C]/45`}
            >
              {featuredProblem.imageSrc ? (
                <EditorialMediaFrame
                  src={featuredProblem.imageSrc}
                  alt={`Supporting photography for ${featuredProblem.title}`}
                  aspectClassName="aspect-[16/10] lg:h-full"
                  frameClassName="rounded-[24px]"
                />
              ) : (
                <div className="rounded-[24px] border border-[#E8DFD0]/90 bg-[#FFF9F3] p-6" aria-hidden />
              )}
              <div className="flex flex-col justify-center">
                <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B89F6B]">
                  Featured diagnosis
                </p>
                <h3 className="mt-4 font-[var(--font-poppins)] text-3xl font-semibold leading-tight tracking-[-0.05em] text-[#0F172A]">
                  {featuredProblem.title}
                </h3>
                <p className="mt-4 font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
                  {featuredProblem.summary}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 font-[var(--font-manrope)] text-sm font-semibold text-[#0D9488] group-hover:gap-2">
                  Diagnose this problem <span aria-hidden>→</span>
                </span>
              </div>
            </a>
          ) : null}

          <EditorialCardGrid className="mt-7 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {remainingProblems.map((p, index) => (
              <EditorialCard
                key={p.slug}
                href={p.href}
                eyebrow={index % 3 === 0 ? "Cause & symptom" : "Problem"}
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
