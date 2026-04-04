import { getComparisonSeedBySlug } from "@/authority/data/authorityComparisonSelectors";
import { buildCompareSlug } from "@/lib/products/compareSlugBuilder";

/** True when `/compare/products/[slug]` would resolve for the first two scenario products. */
export function hasComparePage(products: { slug: string }[]): boolean {
  const slug = buildCompareSlug(products);
  if (!slug) return false;

  const seed = getComparisonSeedBySlug("product_comparison", slug);
  return Boolean(seed);
}
