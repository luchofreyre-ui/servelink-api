import { getComparisonSeedsByType, normalizeComparisonSlug } from "./authorityComparisonSelectors";
import { productProblemStringForAuthorityProblemSlug } from "@/lib/authority/authorityProductTaxonomyBridge";
import { getPublishedProductBySlug } from "@/lib/products/productPublishing";

/** Product comparison pages where both SKUs list this authority problem (via taxonomy bridge). */
export function getProductComparisonSlugsForAuthorityProblem(
  authorityProblemSlug: string,
  limit = 3,
): string[] {
  const pStr = productProblemStringForAuthorityProblemSlug(authorityProblemSlug);
  if (!pStr) return [];

  const out: string[] = [];
  for (const seed of getComparisonSeedsByType("product_comparison")) {
    const left = getPublishedProductBySlug(seed.leftSlug);
    const right = getPublishedProductBySlug(seed.rightSlug);
    if (!left?.compatibleProblems.includes(pStr) || !right?.compatibleProblems.includes(pStr)) continue;
    out.push(normalizeComparisonSlug(seed.leftSlug, seed.rightSlug));
  }
  return out.slice(0, limit);
}
