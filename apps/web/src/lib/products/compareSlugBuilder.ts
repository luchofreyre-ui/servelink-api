import { normalizeComparisonSlug } from "@/authority/data/authorityComparisonSelectors";

/**
 * Canonical product comparison path segment for the top two picks (best vs heavy).
 * Uses the same sorted `slug-a-vs-slug-b` convention as `getComparisonSeedBySlug`.
 */
export function buildCompareSlug(products: { slug: string }[]): string | null {
  if (products.length < 2) return null;
  return normalizeComparisonSlug(products[0].slug, products[1].slug);
}

export function buildCompareProductsHref(products: { slug: string }[]): string | null {
  const slug = buildCompareSlug(products);
  if (!slug) return null;
  return `/compare/products/${slug}`;
}
