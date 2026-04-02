import type { ProductCleaningIntent } from "@/lib/products/productTypes";
import {
  inferRecommendationIntent,
  inferRecommendationIntentForMethodPlaybook,
} from "@/lib/products/getRecommendedProducts";
import {
  productProblemStringForAuthorityProblemSlug,
  productSurfaceStringForAuthoritySurfaceSlug,
} from "@/lib/authority/authorityProductTaxonomyBridge";
import { getSurfaceSlugsForMethod, getSurfaceSlugsForProblem } from "@/authority/data/authorityGraphSelectors";

export type ProductRecommendationSourcePageType =
  | "problem"
  | "surface_problem"
  | "method_problem"
  | "anti_pattern"
  | "comparison";

export type ProductRecommendationContext = {
  problem: string;
  surface?: string;
  intent: ProductCleaningIntent;
  sourcePageType: ProductRecommendationSourcePageType;
  heading: string;
  /** Authority problem slug for cross-surface density fallback (same ranker; extra surfaces only). */
  densityAuthorityProblemSlug?: string;
  contextTone?:
    | "direct"
    | "surface_wording_match"
    | "method_representative"
    | "anti_pattern_replacement"
    | "comparison_fallback";
};

function sorted(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function intersectAuthoritySurfaceForMethodProblem(methodSlug: string, problemSlug: string): string | null {
  const methodSurfaces = new Set(getSurfaceSlugsForMethod(methodSlug));
  for (const s of sorted(getSurfaceSlugsForProblem(problemSlug))) {
    if (methodSurfaces.has(s)) return s;
  }
  return null;
}

function firstAuthoritySurfaceForProblem(problemSlug: string): string | null {
  return sorted(getSurfaceSlugsForProblem(problemSlug))[0] ?? null;
}

function normalizeAuthorityProblemSlug(problemSlug: string): string {
  return problemSlug
    .replace(/-on-[a-z0-9-]+$/i, "")
    .replace(/-from-[a-z0-9-]+$/i, "")
    .replace(/-for-[a-z0-9-]+$/i, "");
}

export function resolveProductRecommendationContextForProblemPage(
  problemSlug: string,
): ProductRecommendationContext | null {
  const directProblem = productProblemStringForAuthorityProblemSlug(problemSlug);
  const normalizedProblem = productProblemStringForAuthorityProblemSlug(normalizeAuthorityProblemSlug(problemSlug));

  const problem =
    directProblem ?? normalizedProblem ?? problemSlug.replace(/-/g, " ");

  if (!directProblem && !normalizedProblem) {
    console.warn("[ProductContextFallback] using raw slug:", problemSlug);
  }

  const authSurface = firstAuthoritySurfaceForProblem(problemSlug);
  const surface = authSurface ? productSurfaceStringForAuthoritySurfaceSlug(authSurface) ?? undefined : undefined;

  return {
    problem,
    surface,
    intent: inferRecommendationIntent(problem),
    sourcePageType: "problem",
    heading: "Best products for this problem",
    densityAuthorityProblemSlug: problemSlug,
    contextTone: directProblem ? "direct" : "surface_wording_match",
  };
}

export function resolveProductRecommendationContextForSurfaceProblemPage(
  surfaceSlug: string,
  problemSlug: string,
): ProductRecommendationContext | null {
  const directProblem = productProblemStringForAuthorityProblemSlug(problemSlug);
  const directSurface = productSurfaceStringForAuthoritySurfaceSlug(surfaceSlug);

  if (directProblem && directSurface) {
    return {
      problem: directProblem,
      surface: directSurface,
      intent: inferRecommendationIntent(directProblem),
      sourcePageType: "surface_problem",
      heading: "Recommended products for this situation",
      densityAuthorityProblemSlug: problemSlug,
      contextTone: "direct",
    };
  }

  const normalizedProblem = productProblemStringForAuthorityProblemSlug(normalizeAuthorityProblemSlug(problemSlug));

  if (normalizedProblem && directSurface) {
    return {
      problem: normalizedProblem,
      surface: directSurface,
      intent: inferRecommendationIntent(normalizedProblem),
      sourcePageType: "surface_problem",
      heading: "Recommended products for this situation",
      densityAuthorityProblemSlug: problemSlug,
      contextTone: "surface_wording_match",
    };
  }

  return null;
}

export function resolveProductRecommendationContextForMethodProblemPage(
  methodSlug: string,
  problemSlug: string,
): ProductRecommendationContext | null {
  const directProblem = productProblemStringForAuthorityProblemSlug(problemSlug);
  const normalizedProblem = productProblemStringForAuthorityProblemSlug(normalizeAuthorityProblemSlug(problemSlug));
  const problem = directProblem ?? normalizedProblem;
  if (!problem) return null;

  const intersectedSurfaceSlug = intersectAuthoritySurfaceForMethodProblem(methodSlug, problemSlug);
  const fallbackSurfaceSlug = intersectedSurfaceSlug ?? firstAuthoritySurfaceForProblem(problemSlug);
  const surface = fallbackSurfaceSlug
    ? productSurfaceStringForAuthoritySurfaceSlug(fallbackSurfaceSlug) ?? undefined
    : undefined;

  return {
    problem,
    surface,
    intent: inferRecommendationIntentForMethodPlaybook(methodSlug, problem),
    sourcePageType: "method_problem",
    heading: "Products that fit this method",
    densityAuthorityProblemSlug: problemSlug,
    contextTone: intersectedSurfaceSlug ? "direct" : "method_representative",
  };
}

/** `primaryProblemSlug` is an authority problem slug (e.g. `grease-buildup`), not the guide slug. */
export function resolveProductRecommendationContextForAntiPatternPage(
  primaryProblemSlug: string,
): ProductRecommendationContext | null {
  const directProblem = productProblemStringForAuthorityProblemSlug(primaryProblemSlug);
  const normalizedProblem = productProblemStringForAuthorityProblemSlug(
    normalizeAuthorityProblemSlug(primaryProblemSlug),
  );
  const problem = directProblem ?? normalizedProblem;
  if (!problem) return null;

  const authSurface = firstAuthoritySurfaceForProblem(primaryProblemSlug);
  const surface = authSurface ? productSurfaceStringForAuthoritySurfaceSlug(authSurface) ?? undefined : undefined;

  return {
    problem,
    surface,
    intent: inferRecommendationIntent(problem),
    sourcePageType: "anti_pattern",
    heading: "Use these instead",
    densityAuthorityProblemSlug: primaryProblemSlug,
    contextTone: "anti_pattern_replacement",
  };
}

export function resolveProductRecommendationContextForComparisonFallback(
  problemSlug: string,
  surfaceSlug?: string,
): ProductRecommendationContext | null {
  const directProblem = productProblemStringForAuthorityProblemSlug(problemSlug);
  const normalizedProblem = productProblemStringForAuthorityProblemSlug(normalizeAuthorityProblemSlug(problemSlug));
  const problem = directProblem ?? normalizedProblem;
  if (!problem) return null;

  const surface = surfaceSlug ? productSurfaceStringForAuthoritySurfaceSlug(surfaceSlug) ?? undefined : undefined;

  return {
    problem,
    surface,
    intent: inferRecommendationIntent(problem),
    sourcePageType: "comparison",
    heading: "Better options for this scenario",
    densityAuthorityProblemSlug: problemSlug,
    contextTone: "comparison_fallback",
  };
}
