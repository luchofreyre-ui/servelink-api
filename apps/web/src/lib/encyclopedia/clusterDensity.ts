import {
  clusterLabelForSlug,
  type EncyclopediaCorpusEntry,
  inferIsComparisonSlug,
  inferIsGuideCategory,
  inferIsQuestionSlug,
} from "./loadEncyclopediaIndexEntries";
import type { EncyclopediaCategory } from "./types";

export interface ClusterDensityBucketCounts {
  problems: number;
  methods: number;
  surfaces: number;
  questions: number;
  comparisons: number;
  guides: number;
  total: number;
}

export interface ClusterDensityMissingArchetypes {
  hasProblemPages: boolean;
  hasMethodPages: boolean;
  hasQuestionPages: boolean;
  hasComparisonPages: boolean;
  hasSurfaceCoverage: boolean;
}

export type ClusterDensityStatus = "thin" | "developing" | "dense";

export interface ClusterDensityReportRow {
  clusterSlug: string;
  clusterLabel: string;
  counts: ClusterDensityBucketCounts;
  missing: ClusterDensityMissingArchetypes;
  status: ClusterDensityStatus;
  sampleSlugs: string[];
}

export interface ClusterDensityReport {
  generatedAt: string;
  totalClusters: number;
  rows: ClusterDensityReportRow[];
}

function emptyCounts(): ClusterDensityBucketCounts {
  return {
    problems: 0,
    methods: 0,
    surfaces: 0,
    questions: 0,
    comparisons: 0,
    guides: 0,
    total: 0,
  };
}

function incrementBuckets(counts: ClusterDensityBucketCounts, e: EncyclopediaCorpusEntry): void {
  counts.total += 1;
  if (e.category === "problems") {
    counts.problems += 1;
  }
  if (e.category === "methods") {
    counts.methods += 1;
  }
  if (e.category === "surfaces") {
    counts.surfaces += 1;
  }
  if (inferIsQuestionSlug(e.slug)) {
    counts.questions += 1;
  }
  if (inferIsComparisonSlug(e.slug)) {
    counts.comparisons += 1;
  }
  if (inferIsGuideCategory(e.category)) {
    counts.guides += 1;
  }
}

function hasSurfaceSpecificProblemOrMethod(slug: string, category: EncyclopediaCategory): boolean {
  if (category !== "problems" && category !== "methods") {
    return false;
  }
  return slug.includes("-on-") || slug.includes("-for-");
}

export function computeMissingArchetypes(
  counts: ClusterDensityBucketCounts,
  clusterEntries: EncyclopediaCorpusEntry[],
): ClusterDensityMissingArchetypes {
  const hasSurfaceCoverage =
    counts.surfaces > 0 ||
    clusterEntries.some((e) => hasSurfaceSpecificProblemOrMethod(e.slug, e.category));

  return {
    hasProblemPages: counts.problems > 0,
    hasMethodPages: counts.methods > 0,
    hasQuestionPages: counts.questions > 0,
    hasComparisonPages: counts.comparisons > 0,
    hasSurfaceCoverage,
  };
}

/**
 * v1 thresholds (explicit):
 * - thin: total < 5 OR (no problems AND no methods)
 * - dense: total >= 12 AND problems >= 1 AND methods >= 1 AND (questions OR comparisons OR guides)
 * - developing: everything else
 */
export function classifyClusterDensityStatus(
  counts: ClusterDensityBucketCounts,
): ClusterDensityStatus {
  const { total, problems, methods, questions, comparisons, guides } = counts;

  if (total < 5 || (problems === 0 && methods === 0)) {
    return "thin";
  }

  const hasDeepSignal = questions > 0 || comparisons > 0 || guides > 0;
  if (total >= 12 && problems >= 1 && methods >= 1 && hasDeepSignal) {
    return "dense";
  }

  return "developing";
}

export function sampleSlugsForCluster(entries: EncyclopediaCorpusEntry[], limit = 5): string[] {
  return [...entries].sort((a, b) => a.slug.localeCompare(b.slug)).slice(0, limit).map((e) => e.slug);
}

export function buildClusterDensityReport(
  entries: EncyclopediaCorpusEntry[],
  generatedAt: string,
): ClusterDensityReport {
  const byCluster = new Map<string, EncyclopediaCorpusEntry[]>();
  for (const e of entries) {
    const key = e.cluster || "uncategorized";
    const list = byCluster.get(key) ?? [];
    list.push(e);
    byCluster.set(key, list);
  }

  const rows: ClusterDensityReportRow[] = [];

  for (const [clusterSlug, clusterEntries] of [...byCluster.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const counts = emptyCounts();
    for (const e of clusterEntries) {
      incrementBuckets(counts, e);
    }
    const missing = computeMissingArchetypes(counts, clusterEntries);
    const status = classifyClusterDensityStatus(counts);
    rows.push({
      clusterSlug,
      clusterLabel: clusterLabelForSlug(clusterSlug),
      counts,
      missing,
      status,
      sampleSlugs: sampleSlugsForCluster(clusterEntries, 5),
    });
  }

  return {
    generatedAt,
    totalClusters: rows.length,
    rows,
  };
}
