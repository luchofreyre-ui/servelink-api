import { StructuredArticleRenderer } from "@/components/encyclopedia/StructuredArticleRenderer";
import type { ResolvedEncyclopediaPage } from "@/lib/encyclopedia/encyclopediaContentResolver";
import type { CanonicalPageSnapshot } from "@/lib/encyclopedia/encyclopediaPipelineTypes";
import { getPublishedEncyclopediaIndex } from "@/lib/encyclopedia/loader";
import { buildEncyclopediaHref } from "@/lib/encyclopedia/slug";
import { transformSnapshotToStructured } from "@/lib/encyclopedia/structuredTransformer";
import type { EncyclopediaCategory } from "@/lib/encyclopedia/types";

type Props = {
  page: ResolvedEncyclopediaPage;
  category: EncyclopediaCategory;
};

function makeResolveInternalLink(category: EncyclopediaCategory) {
  const index = getPublishedEncyclopediaIndex();
  return (slug: string) => {
    const entry = index.find((e) => e.slug === slug);
    if (entry) return buildEncyclopediaHref(entry.category, entry.slug);
    return buildEncyclopediaHref(category, slug);
  };
}

export function EncyclopediaPipelineArticle({ page, category }: Props) {
  if (page.source !== "live") {
    return null;
  }

  const snapshot = page.content as CanonicalPageSnapshot;
  const structured = transformSnapshotToStructured(snapshot);
  const resolveInternalLink = makeResolveInternalLink(category);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 md:px-8">
      <article className="rounded-[32px] border border-[#C9B27C]/20 bg-white/80 p-8 shadow-sm">
        <header className="space-y-4">
          {process.env.NODE_ENV !== "production" ? (
            <div style={{ fontSize: 12, opacity: 0.5 }}>LIVE PIPELINE</div>
          ) : null}
          <div className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
            Promoted pipeline
          </div>
        </header>

        <StructuredArticleRenderer
          article={structured}
          resolveInternalLink={resolveInternalLink}
          taxonomyProblem={snapshot.problem}
          taxonomySurface={snapshot.surface}
        />

        <p className="mt-10 font-[var(--font-manrope)] text-xs text-[#64748B]">
          Source: {page.source} (canonical ingest / promote)
        </p>
      </article>
    </main>
  );
}
