import Link from "next/link";

import {
  getComparisonSeedBySlug,
  normalizeComparisonSlug,
} from "@/authority/data/authorityComparisonSelectors";
import { RecommendationConfidenceBadge } from "@/components/products/RecommendationConfidenceBadge";
import {
  getRecommendedProducts,
  inferRecommendationIntent,
  type PublishedProductLike,
} from "@/lib/products/getRecommendedProducts";
import {
  buildRecommendationCaveat,
  buildRecommendationReasons,
} from "@/lib/products/recommendationExplanation";
import {
  recommendationConfidence,
  recommendationConfidenceExplanation,
  recommendationConfidenceLabel,
} from "@/lib/products/recommendationConfidence";
import { whenThisLosesOnPlaybook } from "@/lib/products/productWhenThisLoses";
import type { ProductCleaningIntent } from "@/lib/products/productTypes";

export type RecommendationContextTone =
  | "direct"
  | "surface_wording_match"
  | "method_representative"
  | "anti_pattern_replacement"
  | "comparison_fallback";

type Props = {
  problem: string;
  surface: string;
  /** When set, overrides problem-inferred intent for the recommendation engine. */
  intent?: ProductCleaningIntent;
  /** Replaces the default section H2 (used by contextual placements). */
  sectionTitle?: string;
  contextTone?: RecommendationContextTone;
  showScores?: boolean;
  showReasons?: boolean;
  showComparisons?: boolean;
};

function getScore(product: {
  finalScore?: number;
  score?: number;
  rating?: { finalScore?: number };
}) {
  return product.finalScore ?? product.score ?? product.rating?.finalScore ?? null;
}

function explainLines(reasons: string[]): { summary: string[]; cautionsFromReasons: string[] } {
  const cautionsFromReasons = reasons.filter((r) => r.startsWith("Caution:"));
  const neutral = reasons.filter((r) => !r.startsWith("Caution:"));
  return { summary: neutral.slice(0, 2), cautionsFromReasons };
}

function findComparisonLink(
  slug: string,
  index: number,
  topProducts: PublishedProductLike[],
  expanded: PublishedProductLike[],
): { compareSlug: string; peerTitle: string } | null {
  const tryPair = (other: PublishedProductLike) => {
    const cs = normalizeComparisonSlug(slug, other.slug);
    return getComparisonSeedBySlug("product_comparison", cs)
      ? { compareSlug: cs, peerTitle: other.title ?? other.slug }
      : null;
  };

  for (let j = index + 1; j < topProducts.length; j++) {
    const hit = tryPair(topProducts[j]!);
    if (hit) return hit;
  }
  for (let j = 0; j < index; j++) {
    const hit = tryPair(topProducts[j]!);
    if (hit) return hit;
  }
  for (const other of expanded) {
    if (other.slug === slug) continue;
    const hit = tryPair(other);
    if (hit) return hit;
  }
  return null;
}

function contextCalloutCopy(tone: RecommendationContextTone | undefined): string | null {
  if (!tone || tone === "direct") return null;
  if (tone === "surface_wording_match") {
    return "Recommendations are shown using the closest product-library match for this surface and problem wording.";
  }
  if (tone === "method_representative") {
    return "Recommendations are shown for the closest representative surface for this method and problem.";
  }
  if (tone === "anti_pattern_replacement") {
    return "These recommendations focus on what to use instead for this problem.";
  }
  if (tone === "comparison_fallback") {
    return "These recommendations show stronger product fits for the shared scenario behind this comparison.";
  }
  return null;
}

