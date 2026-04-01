import { getSurfaceProblemEdges } from "@/authority/data/authorityGraphSelectors";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import {
  productProblemStringForAuthorityProblemSlug,
  productSurfaceStringForAuthoritySurfaceSlug,
} from "@/lib/authority/authorityProductTaxonomyBridge";
import { getRecommendedProducts, inferRecommendationIntent } from "@/lib/products/getRecommendedProducts";
import { getPublishedProductBySlug } from "@/lib/products/productPublishing";
import { recommendationConfidence, type RecommendationConfidenceLevel } from "@/lib/products/recommendationConfidence";
import type { ProductCleaningIntent } from "@/lib/products/productTypes";

export type ProductAuthorityContext = {
  rank: number;
  problem: string;
  surface: string;
  href: string;
  label: string;
  confidence: RecommendationConfidenceLevel;
};

/**
 * Authority playbooks where this SKU ranks in the top N and confidence is High or Medium only.
 */
export function getTopAuthorityContextsForProduct(
  slug: string,
  options: { maxRank?: number; limit?: number } = {},
): ProductAuthorityContext[] {
  const maxRank = options.maxRank ?? 2;
  const limit = options.limit ?? 5;
  const product = getPublishedProductBySlug(slug);
  if (!product) return [];

  const out: ProductAuthorityContext[] = [];

  for (const edge of getSurfaceProblemEdges()) {
    const pStr = productProblemStringForAuthorityProblemSlug(edge.problemSlug);
    const sStr = productSurfaceStringForAuthoritySurfaceSlug(edge.surfaceSlug);
    if (!pStr || !sStr) continue;

    const listsProblem = product.compatibleProblems?.includes(pStr);
    const listsSurface = product.compatibleSurfaces?.includes(sStr);
    if (!listsProblem || !listsSurface) continue;

    const intent = inferRecommendationIntent(pStr) as ProductCleaningIntent;
    const ranked = getRecommendedProducts({ problem: pStr, surface: sStr, limit: 8, intent });
    const idx = ranked.findIndex((p) => p.slug === slug);
    if (idx === -1) continue;
    const rank = idx + 1;
    if (rank > maxRank) continue;

    const confidence = recommendationConfidence({
      slug,
      problem: pStr,
      surface: sStr,
      intent,
    });
    if (confidence === "situational") continue;

    const prob = getProblemPageBySlug(edge.problemSlug);
    const surf = getSurfacePageBySlug(edge.surfaceSlug);
    const href = `/surfaces/${edge.surfaceSlug}/${edge.problemSlug}`;
    const label = prob && surf ? `${prob.title.toLowerCase()} on ${surf.title.toLowerCase()}` : `${pStr} on ${sStr}`;

    out.push({ rank, problem: pStr, surface: sStr, href, label, confidence });
  }

  out.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (a.confidence === "high" && b.confidence !== "high") return -1;
    if (a.confidence !== "high" && b.confidence === "high") return 1;
    return a.label.localeCompare(b.label);
  });

  const dedup = new Map<string, ProductAuthorityContext>();
  for (const row of out) {
    if (!dedup.has(row.href)) dedup.set(row.href, row);
  }

  return [...dedup.values()].slice(0, limit);
}
