import type { StructuredArticle } from "@/lib/encyclopedia/structuredTypes";
import { SectionRenderer } from "./sections/SectionRenderer";

type Props = {
  article: StructuredArticle;
  resolveInternalLink?: (slug: string) => string;
};

export function StructuredArticleRenderer({ article, resolveInternalLink }: Props) {
  return (
    <div className="mt-6">
      <h1 className="font-[var(--font-poppins)] text-4xl font-semibold tracking-tight text-[#0F172A]">
        {article.title}
      </h1>

      {article.sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          resolveInternalLink={resolveInternalLink}
        />
      ))}
    </div>
  );
}
