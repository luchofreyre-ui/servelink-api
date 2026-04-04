import { normalizeComparisonSlug } from "@/authority/data/authorityComparisonSelectors";
import { hasComparePage } from "@/lib/products/compareAvailability";
import { PROBLEM_COMPARE_PREFERENCES } from "@/lib/products/problemComparePreference";

export type ProductRef = {
  slug: string;
  name?: string;
};

export type CompareContext = {
  problemSlug?: string | null;
  surface?: string | null;
};

/**
 * Deterministic fallback: try (0,1), then (0,2), then (1,2) among up to three scenario SKUs.
 * When `context.problemSlug` matches an editorial preference, prefers that pair if it is
 * among the candidates and `hasComparePage` passes.
 */
export function getBestComparePair(products: ProductRef[], context?: CompareContext): ProductRef[] {
  const cleaned = products.filter((p): p is ProductRef => Boolean(p?.slug)).slice(0, 3);
  if (cleaned.length < 2) return [];

  const candidates: ProductRef[][] = [
    [cleaned[0]!, cleaned[1]!],
    ...(cleaned.length >= 3 ? [[cleaned[0]!, cleaned[2]!] as ProductRef[]] : []),
    ...(cleaned.length >= 3 ? [[cleaned[1]!, cleaned[2]!] as ProductRef[]] : []),
  ];

  if (context?.problemSlug) {
    const preference = PROBLEM_COMPARE_PREFERENCES.find(
      (item) =>
        item.problemSlug === context.problemSlug &&
        (item.surface == null || item.surface === context.surface),
    );

    if (preference) {
      for (const preferredPair of preference.preferredPairs) {
        const preferredSlug = normalizeComparisonSlug(preferredPair[0], preferredPair[1]);
        const match = candidates.find(
          (pair) => normalizeComparisonSlug(pair[0]!.slug, pair[1]!.slug) === preferredSlug,
        );
        if (match && hasComparePage(match)) {
          return match;
        }
      }
    }
  }

  for (const pair of candidates) {
    if (pair.length === 2 && hasComparePage(pair)) return pair;
  }

  return [];
}
