import { scoreGeneratedCandidate } from "./candidateScoring";
import {
  buildClusterDensityReport,
  type ClusterDensityMissingArchetypes,
  type ClusterDensityReportRow,
  type ClusterDensityStatus,
} from "./clusterDensity";
import type { EncyclopediaCorpusEntry } from "./loadEncyclopediaIndexEntries";
import { candidateExistsInMasterIndex, type MasterIndexLookup } from "./masterIndexLookup";
import { normalizeIndexCandidate } from "./normalizeIndexCandidate";
import { evaluateMethodSurfaceCompatibility, evaluateProblemSurfaceCompatibility } from "./surfaceCompatibility";
import { cleanupSurfaceTaxonomy } from "./taxonomyCleanup";

export type ClusterGapExpansionEntity = {
  slug: string;
  title: string;
  cluster: string;
};

export type ClusterGapExpansionPools = {
  problems: readonly ClusterGapExpansionEntity[];
  methods: readonly ClusterGapExpansionEntity[];
  surfaces: readonly { slug: string }[];
};

export type ClusterGapGuardRule =
  | {
      appliesTo: "problem_surface";
      problemSlug: string;
      surfaceSlug: string;
      action: "exclude" | "flag";
      warningCode: string;
    }
  | {
      appliesTo: "method_surface";
      methodSlug: string;
      surfaceSlug: string;
      action: "exclude" | "flag";
      warningCode: string;
    };

export type GapBackfillRawCandidate = {
  id: string;
  slug: string;
  title: string;
  category: "problems" | "methods";
  cluster: string;
  role: "supporting";
  status: "draft";
  generatedType: string;
  sourceFamily: string;
  sourceParts: Record<string, unknown>;
  seedWarnings?: string[];
  cleanedTitle?: string;
  cleanedSlug?: string;
  qualityScore?: number;
  qualityFlags?: string[];
  recommendation?: "promote" | "review" | "reject";
};

export interface ClusterGapBackfillClusterSummary {
  clusterSlug: string;
  clusterLabel: string;
  status: ClusterDensityStatus;
  priority: number;
  candidatesAdded: number;
  /** problem_surface / method_surface candidates skipped (ID or slug already in master index). */
  suppressedByMasterIndex: number;
}

