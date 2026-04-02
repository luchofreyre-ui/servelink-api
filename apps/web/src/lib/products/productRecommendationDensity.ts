import { getSurfaceSlugsForProblem } from "@/authority/data/authorityGraphSelectors";
import {
  productProblemStringForAuthorityProblemSlug,
  productSurfaceStringForAuthoritySurfaceSlug,
} from "@/lib/authority/authorityProductTaxonomyBridge";
import { getRecommendedProducts, type PublishedProductLike } from "@/lib/products/getRecommendedProducts";
import type { ProductCleaningIntent } from "@/lib/products/productTypes";

const MIN_DENSITY = 2;
const MAX_DENSITY = 4;

/**
 * Returns up to four ranked products. If the primary surface yields fewer than two picks,
 * merges additional ranked results from other authority surfaces for the same problem slug
 * (same sort order per surface; no changes to the core ranker).
 */
export function getRecommendedProductsForDisplay(args: {
  problem: string;
  surface: string;
  intent: ProductCleaningIntent;
  densityAuthorityProblemSlug?: string;
}): PublishedProductLike[] {
  const { problem, surface, intent, densityAuthorityProblemSlug } = args;

  const primary = getRecommendedProducts({ problem, surface, limit: MAX_DENSITY, intent });
  if (primary.length >= MIN_DENSITY || !densityAuthorityProblemSlug) {
    return primary;
  }

  const mappedProblem = productProblemStringForAuthorityProblemSlug(densityAuthorityProblemSlug);
  if (mappedProblem !== problem) {
    return primary;
  }

  const seen = new Set(primary.map((p) => p.slug));
  const merged: PublishedProductLike[] = [...primary];

  for (const surfSlug of getSurfaceSlugsForProblem(densityAuthorityProblemSlug)) {
    const sStr = productSurfaceStringForAuthoritySurfaceSlug(surfSlug);
    if (!sStr || sStr === surface) continue;

    const extra = getRecommendedProducts({ problem, surface: sStr, limit: MAX_DENSITY, intent });
    for (const p of extra) {
      if (seen.has(p.slug)) continue;
      seen.add(p.slug);
      merged.push(p);
      if (merged.length >= MAX_DENSITY) return merged;
    }
  }

  return merged.slice(0, MAX_DENSITY);
}
