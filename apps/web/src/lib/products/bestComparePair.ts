import { hasComparePage } from "@/lib/products/compareAvailability";

export type ProductRef = {
  slug: string;
  name?: string;
};

/**
 * Deterministic fallback: try (0,1), then (0,2), then (1,2) among up to three scenario SKUs.
 * Returns the first pair that resolves to a registered product comparison page.
 */
export function getBestComparePair(products: ProductRef[]): ProductRef[] {
  const cleaned = products.filter((p): p is ProductRef => Boolean(p?.slug)).slice(0, 3);
  if (cleaned.length < 2) return [];

  const candidatePairs: ProductRef[][] = [
    [cleaned[0]!, cleaned[1]!],
    ...(cleaned.length >= 3 ? [[cleaned[0]!, cleaned[2]!] as ProductRef[]] : []),
    ...(cleaned.length >= 3 ? [[cleaned[1]!, cleaned[2]!] as ProductRef[]] : []),
  ];

  for (const pair of candidatePairs) {
    if (pair.length === 2 && hasComparePage(pair)) return pair;
  }

  return [];
}
