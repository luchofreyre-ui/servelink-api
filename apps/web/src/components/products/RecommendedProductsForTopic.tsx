"use client";

import clsx from "clsx";
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
  assignRecommendationRoleLabels,
  PRO_HEAVY_DUTY_COMPLEMENT_SLUGS,
} from "@/lib/products/recommendationRoles";
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
import type { ProductRecommendationTrackingContext } from "@/lib/products/productRecommendationTrackingTypes";
import { buildProductRecommendationClickHandler } from "@/lib/products/productRecommendationTracking";
import { getProductPurchaseUrl } from "@/lib/products/getProductPurchaseUrl";
import { ProductCard } from "@/components/products/ProductCard";

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
  /** On `/compare/products/A-vs-B`, both dossier SKUs must appear in this list. */
  pinnedProductSlugs?: readonly string[];
  trackingContext?: ProductRecommendationTrackingContext;
  /**
   * Problem hub: compressed supporting strip (smaller cards, guardrail copy, lighter chrome).
   * Other surfaces keep the standard recommendation layout.
   */
  presentation?: "default" | "problemHubSupporting";
};

function getScore(product: {
  finalScore?: number;
  score?: number;
  rating?: { finalScore?: number };
}) {
  return product.finalScore ?? product.score ?? product.rating?.finalScore ?? null;
}

function recommendationShortcutLabel(
  slug: string,
  labels: ReturnType<typeof assignRecommendationRoleLabels>,
): string | undefined {
  if (slug === labels.bestOverall) return "Start here";
  if (slug === labels.bestForHeavy) return "For heavier buildup";
  if (slug === labels.bestForMaintenance) return "For maintenance";
  if (slug === labels.professional) return "Stronger option";
  return undefined;
}

