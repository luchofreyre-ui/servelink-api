import {
  getOrderedScenarioProducts,
  type ProductRef,
} from "@/lib/products/bestProductForContext";
import { sortProductsByClickRank } from "@/lib/products/productClickData";
import { calculateSearchRank, type UserBehaviorData } from "@/lib/search/searchOptimization";

export type SearchRankingContext = {
  problemSlug: string;
  surface?: string | null;
};

/**
 * Applies editorial best-product ordering, then clickthrough order, then optional
 * multi-dimensional behavior scores (session dwell + repeat product interest).
 */
export function optimizeSearchRanking(
  products: readonly ProductRef[],
  context: SearchRankingContext,
  userBehavior?: UserBehaviorData | null,
): ProductRef[] {
  const editorial = getOrderedScenarioProducts([...products], context);
  const clickSorted = sortProductsByClickRank(editorial, context.problemSlug);
  if (!userBehavior) return clickSorted;
  return [...clickSorted].sort((a, b) => {
    const da = calculateSearchRank(a.slug, userBehavior);
    const db = calculateSearchRank(b.slug, userBehavior);
    return db - da;
  });
}
