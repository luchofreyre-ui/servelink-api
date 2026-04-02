import { buildRecommendationCaveat } from "@/lib/products/recommendationExplanation";
import { compatibilityForSurface, effectivenessForProblem } from "@/lib/products/productRating";
import { getPublishedProductBySlug } from "@/lib/products/productPublishing";
import type { ProductCleaningIntent } from "@/lib/products/productTypes";

export type RecommendationConfidenceLevel = "high" | "medium" | "situational";

export function recommendationConfidenceLabel(level: RecommendationConfidenceLevel): string {
  switch (level) {
    case "high":
      return "Strong fit";
    case "medium":
      return "Good fit";
    case "situational":
      return "Situational";
  }
}

/** Outcome-focused note for the badge — does not change how fit tier is computed. */
export function recommendationConfidenceExplanation(level: RecommendationConfidenceLevel): string {
  switch (level) {
    case "high":
      return "Listed for this problem and surface, with strong chemistry alignment and no major scenario caveat flagged.";
    case "medium":
      return "A solid option—double-check labels because fit is stronger in some dimensions than others.";
    case "situational":
      return "Use with extra label care here—tradeoffs or limits matter more for this pairing.";
  }
}

/**
 * Surface + chemistry fit vs scenario, plus whether the ranking engine applied a strong caveat.
 */
export function recommendationConfidence(args: {
  slug: string;
  problem: string;
  surface: string;
  intent: ProductCleaningIntent;
}): RecommendationConfidenceLevel {
  const snap = getPublishedProductBySlug(args.slug);
  if (!snap) return "situational";

  const chem = snap.chemicalClass ?? "neutral";
  const eff = effectivenessForProblem(chem, args.problem);
  const compat = compatibilityForSurface(chem, args.surface);
  const caveat = buildRecommendationCaveat({
    slug: args.slug,
    problem: args.problem,
    surface: args.surface,
    intent: args.intent,
  });

  const listsProblem = snap.compatibleProblems.includes(args.problem);
  const listsSurface = snap.compatibleSurfaces.includes(args.surface);

  if (caveat) return "situational";
  if (!listsProblem || !listsSurface) return "situational";
  if (eff >= 7 && compat >= 7) return "high";
  if (eff >= 5 && compat >= 5) return "medium";
  return "situational";
}
