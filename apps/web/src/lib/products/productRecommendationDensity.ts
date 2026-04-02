import { getSurfaceSlugsForProblem } from "@/authority/data/authorityGraphSelectors";
import {
  productProblemStringForAuthorityProblemSlug,
  productSurfaceStringForAuthoritySurfaceSlug,
} from "@/lib/authority/authorityProductTaxonomyBridge";
import { getPublishedProductBySlug } from "@/lib/products/productPublishing";
import { getRecommendedProducts, type PublishedProductLike } from "@/lib/products/getRecommendedProducts";
import type { ProductCleaningIntent } from "@/lib/products/productTypes";

const MIN_DENSITY = 2;
const MAX_DENSITY = 4;
const FETCH_BEFORE_DEDUPE = 14;

function brandCategoryFamilyKey(p: PublishedProductLike): string {
  const snap = getPublishedProductBySlug(p.slug);
  if (!snap) return `slug:${p.slug}`;
  const cat = snap.category.split(/[,/&]/)[0]?.trim().toLowerCase() ?? "";
  const brand = snap.brand.toLowerCase().replace(/\s+/g, " ").trim();
  return `${brand}::${cat}`;
}

/**
 * Avoid stacking multiple near-duplicate SKUs (same brand + category family) in the top list.
 * `protect` slugs are always kept first (e.g. comparison page dossier pair).
 */
export function dedupeBrandCategoryStack(
  products: PublishedProductLike[],
  max: number,
  protect?: ReadonlySet<string>,
): PublishedProductLike[] {
  const out: PublishedProductLike[] = [];
  const seenSlug = new Set<string>();
  const seenFamily = new Set<string>();

  if (protect?.size) {
    for (const p of products) {
      if (!protect.has(p.slug) || seenSlug.has(p.slug)) continue;
      out.push(p);
      seenSlug.add(p.slug);
      seenFamily.add(brandCategoryFamilyKey(p));
      if (out.length >= max) return out;
    }
  }

  for (const p of products) {
    if (out.length >= max) break;
    if (seenSlug.has(p.slug)) continue;
    const fam = brandCategoryFamilyKey(p);
    if (seenFamily.has(fam)) continue;
    seenSlug.add(p.slug);
    seenFamily.add(fam);
    out.push(p);
  }

  return out;
}

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
  pinnedSlugs?: readonly string[];
}): PublishedProductLike[] {
  const { problem, surface, intent, densityAuthorityProblemSlug, pinnedSlugs } = args;
  const protect = pinnedSlugs?.length ? new Set(pinnedSlugs) : undefined;

  const primaryRaw = getRecommendedProducts({
    problem,
    surface,
    limit: FETCH_BEFORE_DEDUPE,
    intent,
    pinnedSlugs,
  });
  const primary = dedupeBrandCategoryStack(primaryRaw, MAX_DENSITY, protect);

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

    const extra = getRecommendedProducts({
      problem,
      surface: sStr,
      limit: FETCH_BEFORE_DEDUPE,
      intent,
      pinnedSlugs,
    });
    for (const p of extra) {
      if (seen.has(p.slug)) continue;
      seen.add(p.slug);
      merged.push(p);
      if (merged.length >= MAX_DENSITY * 3) break;
    }
  }

  return dedupeBrandCategoryStack(merged, MAX_DENSITY, protect);
}
