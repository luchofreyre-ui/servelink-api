import { EncyclopediaLinkedGroups } from "./EncyclopediaLinkedGroups";
import type { EncyclopediaDocument } from "@/lib/encyclopedia/types";

interface EncyclopediaPageProps {
  document: EncyclopediaDocument;
}

export function EncyclopediaPage({ document }: EncyclopediaPageProps) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 md:px-8">
      <article className="rounded-[32px] border border-[#C9B27C]/20 bg-white/80 p-8 shadow-sm">
        <header className="space-y-4">
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
      </article>

      <EncyclopediaLinkedGroups groups={document.linkedGroups} />
    </main>
  );
}
