import { EncyclopediaLinkedGroups } from "./EncyclopediaLinkedGroups";
import type { EncyclopediaDocument } from "@/lib/encyclopedia/types";
import { ENCYCLOPEDIA_COMMON_MISTAKES } from "@/lib/encyclopedia/encyclopediaMisuseSnippets";

interface EncyclopediaPageProps {
  document: EncyclopediaDocument;
}

export function EncyclopediaPage({ document }: EncyclopediaPageProps) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
      <article className="grid gap-10 lg:grid-cols-[minmax(0,720px)_320px] lg:items-start lg:justify-between">
        <div className="rounded-[34px] border border-[#E8DFD0]/95 bg-white/88 p-6 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.32)] sm:p-8">
        <header className="space-y-4 rounded-[28px] border border-[#E8DFD0]/80 bg-[#FFFCF7]/85 p-6">
          <div className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
            {document.frontmatter.category.replace(/-/g, " ")}
          </div>

          <h1 className="font-[var(--font-poppins)] text-4xl font-semibold tracking-tight text-[#0F172A]">
            {document.frontmatter.title}
          </h1>

          <p className="font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">
            {document.frontmatter.summary}
          </p>
        </header>

        <div className="mt-10 space-y-10">
          {document.sections.map((section) => (
            <section key={section.heading} className="space-y-3">
              <h2 className="font-[var(--font-poppins)] text-2xl font-semibold text-[#0F172A]">
                {section.heading}
              </h2>
              <div className="font-[var(--font-manrope)] text-base leading-8 text-[#334155] whitespace-pre-line">
                {section.body}
              </div>
            </section>
          ))}
        </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28">
          <div className="rounded-[22px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-6 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.28)]">
            <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
              Key takeaway
            </p>
            <p className="mt-3 font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569]">
              {document.frontmatter.summary}
            </p>
          </div>
          <div className="rounded-[22px] border border-[#E8DFD0]/95 bg-white/90 p-6 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.28)]">
            <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
              In this guide
            </p>
            <ul className="mt-4 space-y-3 font-[var(--font-manrope)] text-sm text-[#475569]">
              {document.sections.slice(0, 6).map((section) => (
                <li key={section.heading}>{section.heading}</li>
              ))}
            </ul>
          </div>
        </aside>
      </article>

      <section
        className="mt-10 rounded-[28px] border border-amber-200/80 bg-amber-50/40 px-8 py-6"
        aria-labelledby="ency-misuse-heading"
      >
        <h2
          id="ency-misuse-heading"
          className="font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]"
        >
          Common mistakes
        </h2>
        <ul className="mt-3 list-inside list-disc space-y-2 font-[var(--font-manrope)] text-sm leading-7 text-[#475569]">
          {ENCYCLOPEDIA_COMMON_MISTAKES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <EncyclopediaLinkedGroups groups={document.linkedGroups} />
    </main>
  );
}
