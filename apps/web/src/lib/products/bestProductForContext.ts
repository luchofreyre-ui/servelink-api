import { getProductPurchaseUrl } from "@/lib/products/getProductPurchaseUrl";
import { PROBLEM_BEST_PRODUCT_PREFERENCES } from "@/lib/products/problemBestProductPreference";

export type ProductRef = { slug: string; name?: string };

export type BestProductContext = {
  problemSlug?: string | null;
  surface?: string | null;
};

export function getBestProductForContext(
  products: ProductRef[],
  context?: BestProductContext,
): ProductRef | null {
  const cleaned = products.filter((p): p is ProductRef => Boolean(p?.slug));
  if (!cleaned.length) return null;

  if (context?.problemSlug) {
    const matchingPreferences = PROBLEM_BEST_PRODUCT_PREFERENCES.filter(
      (p) => p.problemSlug === context.problemSlug,
    );

    const pref =
      matchingPreferences.find(
        (p) => p.surface && context?.surface && p.surface === context.surface,
      ) ?? matchingPreferences.find((p) => !p.surface);

    if (pref) {
      for (const slug of pref.preferredOrder) {
        const match = cleaned.find((p) => p.slug === slug);
        if (match) return match;
      }
    }
  }

  const purchasable = cleaned.find((p) => getProductPurchaseUrl(p.slug) !== "#");
  return purchasable ?? cleaned[0] ?? null;
}

/**
 * Puts {@link getBestProductForContext} first so top-fold “best overall” matches graph preference.
 */
export function getOrderedScenarioProducts(
  products: ProductRef[],
  context?: BestProductContext,
): ProductRef[] {
  const cleaned = products.filter((p): p is ProductRef => Boolean(p?.slug)).slice(0, 3);
  if (cleaned.length === 0) return [];

  const best = getBestProductForContext(cleaned, context);
  if (!best) return cleaned;

  const rest = cleaned.filter((p) => p.slug !== best.slug);
  return [best, ...rest];
}