function recommendationRoleBlurb(label?: string): string {
  switch (label) {
    case "Start here":
      return "Balanced option for most typical buildup in this scenario.";
    case "For heavier buildup":
      return "Stronger option when buildup has been sitting longer.";
    case "For maintenance":
      return "Better for ongoing maintenance.";
    case "Stronger option":
      return "Stronger chemistry when the label allows—ventilate and rinse well.";
    default:
      return "Fits this scenario when you want extra chemistry help.";
  }
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
  recommendationPosition: number;
  trackingContext?: ProductRecommendationTrackingContext;
  pinnedSlugsForTracking?: readonly string[];
  cardLayout?: "default" | "supporting";
  roleExplanation?: string;
  minimalDetails?: boolean;
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
  recommendationPosition,
  trackingContext,
  pinnedSlugsForTracking,
  cardLayout = "default",
  roleExplanation,
  minimalDetails = false,
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
  const viewHref = `/products/${product.slug}`;
  const purchaseUrl = getProductPurchaseUrl(published ?? product);

  const track = (href: string) =>
    buildProductRecommendationClickHandler({
      productSlug: product.slug,
      roleLabel: cardLabel ?? null,
      position: recommendationPosition,
      href,
      trackingContext,
      pinnedSlugs: pinnedSlugsForTracking,
    })();

  return (
    <div className="space-y-3">
      {published ? (
        <ProductCard
          product={published}
          label={cardLabel}
          highlight={highlight && cardLayout === "default"}
          fitLabel={cardLayout === "default" ? recommendationConfidenceLabel(conf) : undefined}
          layout={cardLayout}
          roleExplanation={roleExplanation}
          viewDetailsLabel="View details"
          onTitleLinkClick={() => track(viewHref)}
          onPrimaryPurchaseClick={purchaseUrl ? () => track(purchaseUrl) : undefined}
          onSecondaryPurchaseClick={() => track(viewHref)}
        />
      ) : (
        <div
          className={
            cardLayout === "supporting"
              ? "space-y-2 rounded-xl border border-neutral-200/90 bg-white p-3 shadow-none"
              : "space-y-2 rounded-2xl border border-[#C9B27C] bg-white p-4 shadow-sm"
          }
        >
          <p className="text-sm font-medium text-neutral-800">{product.title ?? product.slug}</p>
          {roleExplanation ? <p className="text-xs text-neutral-600">{roleExplanation}</p> : null}
          <ProductPurchaseActions
            product={{ ...product, name: product.title }}
            viewHref={viewHref}
            forcePrimary
            highlight={highlight && cardLayout === "default"}
            viewDetailsLabel="View details"
            onPrimaryNavigationClick={purchaseUrl ? () => track(purchaseUrl) : () => track(viewHref)}
            onSecondaryNavigationClick={() => track(viewHref)}
          />
        </div>
      )}

      {published && !minimalDetails ? (
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
              onClick={() => track(`/compare/products/${compare.compareSlug}`)}
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
  pinnedProductSlugs,
  trackingContext,
  presentation = "default",
}: Props) {
  const hub = presentation === "problemHubSupporting";
  const effectiveShowScores = hub ? false : showScores;
  const effectiveShowReasons = hub ? false : showReasons;
  const effectiveShowComparisons = hub ? false : showComparisons;
  const effectiveIntent = intent ?? inferRecommendationIntent(problem);
  const pinnedSlugsForTracking = [
    ...new Set([
      ...(trackingContext?.pinnedProductSlugs ?? []),
      ...(pinnedProductSlugs ?? []),
    ]),
  ];
  const products = getRecommendedProductsForDisplay({
    problem,
    surface,
    intent: effectiveIntent,
    densityAuthorityProblemSlug,
    pinnedSlugs: pinnedProductSlugs,
  });

  const expandedForCompare = getRecommendedProducts({
    problem,
    surface,
    limit: 15,
    intent: effectiveIntent,
    pinnedSlugs: pinnedProductSlugs,
  });

  const labels = assignRecommendationRoleLabels(products, surface);

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

  const contextBody = contextCalloutCopy(contextTone);

  const columnPropsBase = {
    prioritizedProducts,
    expandedForCompare,
    problem,
    surface,
    effectiveIntent,
    showScores: effectiveShowScores,
    showReasons: effectiveShowReasons,
    showComparisons: effectiveShowComparisons,
  };

  const defaultTitle = hub ? "If you need a product" : "Recommended products for this problem";

  if (!products.length) {
    return (
      <section
        id={hub ? "problem-products" : undefined}
        className={clsx(
          hub ? "mt-14 scroll-mt-24 border-t border-[#C9B27C]/20 pt-12" : "rounded-2xl border border-[#C9B27C]/35 bg-[#FCFAF5] p-6",
        )}
      >
        <h2 className="text-xl font-semibold text-neutral-900">{sectionTitle ?? defaultTitle}</h2>
        <p className="mt-3 text-sm text-zinc-600">{RECOMMENDATION_EMPTY_STATE_LINE}</p>
      </section>
    );
  }

  return (
    <section
      id={hub ? "problem-products" : undefined}
      className={clsx(
        hub
          ? "mt-14 scroll-mt-24 border-t border-[#C9B27C]/20 pt-12"
          : "rounded-2xl border border-[#C9B27C]/35 bg-[#FCFAF5] p-6",
      )}
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-neutral-900">{sectionTitle ?? defaultTitle}</h2>
        {!hub ? (
          <p className="mt-1 text-sm text-neutral-600">
            Ranked for <span className="font-medium">{problem}</span> on{" "}
            <span className="font-medium">{surface}</span>.
          </p>
        ) : null}
        {!hub && contextBody ? (
          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-600">
            <span className="font-medium">Context:</span> {contextBody}
          </div>
        ) : null}
      </div>

      {hub ? (
        <p className="mb-5 max-w-2xl text-sm leading-relaxed text-neutral-600">
          Most cases can be solved with the right method alone. Use a product when buildup needs extra help.
        </p>
      ) : (
        <div className="mb-5 space-y-2">
          <p className="text-sm text-neutral-600">
            These products are selected based on what actually works for the problem, surface, and cleaning goal.
          </p>
          <p className="text-xs text-neutral-500">
            Start with <span className="font-medium text-neutral-700">Start here</span>, then use the other picks for
            heavier buildup, maintenance, or a stronger option.
          </p>
        </div>
      )}

      <div
        className={clsx(
          "grid",
          hub ? "grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {prioritizedProducts.map((product) => {
          const index = prioritizedProducts.findIndex((p) => p.slug === product.slug);
          const cardLabel = recommendationShortcutLabel(product.slug, labels);
          return (
            <RecommendationProductColumn
              key={product.slug}
              {...columnPropsBase}
              product={product}
              index={index >= 0 ? index : 0}
              cardLabel={cardLabel}
              highlight={false}
              recommendationPosition={index >= 0 ? index + 1 : 1}
              trackingContext={trackingContext}
              pinnedSlugsForTracking={pinnedSlugsForTracking}
              cardLayout={hub ? "supporting" : "default"}
              roleExplanation={hub ? recommendationRoleBlurb(cardLabel) : undefined}
              minimalDetails={hub}
            />
          );
        })}
      </div>

      <ProductAffiliateDisclosure />
    </section>
  );
}
