import {
  getOrderedScenarioProducts,
  type ProductRef,
} from "@/lib/products/bestProductForContext";
import { sortProductsByClickRank } from "@/lib/products/productClickData";

export type SearchRankingContext = {
  problemSlug: string;
  surface?: string | null;
};

/**
 * Applies editorial best-product ordering, then re-orders by in-session clickthrough
 * for the same problem hub (data-driven tie-break).
 */
export function optimizeSearchRanking(
  products: readonly ProductRef[],
  context: SearchRankingContext,
): ProductRef[] {
  const editorial = getOrderedScenarioProducts([...products], context);
  return sortProductsByClickRank(editorial, context.problemSlug);
}
