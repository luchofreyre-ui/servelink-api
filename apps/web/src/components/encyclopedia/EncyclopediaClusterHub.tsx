import Link from "next/link";
import { formatEncyclopediaCategoryLabel } from "@/lib/encyclopedia/slug";
import type {
  EncyclopediaClusterRollup,
  EncyclopediaClusterSectionKind,
} from "@/lib/encyclopedia/types";

function sectionEyebrow(kind: EncyclopediaClusterSectionKind): string {
  switch (kind) {
    case "problems":
      return "Main issues in this topic";
    case "methods":
      return "How professionals approach it";
    case "surfaces":
      return "Where you’ll see it";
    case "mixed":
      return "Keep exploring";
    default:
      return "";
  }
}

function sectionAccentClass(kind: EncyclopediaClusterSectionKind): string {
  switch (kind) {
    case "problems":
      return "text-[#B45309]";
    case "methods":
      return "text-[#0D9488]";
    case "surfaces":
      return "text-[#6366F1]";
    case "mixed":
      return "text-[#64748B]";
    default:
      return "text-[#64748B]";
  }
}

interface EncyclopediaClusterHubProps {
  rollup: EncyclopediaClusterRollup;
}

export function EncyclopediaClusterHub({ rollup }: EncyclopediaClusterHubProps) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:px-8">
      <header className="space-y-6">
        <div>
          <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
            Topic cluster
          </p>
          <h1 className="mt-2 font-[var(--font-poppins)] text-4xl font-semibold tracking-tight text-[#0F172A] md:text-5xl">
            {rollup.title}
          </h1>
        </div>

        <p className="max-w-3xl font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">
          {rollup.intro}
        </p>

        <div className="flex flex-wrap gap-3 font-[var(--font-manrope)] text-sm text-[#334155]">
          <span className="rounded-full border border-[#C9B27C]/30 bg-white/90 px-4 py-1.5">
            <span className="font-semibold text-[#0F172A]">
              {rollup.totalPublishedPages}
            </span>{" "}
            published guides
          </span>
          {rollup.problemCount > 0 ?
            <span className="rounded-full border border-[#C9B27C]/20 bg-[#FFF7ED]/80 px-4 py-1.5">
              <span className="font-semibold text-[#B45309]">
                {rollup.problemCount}
              </span>{" "}
              problem{rollup.problemCount === 1 ? "" : "s"}
            </span>
          : null}
          {rollup.methodCount > 0 ?
            <span className="rounded-full border border-[#C9B27C]/20 bg-[#F0FDFA]/80 px-4 py-1.5">
              <span className="font-semibold text-[#0D9488]">
                {rollup.methodCount}
              </span>{" "}
              method{rollup.methodCount === 1 ? "" : "s"}
            </span>
          : null}
          {rollup.surfaceCount > 0 ?
            <span className="rounded-full border border-[#C9B27C]/20 bg-[#EEF2FF]/80 px-4 py-1.5">
              <span className="font-semibold text-[#6366F1]">
                {rollup.surfaceCount}
              </span>{" "}
              surface{rollup.surfaceCount === 1 ? "" : "s"}
            </span>
          : null}
        </div>
      </header>

      {rollup.featuredEntries.length > 0 ?
        <section className="mt-14 space-y-4">
          <div className="space-y-1">
            <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
              Start here
            </p>
            <h2 className="font-[var(--font-poppins)] text-2xl font-semibold text-[#0F172A]">
              Strongest pages in this cluster
            </h2>
            <p className="max-w-2xl font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              Problem-first ranking: the issues people search for, then the
              methods and surfaces that complete the story.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {rollup.featuredEntries.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={entry.href}
                  className="block rounded-2xl border border-[#C9B27C]/20 bg-white/90 p-4 transition hover:border-[#C9B27C]/40 hover:shadow-sm"
                >
                  <span className="font-[var(--font-poppins)] text-base font-semibold text-[#0F172A]">
                    {entry.title}
                  </span>
                  <div className="mt-1 font-[var(--font-manrope)] text-xs uppercase tracking-[0.12em] text-[#64748B]">
                    {formatEncyclopediaCategoryLabel(entry.category)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      : null}

      <div className="mt-16 space-y-14">
        {rollup.sections.map((section) => (
          <section key={section.title} className="space-y-4">
            <div className="space-y-1 border-b border-[#C9B27C]/15 pb-4">
              <p
                className={`font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.14em] ${sectionAccentClass(section.category)}`}
              >
                {sectionEyebrow(section.category)}
              </p>
              <h2 className="font-[var(--font-poppins)] text-2xl font-semibold text-[#0F172A]">
                {section.title}
              </h2>
            </div>
            <ul className="grid gap-3 md:grid-cols-2">
              {section.entries.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={entry.href}
                    className="group flex flex-col rounded-xl border border-transparent px-1 py-2 hover:border-[#C9B27C]/25"
                  >
                    <span className="font-[var(--font-manrope)] text-sm font-semibold text-[#0D9488] group-hover:underline">
                      {entry.title}
                    </span>
                    <span className="mt-0.5 font-[var(--font-manrope)] text-xs uppercase tracking-[0.12em] text-[#64748B]">
                      {formatEncyclopediaCategoryLabel(entry.category)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
