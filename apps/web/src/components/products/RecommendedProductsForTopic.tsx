import Link from "next/link";

import { ProductAffiliateDisclosure } from "@/components/products/ProductAffiliateDisclosure";
import { ProductPurchaseActions } from "@/components/products/ProductPurchaseActions";
import { RECOMMENDATION_EMPTY_STATE_LINE } from "@/components/products/recommendationEmptyStateCopy";
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
import { getRecommendedProductsForDisplay } from "@/lib/products/productRecommendationDensity";
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
import { getPublishedProductBySlug } from "@/lib/products/productPublishing";
import type { ProductCleaningIntent } from "@/lib/products/productTypes";
import { ProductCard } from "@/components/products/ProductCard";

const PRO_HEAVY_DUTY_COMPLEMENT_SLUGS = new Set([
  "simple-green-pro-hd",
  "purple-power-industrial-strength-cleaner-degreaser",
  "oil-eater-cleaner-degreaser",
]);

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
  /** Authority problem slug for cross-surface density when primary surface is sparse. */
  densityAuthorityProblemSlug?: string;
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

function cleaningPowerScore(slug: string): number | null {
  const snap = getPublishedProductBySlug(slug);
  if (!snap) return null;
  return snap.rating.cleaningPower.score;
}

function getRecommendationLabels(products: PublishedProductLike[]) {
  if (!products || products.length === 0) return {};

  const bestOverall = products[0]?.slug;
  const bestForHeavy = products.find((p) => {
    if (PRO_HEAVY_DUTY_COMPLEMENT_SLUGS.has(p.slug)) return true;
    const s = cleaningPowerScore(p.slug);
    return s !== null && s >= 8;
  })?.slug;
  const bestForMaintenance = products.find((p) => {
    if (p.intent === "maintain") return true;
    const s = cleaningPowerScore(p.slug);
    return s !== null && s <= 5;
  })?.slug;

  const proOption = products.find((p) => PRO_HEAVY_DUTY_COMPLEMENT_SLUGS.has(p.slug));

  return {
    bestOverall,
    bestForHeavy,
    bestForMaintenance,
    professional: proOption?.slug,
  };
}

