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
import { getMappedProblemLabel, getMappedSurfaceLabel } from "./productTaxonomyMaps";

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

function warnMissingProductTaxonomy(kind: "problem" | "surface", slug?: string | null) {
  if (process.env.NODE_ENV === "production") return;
  if (!slug) return;
  console.warn(`[productRecommendationContext] Missing ${kind} taxonomy mapping for slug: ${slug}`);
}

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

function resolveSurfaceLabels(surfaceSlug: string | null | undefined): string | undefined {
  if (!surfaceSlug) return undefined;
  const directSurface = productSurfaceStringForAuthoritySurfaceSlug(surfaceSlug);
  const mappedSurface = getMappedSurfaceLabel(surfaceSlug);
  const resolvedSurface = directSurface ?? mappedSurface ?? null;

  if (!resolvedSurface && surfaceSlug) {
    warnMissingProductTaxonomy("surface", surfaceSlug);
  }

  return resolvedSurface ?? undefined;
}

export function resolveProductRecommendationContextForProblemPage(
  problemSlug: string,
): ProductRecommendationContext | null {
  const directProblem = productProblemStringForAuthorityProblemSlug(problemSlug);
  const normalizedProblem = productProblemStringForAuthorityProblemSlug(normalizeAuthorityProblemSlug(problemSlug));
  const mappedProblem = getMappedProblemLabel(problemSlug);
  const resolvedProblem = directProblem ?? normalizedProblem ?? mappedProblem ?? null;

  if (!resolvedProblem && problemSlug) {
    warnMissingProductTaxonomy("problem", problemSlug);
  }

  if (!resolvedProblem) return null;

  const authSurface = firstAuthoritySurfaceForProblem(problemSlug);
  const resolvedSurface = resolveSurfaceLabels(authSurface);

  return {
    problem: resolvedProblem,
    surface: resolvedSurface ?? undefined,
    intent: inferRecommendationIntent(resolvedProblem),
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
  const normalizedProblem = productProblemStringForAuthorityProblemSlug(normalizeAuthorityProblemSlug(problemSlug));
  const mappedProblem = getMappedProblemLabel(problemSlug);
  const mappedSurface = getMappedSurfaceLabel(surfaceSlug);

  const resolvedProblem = directProblem ?? normalizedProblem ?? mappedProblem ?? null;
  const resolvedSurface = directSurface ?? mappedSurface ?? null;

  if (!resolvedProblem && problemSlug) {
    warnMissingProductTaxonomy("problem", problemSlug);
  }
  if (!resolvedSurface && surfaceSlug) {
    warnMissingProductTaxonomy("surface", surfaceSlug);
  }

  if (!resolvedProblem || !resolvedSurface) return null;

  return {
    problem: resolvedProblem,
    surface: resolvedSurface,
    intent: inferRecommendationIntent(resolvedProblem),
    sourcePageType: "surface_problem",
    heading: "Recommended products for this situation",
    densityAuthorityProblemSlug: problemSlug,
    contextTone: directProblem && directSurface ? "direct" : "surface_wording_match",
  };
}

export function resolveProductRecommendationContextForMethodProblemPage(
  methodSlug: string,
  problemSlug: string,
): ProductRecommendationContext | null {
  const directProblem = productProblemStringForAuthorityProblemSlug(problemSlug);
  const normalizedProblem = productProblemStringForAuthorityProblemSlug(normalizeAuthorityProblemSlug(problemSlug));
  const mappedProblem = getMappedProblemLabel(problemSlug);
  const resolvedProblem = directProblem ?? normalizedProblem ?? mappedProblem ?? null;

  if (!resolvedProblem && problemSlug) {
    warnMissingProductTaxonomy("problem", problemSlug);
  }

  if (!resolvedProblem) return null;

  const intersectedSurfaceSlug = intersectAuthoritySurfaceForMethodProblem(methodSlug, problemSlug);
  const fallbackSurfaceSlug = intersectedSurfaceSlug ?? firstAuthoritySurfaceForProblem(problemSlug);
  const resolvedSurface = resolveSurfaceLabels(fallbackSurfaceSlug ?? undefined);

  return {
    problem: resolvedProblem,
    surface: resolvedSurface ?? undefined,
    intent: inferRecommendationIntentForMethodPlaybook(methodSlug, resolvedProblem),
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
  const mappedProblem = getMappedProblemLabel(primaryProblemSlug);
  const resolvedProblem = directProblem ?? normalizedProblem ?? mappedProblem ?? null;

  if (!resolvedProblem && primaryProblemSlug) {
    warnMissingProductTaxonomy("problem", primaryProblemSlug);
  }

  if (!resolvedProblem) return null;

  const authSurface = firstAuthoritySurfaceForProblem(primaryProblemSlug);
  const resolvedSurface = resolveSurfaceLabels(authSurface);

  return {
    problem: resolvedProblem,
    surface: resolvedSurface ?? undefined,
    intent: inferRecommendationIntent(resolvedProblem),
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
  const mappedProblem = getMappedProblemLabel(problemSlug);
  const resolvedProblem = directProblem ?? normalizedProblem ?? mappedProblem ?? null;

  if (!resolvedProblem && problemSlug) {
    warnMissingProductTaxonomy("problem", problemSlug);
  }

  if (!resolvedProblem) return null;

  let surface: string | undefined;
  if (surfaceSlug) {
    const directSurface = productSurfaceStringForAuthoritySurfaceSlug(surfaceSlug);
    const mappedSurface = getMappedSurfaceLabel(surfaceSlug);
    const resolvedSurface = directSurface ?? mappedSurface ?? null;
    if (!resolvedSurface && surfaceSlug) {
      warnMissingProductTaxonomy("surface", surfaceSlug);
    }
    surface = resolvedSurface ?? undefined;
  }

  return {
    problem: resolvedProblem,
    surface,
    intent: inferRecommendationIntent(resolvedProblem),
    sourcePageType: "comparison",
    heading: "Better options for this scenario",
    densityAuthorityProblemSlug: problemSlug,
    contextTone: "comparison_fallback",
  };
}
