import { buildEncyclopediaHref } from "./slug";
import type {
  EncyclopediaCategory,
  EncyclopediaClusterRollup,
  EncyclopediaClusterSection,
  EncyclopediaClusterSectionKind,
  EncyclopediaLinkedEntry,
  EncyclopediaResolvedIndexEntryBeforeGraph,
  EncyclopediaRole,
} from "./types";

/** Categories that participate in pipeline-backed cluster hubs. */
export const ENCYCLOPEDIA_PIPELINE_CLUSTER_CATEGORIES = [
  "problems",
  "methods",
  "surfaces",
] as const satisfies readonly EncyclopediaCategory[];

export type EncyclopediaPipelineClusterCategory =
  (typeof ENCYCLOPEDIA_PIPELINE_CLUSTER_CATEGORIES)[number];

const PIPELINE_SET = new Set<string>(ENCYCLOPEDIA_PIPELINE_CLUSTER_CATEGORIES);

export function isPipelineClusterCategory(
  category: EncyclopediaCategory,
): category is EncyclopediaPipelineClusterCategory {
  return PIPELINE_SET.has(category);
}

function isVariantRole(role: EncyclopediaRole): boolean {
  return (
    role === "surface-variant" ||
    role === "severity-variant" ||
    role === "intent-variant"
  );
}

/**
 * Problem-first base score, then boosts for core / canonical / non-variant roles.
 */
export function getClusterEntryRank(entry: EncyclopediaResolvedIndexEntryBeforeGraph): number {
  let score = 0;
  if (entry.category === "problems") score += 100;
  else if (entry.category === "methods") score += 80;
  else if (entry.category === "surfaces") score += 60;

  if (entry.role === "core") score += 40;

  if (!isVariantRole(entry.role) && entry.role !== "supporting") {
    score += 12;
  } else if (!isVariantRole(entry.role)) {
    score += 6;
  }

  if (entry.slug === entry.cluster) {
    score += 20;
  } else if (entry.slug.startsWith(`${entry.cluster}-`)) {
    score += 10;
  }

  if (entry.role === "supporting") score -= 8;

  return score;
}

export function formatClusterDisplayTitle(cluster: string): string {
  return cluster
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function resolvedIndexEntryToLinkedEntry(
  entry: EncyclopediaResolvedIndexEntryBeforeGraph,
): EncyclopediaLinkedEntry {
  return {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    cluster: entry.cluster,
    slug: entry.slug,
    href: buildEncyclopediaHref(entry.category, entry.slug),
  };
}

function sortByRankThenTitle(
  entries: EncyclopediaResolvedIndexEntryBeforeGraph[],
): EncyclopediaResolvedIndexEntryBeforeGraph[] {
  return [...entries].sort((a, b) => {
    const dr = getClusterEntryRank(b) - getClusterEntryRank(a);
    if (dr !== 0) return dr;
    return a.title.localeCompare(b.title);
  });
}

function filterPipelinePublished(
  entries: EncyclopediaResolvedIndexEntryBeforeGraph[],
  cluster: string,
): EncyclopediaResolvedIndexEntryBeforeGraph[] {
  return entries.filter(
    (e) =>
      e.cluster === cluster &&
      e.status === "published" &&
      e.fileExists &&
      isPipelineClusterCategory(e.category),
  );
}

const CAP_FEATURED = 8;
const CAP_PROBLEMS = 8;
const CAP_METHODS = 6;
const CAP_SURFACES = 6;
const CAP_EXPLORE = 8;

export function buildEncyclopediaClusterRollup(
  cluster: string,
  allResolved: EncyclopediaResolvedIndexEntryBeforeGraph[],
): EncyclopediaClusterRollup | null {
  const inCluster = filterPipelinePublished(allResolved, cluster);
  if (inCluster.length === 0) {
    return null;
  }

  const problems = inCluster.filter((e) => e.category === "problems");
  const methods = inCluster.filter((e) => e.category === "methods");
  const surfaces = inCluster.filter((e) => e.category === "surfaces");

  const sortedAll = sortByRankThenTitle(inCluster);
  const featuredEntries = sortedAll
    .slice(0, CAP_FEATURED)
    .map(resolvedIndexEntryToLinkedEntry);

  const problemsOrdered = sortByRankThenTitle(problems);
  const methodsOrdered = sortByRankThenTitle(methods);
  const surfacesOrdered = sortByRankThenTitle(surfaces);

  const problemLinked = problemsOrdered
    .slice(0, CAP_PROBLEMS)
    .map(resolvedIndexEntryToLinkedEntry);
  const methodLinked = methodsOrdered
    .slice(0, CAP_METHODS)
    .map(resolvedIndexEntryToLinkedEntry);
  const surfaceLinked = surfacesOrdered
    .slice(0, CAP_SURFACES)
    .map(resolvedIndexEntryToLinkedEntry);

  const sections: EncyclopediaClusterSection[] = [];

  if (problemLinked.length > 0) {
    sections.push({
      title: "Common problems",
      category: "problems",
      entries: problemLinked,
    });
  }

  if (methodLinked.length > 0) {
    sections.push({
      title: "Recommended cleaning methods",
      category: "methods",
      entries: methodLinked,
    });
  }

  if (surfaceLinked.length > 0) {
    sections.push({
      title: "Relevant surfaces",
      category: "surfaces",
      entries: surfaceLinked,
    });
  }

  const shownIds = new Set<string>();
  for (const e of [
    ...problemLinked,
    ...methodLinked,
    ...surfaceLinked,
    ...featuredEntries,
  ]) {
    shownIds.add(e.id);
  }

  const exploreSource = sortedAll.filter((e) => !shownIds.has(e.id));
  const exploreLinked = exploreSource
    .slice(0, CAP_EXPLORE)
    .map(resolvedIndexEntryToLinkedEntry);

  if (exploreLinked.length > 0) {
    sections.push({
      title: "Explore more in this cluster",
      category: "mixed",
      entries: exploreLinked,
    });
  }

  const title = formatClusterDisplayTitle(cluster);
  const intro = `Authoritative guides across problems, methods, and surfaces for ${title.toLowerCase()}—structured for safer, more effective home cleaning.`;

  return {
    cluster,
    title,
    intro,
    totalPublishedPages: inCluster.length,
    problemCount: problems.length,
    methodCount: methods.length,
    surfaceCount: surfaces.length,
    featuredEntries,
    sections,
  };
}

export function listEncyclopediaClusterSlugs(
  allResolved: EncyclopediaResolvedIndexEntryBeforeGraph[],
): string[] {
  const slugs = new Set<string>();
  for (const e of allResolved) {
    if (
      e.status === "published" &&
      e.fileExists &&
      isPipelineClusterCategory(e.category)
    ) {
      slugs.add(e.cluster);
    }
  }
  return [...slugs].sort((a, b) => a.localeCompare(b));
}
