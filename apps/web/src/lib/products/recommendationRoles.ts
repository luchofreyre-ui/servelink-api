import { getPublishedProductBySlug } from "@/lib/products/productPublishing";
import type { PublishedProductLike } from "@/lib/products/getRecommendedProducts";

/** Pro / industrial complements surfaced as a distinct lane. */
export const PRO_HEAVY_DUTY_COMPLEMENT_SLUGS = new Set([
  "simple-green-pro-hd",
  "purple-power-industrial-strength-cleaner-degreaser",
  "oil-eater-cleaner-degreaser",
]);

function cleaningPower(slug: string): number {
  return getPublishedProductBySlug(slug)?.rating.cleaningPower.score ?? -1;
}

function isFinishSensitiveSurface(surface: string): boolean {
  const s = surface.toLowerCase();
  return (
    s.includes("granite") ||
    s.includes("marble") ||
    s.includes("quartz") ||
    s.includes("sealed stone") ||
    s.includes("stone") ||
    s.includes("painted") ||
    s.includes("finished wood") ||
    s.includes("sealed wood") ||
    s.includes("hardwood") ||
    s.includes("laminate") ||
    s === "mirrors" ||
    s.includes("shower glass") ||
    s.includes("glass")
  );
}

/**
 * Balanced pick: strong cleaning power + compatibility + usability, penalized when aggressive
 * chemistry meets finish-sensitive surfaces (so "best overall" ≠ blindly max cleaningPower).
 */
export function balancedScoreForRecommendation(slug: string, surface: string): number {
  const snap = getPublishedProductBySlug(slug);
  if (!snap) return -1e6;
  const cp = snap.rating.cleaningPower.score;
  const sc = snap.rating.surfaceCompatibility.score;
  const eu = snap.rating.easeOfUse.score;
  const chem = snap.chemicalClass.toLowerCase().trim();
  const sens = isFinishSensitiveSurface(surface);
  let penalty = 0;
  if (sens) {
    if (chem === "acid" || chem === "caustic" || chem === "bleach") penalty += 5;
    if (cp >= 9) penalty += (cp - 8) * 1.15;
  }
  return cp * 2.15 + sc * 1.35 + eu * 0.95 - penalty;
}

export type RecommendationRoleLabels = {
  bestOverall?: string;
  bestForHeavy?: string;
  bestForMaintenance?: string;
  professional?: string;
};

/**
 * Strict unique roles: each slug fills at most one of best / heavy / maintenance / pro.
 */
export function assignRecommendationRoleLabels(
  products: PublishedProductLike[],
  surface: string,
): RecommendationRoleLabels {
  if (!products.length) return {};

  const used = new Set<string>();

  let best = products[0]!.slug;
  let bestBal = balancedScoreForRecommendation(best, surface);
  for (const p of products) {
    const b = balancedScoreForRecommendation(p.slug, surface);
    if (b > bestBal) {
      best = p.slug;
      bestBal = b;
    }
  }
  used.add(best);

  let heavy: string | undefined;
  let heavyCp = -1;
  for (const p of products) {
    if (used.has(p.slug)) continue;
    const c = cleaningPower(p.slug);
    if (c > heavyCp) {
      heavyCp = c;
      heavy = p.slug;
    }
  }
  if (heavy && heavyCp >= 0) used.add(heavy);

  let maintenance: string | undefined;
  for (const p of products) {
    if (used.has(p.slug)) continue;
    if (p.intent === "maintain") {
      maintenance = p.slug;
      break;
    }
  }
  if (!maintenance) {
    let low = 11;
    for (const p of products) {
      if (used.has(p.slug)) continue;
      const c = cleaningPower(p.slug);
      if (c >= 0 && c < low) {
        low = c;
        maintenance = p.slug;
      }
    }
  }
  if (maintenance) used.add(maintenance);

  let professional: string | undefined;
  for (const p of products) {
    if (used.has(p.slug)) continue;
    if (PRO_HEAVY_DUTY_COMPLEMENT_SLUGS.has(p.slug)) {
      professional = p.slug;
      break;
    }
  }
  if (professional) used.add(professional);

  return {
    bestOverall: best,
    bestForHeavy: heavy,
    bestForMaintenance: maintenance,
    professional,
  };
}
