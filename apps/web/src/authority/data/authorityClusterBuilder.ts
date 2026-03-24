import type { AuthorityClusterPageData } from "../types/authorityPageTypes";
import {
  getAllClusterSeeds,
  getClusterSeedBySlug,
  getComparisonRefsForCluster,
  getMethodSlugsForCluster,
  getProblemSlugsForCluster,
  getSurfaceSlugsForCluster,
} from "./authorityClusterSelectors";

export function buildClusterPage(slug: string): AuthorityClusterPageData | null {
  const seed = getClusterSeedBySlug(slug);
  if (!seed) return null;

  return {
    type: seed.type,
    slug: seed.slug,
    title: seed.title,
    description: seed.description,
    intro: seed.intro,
    relatedMethods: getMethodSlugsForCluster(seed),
    relatedSurfaces: getSurfaceSlugsForCluster(seed),
    relatedProblems: getProblemSlugsForCluster(seed),
    relatedGuides: seed.guideSlugs ?? [],
    relatedComparisons: getComparisonRefsForCluster(seed),
  };
}

export function getClusterStaticParams() {
  return getAllClusterSeeds().map((seed) => ({
    clusterSlug: seed.slug,
  }));
}
