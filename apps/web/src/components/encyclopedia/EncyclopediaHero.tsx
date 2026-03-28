import type { EncyclopediaFrontmatter } from "@/lib/encyclopedia/types";

interface EncyclopediaHeroProps {
  frontmatter: EncyclopediaFrontmatter;
}

export function EncyclopediaHero({ frontmatter }: EncyclopediaHeroProps) {
  return (
    <header className="space-y-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-8">
      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
        <span>{frontmatter.category}</span>
        <span>•</span>
        <span>{frontmatter.cluster}</span>
        <span>•</span>
        <span>{frontmatter.id}</span>
      </div>

      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">
          {frontmatter.title}
        </h1>

        <p className="max-w-3xl text-lg leading-8 text-neutral-700">
          {frontmatter.summary}
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-600">
        Primary image alt: {frontmatter.primaryImageAlt}
      </div>
    </header>
  );
}
