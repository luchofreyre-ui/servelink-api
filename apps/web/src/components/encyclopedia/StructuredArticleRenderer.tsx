import RecommendedProductsForTopic from "@/components/products/RecommendedProductsForTopic";
import { inferRecommendationIntent } from "@/lib/products/getRecommendedProducts";
import type { StructuredArticle, StructuredSection } from "@/lib/encyclopedia/structuredTypes";
import { ENCYCLOPEDIA_COMMON_MISTAKES } from "@/lib/encyclopedia/encyclopediaMisuseSnippets";
import { SectionRenderer } from "./sections/SectionRenderer";

function isWhatItIsSection(title: string) {
  const t = title.toLowerCase();
  return t.includes("what it is") || t.includes("what is it");
}

function isWhyItHappensSection(title: string) {
  return title.toLowerCase().includes("why it happens");
}

function isHowToFixSection(title: string) {
  return title.toLowerCase().includes("how to fix");
}

function EducationCauseBridge() {
  return (
    <div className="mt-6 border-l-2 border-zinc-200 pl-4">
      <p className="text-sm font-medium text-zinc-700">Why this happens</p>
      <p className="text-sm text-zinc-600">
        Understanding the cause is what determines the correct fix.
      </p>
    </div>
  );
}

function EducationToSolutionHandoff() {
  return (
    <p className="mt-6 text-sm text-zinc-600">
      Now that you understand what's causing the issue, here's how to fix it properly.
    </p>
  );
}

function renderSectionWithBridges(
  section: StructuredSection,
  index: number,
  sections: StructuredSection[],
  resolveInternalLink?: (slug: string) => string,
) {
  const next = sections[index + 1];
  const showCauseBridgeAfter =
    isWhatItIsSection(section.title) && !(next && isWhyItHappensSection(next.title));

  const showHandoffBefore = isHowToFixSection(section.title);

  return (
    <div key={section.id}>
      {showHandoffBefore ? <EducationToSolutionHandoff /> : null}
      <SectionRenderer section={section} resolveInternalLink={resolveInternalLink} />
      {showCauseBridgeAfter ? <EducationCauseBridge /> : null}
    </div>
  );
}

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

      {article.sections.map((section, index) =>
        renderSectionWithBridges(section, index, article.sections, resolveInternalLink),
      )}

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
