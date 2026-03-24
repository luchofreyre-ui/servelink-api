import type { AuthorityClusterType, AuthorityProblemCategory } from "../types/authorityPageTypes";
import { getComparisonSlugsForEntity } from "./authorityComparisonSelectors";
import { AUTHORITY_CLUSTER_SEEDS, type AuthorityClusterSeed } from "./authorityClusterRegistry";
import { formatAuthorityClusterTitle } from "./authorityLabeling";
import { getProblemSlugsByCategory } from "./authorityGuideSelectors";
import {
  getMethodSlugsForProblem,
  getMethodSlugsForSurface,
  getProblemSlugsForMethod,
  getProblemSlugsForSurface,
  getSurfaceSlugsForMethod,
  getSurfaceSlugsForProblem,
} from "./authorityGraphSelectors";

function uniqueSorted(values: string[], max = 24): string[] {
  return Array.from(new Set(values))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, max);
}

export function getAllClusterSeeds(): AuthorityClusterSeed[] {
  return AUTHORITY_CLUSTER_SEEDS;
}

export function getClusterSeedsByType(type: AuthorityClusterType): AuthorityClusterSeed[] {
  return AUTHORITY_CLUSTER_SEEDS.filter((seed) => seed.type === type);
}

export function getClusterSeedBySlug(slug: string): AuthorityClusterSeed | null {
  return AUTHORITY_CLUSTER_SEEDS.find((seed) => seed.slug === slug) ?? null;
}

export function getClusterTitleBySlug(clusterSlug: string): string {
  return getClusterSeedBySlug(clusterSlug)?.title ?? formatAuthorityClusterTitle(clusterSlug);
}

export function getProblemSlugsForCluster(seed: AuthorityClusterSeed): string[] {
  if (seed.problemCategories?.length) {
    return uniqueSorted(
      seed.problemCategories.flatMap((category) => getProblemSlugsByCategory(category)),
    );
  }

  if (seed.methodSlugs?.length) {
    return uniqueSorted(seed.methodSlugs.flatMap((methodSlug) => getProblemSlugsForMethod(methodSlug)));
  }

  if (seed.surfaceSlugs?.length) {
    return uniqueSorted(
      seed.surfaceSlugs.flatMap((surfaceSlug) => getProblemSlugsForSurface(surfaceSlug)),
    );
  }

  return [];
}

export function getMethodSlugsForCluster(seed: AuthorityClusterSeed): string[] {
  if (seed.methodSlugs?.length) {
    return uniqueSorted(seed.methodSlugs);
  }

  const problemSlugs = getProblemSlugsForCluster(seed);
  const fromProblems = problemSlugs.flatMap((problemSlug) => getMethodSlugsForProblem(problemSlug));
  const fromSurfaces = (seed.surfaceSlugs ?? []).flatMap((surfaceSlug) =>
    getMethodSlugsForSurface(surfaceSlug),
  );

  return uniqueSorted([...fromProblems, ...fromSurfaces]);
}

export function getSurfaceSlugsForCluster(seed: AuthorityClusterSeed): string[] {
  if (seed.surfaceSlugs?.length) {
    return uniqueSorted(seed.surfaceSlugs);
  }

  const problemSlugs = getProblemSlugsForCluster(seed);
  const fromProblems = problemSlugs.flatMap((problemSlug) => getSurfaceSlugsForProblem(problemSlug));
  const fromMethods = (seed.methodSlugs ?? []).flatMap((methodSlug) =>
    getSurfaceSlugsForMethod(methodSlug),
  );

  return uniqueSorted([...fromProblems, ...fromMethods]);
}

export function getComparisonRefsForCluster(seed: AuthorityClusterSeed): {
  type: "methods" | "surfaces" | "problems";
  slugs: string[];
}[] {
  const methods = uniqueSorted(
    getMethodSlugsForCluster(seed).flatMap((slug) =>
      getComparisonSlugsForEntity("method_comparison", slug),
    ),
    8,
  );

  const surfaces = uniqueSorted(
    getSurfaceSlugsForCluster(seed).flatMap((slug) =>
      getComparisonSlugsForEntity("surface_comparison", slug),
    ),
    8,
  );

  const problems = uniqueSorted(
    getProblemSlugsForCluster(seed).flatMap((slug) =>
      getComparisonSlugsForEntity("problem_comparison", slug),
    ),
    8,
  );

  return [
    ...(methods.length ? [{ type: "methods" as const, slugs: methods }] : []),
    ...(surfaces.length ? [{ type: "surfaces" as const, slugs: surfaces }] : []),
    ...(problems.length ? [{ type: "problems" as const, slugs: problems }] : []),
  ];
}

const LOW_RESIDUE_METHODS = new Set(["neutral-surface-cleaning", "glass-cleaning"]);
const TARGETED_METHODS = new Set([
  "degreasing",
  "hard-water-deposit-removal",
  "touchpoint-sanitization",
]);

const VISIBILITY_SURFACES = new Set(["shower-glass", "stainless-steel", "granite-countertops"]);
const TRAFFIC_SURFACES = new Set(["tile", "painted-walls", "stainless-steel"]);

/** Entity pages: deterministic cluster slugs for a method (deduped). */
export function getRelatedClusterSlugsForMethod(methodSlug: string): string[] {
  const out: string[] = [];
  if (LOW_RESIDUE_METHODS.has(methodSlug)) out.push("low-residue-maintenance-methods");
  if (TARGETED_METHODS.has(methodSlug)) out.push("targeted-removal-methods");
  return [...new Set(out)];
}

/** Entity pages: deterministic cluster slugs for a surface (deduped). */
export function getRelatedClusterSlugsForSurface(surfaceSlug: string): string[] {
  const out: string[] = [];
  if (VISIBILITY_SURFACES.has(surfaceSlug)) out.push("high-visibility-finish-sensitive-surfaces");
  if (TRAFFIC_SURFACES.has(surfaceSlug)) out.push("high-contact-and-high-traffic-surfaces");
  return [...new Set(out)];
}

/** Entity pages: deterministic cluster slugs from problem category (deduped). */
export function getRelatedClusterSlugsForProblemCategory(category: AuthorityProblemCategory): string[] {
  const out: string[] = [];
  if (category === "mineral" || category === "residue") out.push("mineral-buildup-and-hard-water");
  if (category === "oil_based" || category === "organic") out.push("oil-and-kitchen-residue");
  if (category === "physical_damage" || category === "transfer") out.push("damage-and-finish-risk");
  return [...new Set(out)];
}
