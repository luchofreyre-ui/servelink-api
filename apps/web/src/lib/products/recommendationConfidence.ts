import { buildRecommendationCaveat } from "@/lib/products/recommendationExplanation";
import { compatibilityForSurface, effectivenessForProblem } from "@/lib/products/productRating";
import { getPublishedProductBySlug } from "@/lib/products/productPublishing";
import type { ProductCleaningIntent } from "@/lib/products/productTypes";

export type RecommendationConfidenceLevel = "high" | "medium" | "situational";

export function recommendationConfidenceLabel(level: RecommendationConfidenceLevel): string {
  switch (level) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "situational":
      return "Situational";
  }
}

/** Plain-language reason for the badge — does not change how confidence is computed. */
export function recommendationConfidenceExplanation(level: RecommendationConfidenceLevel): string {
  switch (level) {
    case "high":
      return "High confidence means the product lists this exact problem and surface, chemistry fit scores strongly, and the engine did not flag a hard caveat for this scenario.";
    case "medium":
      return "Medium confidence means the match is real but partial—one of chemistry fit, surface fit, or scenario notes is closer to the middle band, so verify labels before heavy use.";
    case "situational":
      return "Situational means tradeoffs or risks dominate: a strong caveat fired, the product does not list this exact pairing, or fit scores sit below the high-confidence band—still usable with label checks.";
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