export interface ClusterGapBackfillPayload {
  generatedAt: string;
  totalCandidates: number;
  /** Total problem/method × surface skips because ID or slug already exists in master-index.json. */
  masterIndexSuppressedCount: number;
  clusters: ClusterGapBackfillClusterSummary[];
  candidates: GapBackfillRawCandidate[];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function makeGapId(kind: string, slug: string): string {
  const tail = slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
  return `GAP-${kind}-${tail}`;
}

function isSelfSurfaceDuplicate(base: string, surface: string): boolean {
  return base === surface;
}

function guardProblemSurface(
  rules: ClusterGapGuardRule[],
  problemSlug: string,
  surfaceNorm: string,
): { exclude: boolean; warnings: string[] } {
  const hits = rules.filter(
    (r) =>
      r.appliesTo === "problem_surface" &&
      r.problemSlug === problemSlug &&
      r.surfaceSlug === surfaceNorm,
  );
  if (hits.some((h) => h.action === "exclude")) {
    return { exclude: true, warnings: [] };
  }
  return { exclude: false, warnings: hits.filter((h) => h.action === "flag").map((h) => h.warningCode) };
}

function guardMethodSurface(
  rules: ClusterGapGuardRule[],
  methodSlug: string,
  surfaceNorm: string,
): { exclude: boolean; warnings: string[] } {
  const hits = rules.filter(
    (r) =>
      r.appliesTo === "method_surface" &&
      r.methodSlug === methodSlug &&
      r.surfaceSlug === surfaceNorm,
  );
  if (hits.some((h) => h.action === "exclude")) {
    return { exclude: true, warnings: [] };
  }
  return { exclude: false, warnings: hits.filter((h) => h.action === "flag").map((h) => h.warningCode) };
}

export function computeClusterGapPriority(
  status: ClusterDensityStatus,
  missing: ClusterDensityMissingArchetypes,
): number {
  let p = status === "thin" ? 100 : status === "developing" ? 50 : 0;
  if (!missing.hasMethodPages) {
    p += 20;
  }
  if (!missing.hasQuestionPages) {
    p += 15;
  }
  if (!missing.hasComparisonPages) {
    p += 10;
  }
  if (!missing.hasProblemPages) {
    p += 25;
  }
  if (!missing.hasSurfaceCoverage) {
    p += 12;
  }
  return p;
}

function resolveAnchors(
  clusterSlug: string,
  clusterLabel: string,
  pools: ClusterGapExpansionPools,
): { problem: ClusterGapExpansionEntity; method: ClusterGapExpansionEntity } {
  const problem =
    pools.problems.find((p) => p.cluster === clusterSlug || p.slug === clusterSlug) ?? {
      slug: clusterSlug,
      title: clusterLabel,
      cluster: clusterSlug,
    };
  const method =
    pools.methods.find((m) => m.cluster === clusterSlug || m.slug === clusterSlug) ?? {
      slug: clusterSlug,
      title: clusterLabel,
      cluster: clusterSlug,
    };
  return { problem, method };
}

/** Prefer these surfaces first so per-cluster caps still reach laminate/vinyl and common floors. */
const GAP_BACKFILL_SURFACE_PRIORITY = [
  "laminate",
  "vinyl",
  "tile-floors",
  "painted-walls",
  "cabinets",
  "countertops",
  "backsplashes",
] as const;

function sortedSurfacesForGap(pools: ClusterGapExpansionPools): { slug: string }[] {
  const list = [...pools.surfaces];
  const priorityIndex = new Map<string, number>(
    GAP_BACKFILL_SURFACE_PRIORITY.map((s, i) => [s, i]),
  );
  return list.sort((a, b) => {
    const pa = priorityIndex.get(a.slug);
    const pb = priorityIndex.get(b.slug);
    if (pa !== undefined && pb !== undefined && pa !== pb) {
      return pa - pb;
    }
    if (pa !== undefined && pb === undefined) {
      return -1;
    }
    if (pa === undefined && pb !== undefined) {
      return 1;
    }
    return a.slug.localeCompare(b.slug);
  });
}

function pushProblemSurface(
  problem: ClusterGapExpansionEntity,
  surfaceRef: { slug: string },
  rules: ClusterGapGuardRule[],
  existingSlugs: Set<string>,
  out: GapBackfillRawCandidate[],
  masterLookup: MasterIndexLookup | undefined,
  onMasterSuppress: (() => void) | undefined,
): boolean {
  const cleaned = cleanupSurfaceTaxonomy(surfaceRef.slug);
  if (isSelfSurfaceDuplicate(problem.slug, cleaned.normalizedSurfaceSlug)) {
    return false;
  }
  if (!evaluateProblemSurfaceCompatibility(problem.slug, cleaned.normalizedSurfaceSlug).ok) {
    return false;
  }
  const slug = `${slugify(problem.slug)}-on-${cleaned.normalizedSurfaceSlug}`;
  const id = makeGapId("P", slug);
  const title = `${problem.title} on ${cleaned.normalizedSurfaceLabel}`;
  const normalizedSlug = normalizeIndexCandidate({
    id,
    title,
    slug,
    category: "problems",
    cluster: problem.cluster,
  }).normalizedSlug;
  if (masterLookup && candidateExistsInMasterIndex(masterLookup, { id, slug, normalizedSlug })) {
    onMasterSuppress?.();
    return false;
  }
  if (existingSlugs.has(slug)) {
    return false;
  }
  const { exclude, warnings } = guardProblemSurface(rules, problem.slug, cleaned.normalizedSurfaceSlug);
  if (exclude) {
    return false;
  }
  const scored = scoreGeneratedCandidate({ title, slug, generatedType: "problem_surface" });
  const row: GapBackfillRawCandidate = {
    id,
    slug,
    title,
    category: "problems",
    cluster: problem.cluster,
    role: "supporting",
    status: "draft",
    generatedType: "problem_surface",
    sourceFamily: "gap_backfill_problem_surface",
    sourceParts: {
      gapBackfill: true,
      problem: { slug: problem.slug, title: problem.title },
      surface: {
        inputSlug: surfaceRef.slug,
        normalizedSlug: cleaned.normalizedSurfaceSlug,
        label: cleaned.normalizedSurfaceLabel,
      },
    },
    cleanedSlug: slug,
    cleanedTitle: title,
    qualityScore: scored.score,
    qualityFlags: scored.flags,
    recommendation: scored.recommendation,
  };
  if (warnings.length > 0) {
    row.seedWarnings = warnings;
  }
  existingSlugs.add(slug);
  out.push(row);
  return true;
}

function pushMethodSurface(
  method: ClusterGapExpansionEntity,
  surfaceRef: { slug: string },
  rules: ClusterGapGuardRule[],
  existingSlugs: Set<string>,
  out: GapBackfillRawCandidate[],
  masterLookup: MasterIndexLookup | undefined,
  onMasterSuppress: (() => void) | undefined,
): boolean {
  const cleaned = cleanupSurfaceTaxonomy(surfaceRef.slug);
  if (isSelfSurfaceDuplicate(method.slug, cleaned.normalizedSurfaceSlug)) {
    return false;
  }
  if (!evaluateMethodSurfaceCompatibility(method.slug, cleaned.normalizedSurfaceSlug).ok) {
    return false;
  }
  const slug = `${slugify(method.slug)}-${cleaned.normalizedSurfaceSlug}`;
  const id = makeGapId("M", slug);
  const title = `${method.title} for ${cleaned.normalizedSurfaceLabel}`;
  const normalizedSlug = normalizeIndexCandidate({
    id,
    title,
    slug,
    category: "methods",
    cluster: method.cluster,
  }).normalizedSlug;
  if (masterLookup && candidateExistsInMasterIndex(masterLookup, { id, slug, normalizedSlug })) {
    onMasterSuppress?.();
    return false;
  }
  if (existingSlugs.has(slug)) {
    return false;
  }
  const { exclude, warnings } = guardMethodSurface(rules, method.slug, cleaned.normalizedSurfaceSlug);
  if (exclude) {
    return false;
  }
  const scored = scoreGeneratedCandidate({ title, slug, generatedType: "method_surface" });
  const row: GapBackfillRawCandidate = {
    id,
    slug,
    title,
    category: "methods",
    cluster: method.cluster,
    role: "supporting",
    status: "draft",
    generatedType: "method_surface",
    sourceFamily: "gap_backfill_method_surface",
    sourceParts: {
      gapBackfill: true,
      method: { slug: method.slug, title: method.title },
      surface: {
        inputSlug: surfaceRef.slug,
        normalizedSlug: cleaned.normalizedSurfaceSlug,
        label: cleaned.normalizedSurfaceLabel,
      },
    },
    cleanedSlug: slug,
    cleanedTitle: title,
    qualityScore: scored.score,
    qualityFlags: scored.flags,
    recommendation: scored.recommendation,
  };
  if (warnings.length > 0) {
    row.seedWarnings = warnings;
  }
  existingSlugs.add(slug);
  out.push(row);
  return true;
}

function pushQuestion(
  stem: string,
  clusterSlug: string,
  family: "question_symptom_cause" | "question_prevention_troubleshooting",
  existingSlugs: Set<string>,
  out: GapBackfillRawCandidate[],
): boolean {
  const slug = slugify(stem);
  if (!slug || existingSlugs.has(slug)) {
    return false;
  }
  const title = stem.charAt(0).toUpperCase() + stem.slice(1);
  const category = family === "question_symptom_cause" ? "problems" : "methods";
  const row: GapBackfillRawCandidate = {
    id: makeGapId(family === "question_symptom_cause" ? "QS" : "QP", slug),
    slug,
    title,
    category,
    cluster: clusterSlug,
    role: "supporting",
    status: "draft",
    generatedType: "question_seed",
    sourceFamily: family,
    sourceParts: { gapBackfill: true, questionStem: stem },
  };
  existingSlugs.add(slug);
  out.push(row);
  return true;
}

function pushComparisonProblems(
  a: ClusterGapExpansionEntity,
  b: ClusterGapExpansionEntity,
  clusterSlug: string,
  existingSlugs: Set<string>,
  out: GapBackfillRawCandidate[],
): boolean {
  const slug = `${slugify(a.slug)}-vs-${slugify(b.slug)}`;
  if (existingSlugs.has(slug)) {
    return false;
  }
  const title = `${a.title} vs ${b.title}`;
  const row: GapBackfillRawCandidate = {
    id: makeGapId("CPP", slug),
    slug,
    title,
    category: "problems",
    cluster: clusterSlug,
    role: "supporting",
    status: "draft",
    generatedType: "comparison_seed",
    sourceFamily: "comparison_problem_problem",
    sourceParts: {
      gapBackfill: true,
      leftProblem: { slug: a.slug, title: a.title },
      rightProblem: { slug: b.slug, title: b.title },
    },
  };
  existingSlugs.add(slug);
  out.push(row);
  return true;
}

function generateForRow(
  row: ClusterDensityReportRow,
  pools: ClusterGapExpansionPools,
  rules: ClusterGapGuardRule[],
  existingSlugs: Set<string>,
  masterLookup: MasterIndexLookup | undefined,
  onMasterSuppress: (() => void) | undefined,
): GapBackfillRawCandidate[] {
  const out: GapBackfillRawCandidate[] = [];
  if (row.status === "dense") {
    return out;
  }

  const surfaces = sortedSurfacesForGap(pools);
  const { problem, method } = resolveAnchors(row.clusterSlug, row.clusterLabel, pools);
  const m = row.missing;

  if (row.status === "thin") {
    let ps = 0;
    for (const s of surfaces) {
      if (ps >= 5) {
        break;
      }
      if (pushProblemSurface(problem, s, rules, existingSlugs, out, masterLookup, onMasterSuppress)) {
        ps += 1;
      }
    }
    let ms = 0;
    for (const s of surfaces) {
      if (ms >= 3) {
        break;
      }
      if (pushMethodSurface(method, s, rules, existingSlugs, out, masterLookup, onMasterSuppress)) {
        ms += 1;
      }
    }
    const label = row.clusterLabel.toLowerCase();
    pushQuestion(`why does ${label} keep coming back after cleaning`, row.clusterSlug, "question_symptom_cause", existingSlugs, out);
    pushQuestion(`how to prevent ${label} from building up again`, row.clusterSlug, "question_prevention_troubleshooting", existingSlugs, out);
    return out;
  }

  if (row.status === "developing") {
    if (!m.hasProblemPages) {
      let n = 0;
      for (const s of surfaces) {
        if (n >= 4) {
          break;
        }
        if (pushProblemSurface(problem, s, rules, existingSlugs, out, masterLookup, onMasterSuppress)) {
          n += 1;
        }
      }
    }
    if (!m.hasMethodPages) {
      let n = 0;
      for (const s of surfaces) {
        if (n >= 3) {
          break;
        }
        if (pushMethodSurface(method, s, rules, existingSlugs, out, masterLookup, onMasterSuppress)) {
          n += 1;
        }
      }
    }
    if (!m.hasSurfaceCoverage) {
      let n = 0;
      for (const s of surfaces) {
        if (n >= 2) {
          break;
        }
        if (pushProblemSurface(problem, s, rules, existingSlugs, out, masterLookup, onMasterSuppress)) {
          n += 1;
        }
      }
    }
    if (!m.hasQuestionPages) {
      const label = row.clusterLabel.toLowerCase();
      pushQuestion(`why ${label} is hard to remove completely`, row.clusterSlug, "question_symptom_cause", existingSlugs, out);
      pushQuestion(`how to maintain surfaces prone to ${label}`, row.clusterSlug, "question_prevention_troubleshooting", existingSlugs, out);
    }
    if (!m.hasComparisonPages) {
      const clusterProblems = pools.problems
        .filter((p) => p.cluster === row.clusterSlug)
        .sort((a, b) => a.slug.localeCompare(b.slug));
      if (clusterProblems.length >= 2) {
        pushComparisonProblems(clusterProblems[0]!, clusterProblems[1]!, row.clusterSlug, existingSlugs, out);
      } else {
        const clusterMethods = pools.methods
          .filter((mth) => mth.cluster === row.clusterSlug)
          .sort((a, b) => a.slug.localeCompare(b.slug));
        if (clusterMethods.length >= 2) {
          const a = clusterMethods[0]!;
          const b = clusterMethods[1]!;
          const slug = `${slugify(a.slug)}-vs-${slugify(b.slug)}`;
          if (!existingSlugs.has(slug)) {
            const title = `${a.title} vs ${b.title}`;
            existingSlugs.add(slug);
            out.push({
              id: makeGapId("CMM", slug),
              slug,
              title,
              category: "methods",
              cluster: row.clusterSlug,
              role: "supporting",
              status: "draft",
              generatedType: "comparison_seed",
              sourceFamily: "comparison_method_method",
              sourceParts: {
                gapBackfill: true,
                leftMethod: { slug: a.slug, title: a.title },
                rightMethod: { slug: b.slug, title: b.title },
              },
            });
          }
        }
      }
    }
  }

  return out;
}

/**
 * Build prioritized gap-backfill candidates from the live corpus + expansion pools.
 * `existingSlugs` should include master-index slugs (and optionally candidate slugs) to avoid duplicates.
 */
export function buildClusterGapBackfillPayload(
  entries: EncyclopediaCorpusEntry[],
  pools: ClusterGapExpansionPools,
  existingSlugs: Set<string>,
  options?: {
    guardRules?: ClusterGapGuardRule[];
    targetClusters?: readonly string[];
    /** When set, problem/method × surface candidates matching master ID or slug are not emitted. */
    masterLookup?: MasterIndexLookup;
  },
): ClusterGapBackfillPayload {
  const generatedAt = new Date().toISOString();
  const report = buildClusterDensityReport(entries, generatedAt);
  const rules = options?.guardRules ?? [];
  const masterLookup = options?.masterLookup;

  const slugSet = new Set(existingSlugs);
  const suppression = { total: 0, byCluster: new Map<string, number>() };

  const targetSet =
    options?.targetClusters && options.targetClusters.length > 0
      ? new Set(options.targetClusters.map((c) => c.trim()).filter(Boolean))
      : null;

  const ordered = [...report.rows]
    .map((row) => ({
      row,
      priority: computeClusterGapPriority(row.status, row.missing),
    }))
    .filter(({ row }) => (targetSet ? targetSet.has(row.clusterSlug) : true))
    .sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.row.clusterSlug.localeCompare(b.row.clusterSlug);
    });

  const all: GapBackfillRawCandidate[] = [];
  const summaries: ClusterGapBackfillClusterSummary[] = [];

  for (const { row, priority } of ordered) {
    if (row.status === "dense") {
      summaries.push({
        clusterSlug: row.clusterSlug,
        clusterLabel: row.clusterLabel,
        status: row.status,
        priority,
        candidatesAdded: 0,
        suppressedByMasterIndex: 0,
      });
      continue;
    }
    const before = all.length;
    const beforeSuppress = suppression.byCluster.get(row.clusterSlug) ?? 0;
    const bumpSuppress = () => {
      suppression.total += 1;
      suppression.byCluster.set(row.clusterSlug, (suppression.byCluster.get(row.clusterSlug) ?? 0) + 1);
    };
    const chunk = generateForRow(row, pools, rules, slugSet, masterLookup, bumpSuppress);
    all.push(...chunk);
    const afterSuppress = suppression.byCluster.get(row.clusterSlug) ?? 0;
    summaries.push({
      clusterSlug: row.clusterSlug,
      clusterLabel: row.clusterLabel,
      status: row.status,
      priority,
      candidatesAdded: all.length - before,
      suppressedByMasterIndex: afterSuppress - beforeSuppress,
    });
  }

  all.sort((a, b) => a.slug.localeCompare(b.slug));

  return {
    generatedAt,
    totalCandidates: all.length,
    masterIndexSuppressedCount: suppression.total,
    clusters: summaries,
    candidates: all,
  };
}
