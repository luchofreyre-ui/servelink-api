import RecommendedProductsForTopic from "@/components/products/RecommendedProductsForTopic";
import { inferRecommendationIntent } from "@/lib/products/getRecommendedProducts";
import type { StructuredArticle } from "@/lib/encyclopedia/structuredTypes";
import { ENCYCLOPEDIA_COMMON_MISTAKES } from "@/lib/encyclopedia/encyclopediaMisuseSnippets";
import { SectionRenderer } from "./sections/SectionRenderer";

type Props = {
  article: StructuredArticle;
  resolveInternalLink?: (slug: string) => string;
  /** Live pipeline taxonomy strings for product recommendations (exact match vs product library). */
  taxonomyProblem?: string;
  taxonomySurface?: string;
};

export function StructuredArticleRenderer({
  article,
  resolveInternalLink,
  taxonomyProblem,
  taxonomySurface,
}: Props) {
  const showRecommendations =
    typeof taxonomyProblem === "string" &&
    taxonomyProblem.trim() !== "" &&
    typeof taxonomySurface === "string" &&
    taxonomySurface.trim() !== "";

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

      {showRecommendations ? (
        <div className="mt-10">
          <RecommendedProductsForTopic
            problem={taxonomyProblem}
            surface={taxonomySurface}
            intent={inferRecommendationIntent(taxonomyProblem)}
          />
        </div>
      ) : null}

      <section className="mt-10 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6" aria-labelledby="pipe-misuse">
        <h2 id="pipe-misuse" className="text-lg font-semibold text-neutral-900">
          Common mistakes
        </h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-neutral-700">
          {ENCYCLOPEDIA_COMMON_MISTAKES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      {(article.internalLinks?.length ?? 0) > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-semibold">Related Topics</h3>
          <ul>
            {(article.internalLinks ?? []).map((link) => (
              <li key={link.slug}>
                <a href={`/encyclopedia/${link.slug}`}>{link.title}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
