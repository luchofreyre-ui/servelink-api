import { getSurfaceProblemEdges } from "@/authority/data/authorityGraphSelectors";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import {
  productProblemStringForAuthorityProblemSlug,
  productSurfaceStringForAuthoritySurfaceSlug,
} from "@/lib/authority/authorityProductTaxonomyBridge";
import {
  getRecommendedProducts,
  inferRecommendationIntent,
  recommendationAdjustment,
  type PublishedProductLike,
} from "@/lib/products/getRecommendedProducts";
import { getAllPublishedProducts, getPublishedProductBySlug } from "@/lib/products/productPublishing";
import type { ProductCleaningIntent } from "@/lib/products/productTypes";

export type ProductLosesScenario = {
  label: string;
  href: string;
  rank: number;
  leaderSlug: string;
  leaderName: string;
  reason: string;
};

const PENALTY_THRESHOLD = -12;
const RANK_WINDOW = 12;

/**
 * Playbook contexts where this SKU is not a top-2 pick or is heavily penalized by the engine.
 */
export function getWhenProductLosesScenarios(
  slug: string,
  options: { limit?: number } = {},
): ProductLosesScenario[] {
  const limit = options.limit ?? 5;
  const product = getPublishedProductBySlug(slug);
  if (!product) return [];

  const catalog = getAllPublishedProducts() as PublishedProductLike[];
  const out: ProductLosesScenario[] = [];

  for (const edge of getSurfaceProblemEdges()) {
    const pStr = productProblemStringForAuthorityProblemSlug(edge.problemSlug);
    const sStr = productSurfaceStringForAuthoritySurfaceSlug(edge.surfaceSlug);
    if (!pStr || !sStr) continue;

    const listsProblem = product.compatibleProblems?.includes(pStr);
    const listsSurface = product.compatibleSurfaces?.includes(sStr);
    if (!listsProblem || !listsSurface) continue;

    const intent = inferRecommendationIntent(pStr) as ProductCleaningIntent;
    const ranked = getRecommendedProducts({ problem: pStr, surface: sStr, limit: RANK_WINDOW, intent });
    const idx = ranked.findIndex((p) => p.slug === slug);
    if (idx === -1) continue;

    const rank = idx + 1;
    const selfSnap = ranked[idx]! as PublishedProductLike;
    const adj = recommendationAdjustment(selfSnap, pStr, sStr, intent, catalog);

    const leader = ranked[0]!;
    const weakRank = rank > 2;
    const heavyPenalty = rank <= 2 && adj <= PENALTY_THRESHOLD;
    if (!weakRank && !heavyPenalty) continue;

    const prob = getProblemPageBySlug(edge.problemSlug);
    const surf = getSurfacePageBySlug(edge.surfaceSlug);
    const href = `/surfaces/${edge.surfaceSlug}/${edge.problemSlug}`;
    const label = prob && surf ? `${prob.title} on ${surf.title}` : `${pStr} on ${sStr}`;

    const leaderName = leader.title ?? leader.slug;
    let reason: string;
    if (weakRank) {
      reason = `Ranks #${rank} here—${leaderName} leads the library for this pairing.`;
    } else {
      reason = `Engine applies a strong situational penalty on this pairing despite a top slot—${leaderName} is usually the safer default.`;
    }

    out.push({
      label,
      href,
      rank,
      leaderSlug: leader.slug,
      leaderName,
      reason,
    });
  }

  out.sort((a, b) => {
    if (a.rank !== b.rank) return b.rank - a.rank;
    return a.label.localeCompare(b.label);
  });

  const dedup = new Map<string, ProductLosesScenario>();
  for (const row of out) {
    if (!dedup.has(row.href)) dedup.set(row.href, row);
  }

  return [...dedup.values()].slice(0, limit);
}