export default function RecommendedProductsForTopic({
  problem,
  surface,
  intent,
  sectionTitle,
  contextTone,
  showScores = true,
  showReasons = true,
  showComparisons = true,
}: Props) {
  const effectiveIntent = intent ?? inferRecommendationIntent(problem);
  const products = getRecommendedProducts({
    problem,
    surface,
    limit: 3,
    intent: effectiveIntent,
  });

  const expandedForCompare = getRecommendedProducts({
    problem,
    surface,
    limit: 15,
    intent: effectiveIntent,
  });

  if (!products.length) return null;

  const contextBody = contextCalloutCopy(contextTone);

  return (
    <section className="rounded-2xl border border-[#C9B27C]/35 bg-[#FCFAF5] p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-neutral-900">
          {sectionTitle ?? "Recommended products for this problem"}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Ranked for <span className="font-medium">{problem}</span> on{" "}
          <span className="font-medium">{surface}</span>.
        </p>
        {contextBody ? (
          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-600">
            <span className="font-medium">Context:</span> {contextBody}
          </div>
        ) : null}
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          Confidence labels mean: <span className="font-medium text-neutral-700">High</span> — strong problem +
          surface + chemistry alignment without a hard caveat; <span className="font-medium text-neutral-700">Medium</span>{" "}
          — useful but verify labels; <span className="font-medium text-neutral-700">Situational</span> — caveats or
          partial listing—read the note on each card.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {products.map((product, index) => {
          const reasons = buildRecommendationReasons({
            slug: product.slug,
            problem,
            surface,
            intent: effectiveIntent,
          });
          const caveat = buildRecommendationCaveat({
            slug: product.slug,
            problem,
            surface,
            intent: effectiveIntent,
          });
          const { summary, cautionsFromReasons } = explainLines(reasons);
          const displayReasons =
            summary.length > 0 ? summary : reasons.filter((r) => !r.startsWith("Caution:")).slice(0, 2);
          const conf = recommendationConfidence({
            slug: product.slug,
            problem,
            surface,
            intent: effectiveIntent,
          });
          const scoreVal = getScore(product);
          const losesLine = whenThisLosesOnPlaybook(product.slug, problem, surface, effectiveIntent);

          const compare =
            showComparisons ? findComparisonLink(product.slug, index, products, expandedForCompare) : null;

          return (
            <div
              key={product.slug}
              className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/products/${product.slug}`}
                  className="min-w-0 font-semibold text-neutral-900 hover:underline"
                >
                  {product.title ?? product.slug}
                </Link>
                {showScores ? (
                  <span className="shrink-0 text-sm font-medium text-neutral-800">
                    Score: {typeof scoreVal === "number" ? Math.round(scoreVal) : "—"}
                  </span>
                ) : null}
              </div>

              {product.brand ? <div className="text-sm text-neutral-500">{product.brand}</div> : null}

              <div className="flex flex-wrap items-center gap-2">
                <RecommendationConfidenceBadge level={conf} />
                <span className="text-xs text-gray-500">
                  Confidence: {recommendationConfidenceLabel(conf)}
                </span>
              </div>
              <p className="text-[10px] leading-snug text-neutral-500">
                {recommendationConfidenceExplanation(conf)}
              </p>

              {showReasons ? (
                <div className="text-sm text-gray-600">
                  {displayReasons.length ? (
                    displayReasons.map((r, i) => (
                      <div key={i}>• {r}</div>
                    ))
                  ) : (
                    <div>• Fits this scenario in the ranked library set.</div>
                  )}
                </div>
              ) : null}

              {cautionsFromReasons.map((r, i) => (
                <p key={`cr-${i}`} className="text-sm text-amber-900/90">
                  {r}
                </p>
              ))}

              {caveat ? <p className="text-sm font-medium text-amber-900/90">Caution: {caveat}</p> : null}

              {losesLine ? <p className="text-xs text-red-600">{losesLine}</p> : null}

              {compare ? (
                <Link
                  href={`/compare/products/${compare.compareSlug}`}
                  className="inline-block text-sm font-medium text-[#0F172A] underline decoration-[#C9B27C]/60 underline-offset-2 hover:text-neutral-700"
                >
                  Compare with {compare.peerTitle} →
                </Link>
              ) : null}

              <Link
                href={`/products/${product.slug}`}
                className="inline-block text-sm font-medium text-neutral-900 hover:underline"
              >
                View product →
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