function recommendationShortcutLabel(
  slug: string,
  labels: ReturnType<typeof getRecommendationLabels>,
): string | undefined {
  if (slug === labels.bestOverall) return "Best overall";
  if (slug === labels.bestForHeavy) return "Best for heavy buildup";
  if (slug === labels.bestForMaintenance) return "Best for maintenance";
  if (slug === labels.professional) return "Professional-grade option";
  return undefined;
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

type RecommendationProductColumnProps = {
  product: PublishedProductLike;
  index: number;
  prioritizedProducts: PublishedProductLike[];
  expandedForCompare: PublishedProductLike[];
  problem: string;
  surface: string;
  effectiveIntent: ProductCleaningIntent;
  showScores: boolean;
  showReasons: boolean;
  showComparisons: boolean;
  cardLabel?: string;
  highlight?: boolean;
};

function RecommendationProductColumn({
  product,
  index,
  prioritizedProducts,
  expandedForCompare,
  problem,
  surface,
  effectiveIntent,
  showScores,
  showReasons,
  showComparisons,
  cardLabel,
  highlight,
}: RecommendationProductColumnProps) {
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
    showComparisons ?
      findComparisonLink(product.slug, index, prioritizedProducts, expandedForCompare)
    : null;

  const published = getPublishedProductBySlug(product.slug);

  return (
    <div className="space-y-3">
      {published ? (
        <ProductCard
          product={published}
          label={cardLabel}
          highlight={highlight}
          fitLabel={recommendationConfidenceLabel(conf)}
        />
      ) : (
        <div className="space-y-2 rounded-2xl border border-[#C9B27C] bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-neutral-800">{product.title ?? product.slug}</p>
          <ProductPurchaseActions
            product={{ ...product, name: product.title }}
            viewHref={`/products/${product.slug}`}
            forcePrimary
            highlight={highlight}
          />
        </div>
      )}

      {published ? (
        <div className="space-y-2 rounded-lg border border-neutral-200 bg-white/80 p-3 shadow-sm">
          {showScores ? (
            <div className="text-sm font-medium text-neutral-800">
              Score: {typeof scoreVal === "number" ? Math.round(scoreVal) : "—"}
            </div>
          ) : null}

          {PRO_HEAVY_DUTY_COMPLEMENT_SLUGS.has(product.slug) ? (
            <p className="text-xs text-neutral-600">Heavy-duty / pro-style option for tougher jobs.</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <RecommendationConfidenceBadge level={conf} />
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
                <div>• Fits this scenario among the picks shown for this page.</div>
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
        </div>
      ) : null}
    </div>
  );
}

export default function RecommendedProductsForTopic({
  problem,
  surface,
  intent,
  sectionTitle,
  densityAuthorityProblemSlug,
  contextTone,
  showScores = true,
  showReasons = true,
  showComparisons = true,
}: Props) {
  const effectiveIntent = intent ?? inferRecommendationIntent(problem);
  const products = getRecommendedProductsForDisplay({
    problem,
    surface,
    intent: effectiveIntent,
    densityAuthorityProblemSlug,
  });

  const expandedForCompare = getRecommendedProducts({
    problem,
    surface,
    limit: 15,
    intent: effectiveIntent,
  });

  const labels = getRecommendationLabels(products);

  const priorityOrderRaw = [
    labels.bestOverall,
    labels.bestForHeavy,
    labels.bestForMaintenance,
    labels.professional,
  ].filter((slug): slug is string => Boolean(slug));
  const priorityOrder = [...new Set(priorityOrderRaw)];

  const prioritizedProducts = [
    ...priorityOrder
      .map((slug) => products.find((p) => p.slug === slug))
      .filter((p): p is PublishedProductLike => p != null),
    ...products.filter((p) => !priorityOrder.includes(p.slug)),
  ];

  const bestOverallSlug = labels.bestOverall;
  const bestOverallProduct =
    bestOverallSlug ? prioritizedProducts.find((p) => p.slug === bestOverallSlug) : undefined;
  const secondaryProducts = bestOverallProduct
    ? prioritizedProducts.filter((p) => p.slug !== bestOverallProduct.slug)
    : prioritizedProducts;
  const heroIndex =
    bestOverallProduct ? prioritizedProducts.findIndex((p) => p.slug === bestOverallProduct.slug) : 0;

  const contextBody = contextCalloutCopy(contextTone);

  const columnPropsBase = {
    prioritizedProducts,
    expandedForCompare,
    problem,
    surface,
    effectiveIntent,
    showScores,
    showReasons,
    showComparisons,
  };

  if (!products.length) {
    return (
      <section className="rounded-2xl border border-[#C9B27C]/35 bg-[#FCFAF5] p-6">
        <h2 className="text-xl font-semibold text-neutral-900">
          {sectionTitle ?? "Recommended products for this problem"}
        </h2>
        <p className="mt-3 text-sm text-zinc-600">
          {RECOMMENDATION_EMPTY_STATE_LINE}
        </p>
      </section>
    );
  }

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
      </div>

      <div className="mb-4 space-y-2">
        <p className="text-sm text-neutral-600">
          These products are selected based on what actually works for the problem, surface, and cleaning goal.
        </p>
        <p className="text-xs text-neutral-500">
          Start with <span className="font-medium text-neutral-700">Best overall</span>, then use the other picks
          for heavier buildup, maintenance, or a stronger professional option.
        </p>
      </div>

      {bestOverallProduct ? (
        <div className="mb-10">
          <div className="mb-2 text-sm font-semibold text-emerald-700">
            ⭐ Best Overall — Recommended Starting Point
          </div>
          <RecommendationProductColumn
            {...columnPropsBase}
            product={bestOverallProduct}
            index={heroIndex >= 0 ? heroIndex : 0}
            highlight
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {secondaryProducts.map((product) => {
          const index = prioritizedProducts.findIndex((p) => p.slug === product.slug);
          return (
            <RecommendationProductColumn
              key={product.slug}
              {...columnPropsBase}
              product={product}
              index={index >= 0 ? index : 0}
              cardLabel={recommendationShortcutLabel(product.slug, labels)}
            />
          );
        })}
      </div>

      <ProductAffiliateDisclosure />
    </section>
  );
}
