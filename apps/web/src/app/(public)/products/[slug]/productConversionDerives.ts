import { getProductAuthorityContext } from "@/lib/products/productAuthorityContext";

export function deriveProblemContext(productSlug: string): string | null {
  return getProductAuthorityContext(productSlug).problemContext;
}

export function deriveComparisonSlug(productSlug: string): string | null {
  return getProductAuthorityContext(productSlug).comparisonSlug;
}

export function deriveProblemUseChips(productSlug: string) {
  return getProductAuthorityContext(productSlug).problemUseChips;
}
