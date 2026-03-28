import { getAllClusterSeeds } from "@/authority/data/authorityClusterSelectors";
import {
  getAllComparisonSeeds,
  normalizeComparisonSlug,
} from "@/authority/data/authorityComparisonSelectors";
import {
  getMethodComboStaticParams,
  getSurfaceProblemStaticParams,
} from "@/authority/data/authorityCombinationBuilder";
import { getAllGuidePages } from "@/authority/data/authorityGuidePageData";
import { getAllMethodPages } from "@/authority/data/authorityMethodPageData";
import { getAllProblemPages } from "@/authority/data/authorityProblemPageData";
import { getAllSurfacePages } from "@/authority/data/authoritySurfacePageData";
import { formatAuthorityComparisonTitle } from "@/authority/data/authorityLabeling";
import {
  getClusterDetailCanonicalPath,
  getComparisonCanonicalPath,
  getGuideDetailCanonicalPath,
  getMethodComboCanonicalPath,
  getMethodDetailCanonicalPath,
  getProblemDetailCanonicalPath,
  getSurfaceDetailCanonicalPath,
  getSurfaceProblemComboCanonicalPath,
} from "@/authority/metadata/authorityCanonicalPaths";
import { buildEncyclopediaHref } from "@/lib/encyclopedia/slug";
import {
  isPipelineFirstCategory,
  LEGACY_AUTHORITY_EXEMPT_SLUGS,
} from "@/lib/encyclopedia/convergenceOwnershipPolicy";
import type { EncyclopediaCategory } from "@/lib/encyclopedia/types";
import {
  getEncyclopediaClusterRollup,
  getEncyclopediaClusterSlugs,
  getResolvedEncyclopediaIndex,
} from "@/lib/encyclopedia/loader";

export type ConvergenceTaxonomyKind =
  | "problems"
  | "methods"
  | "surfaces"
  | "clusters"
  | "guides"
  | "method_combo"
  | "surface_problem_combo"
  | "comparison_methods"
  | "comparison_surfaces"
  | "comparison_problems"
  | EncyclopediaCategory;

export type ConvergenceOverlapType =
  | "exact"
  | "near"
  | "pipeline_only"
  | "legacy_only"
  | "conflict";

export type ConvergenceRecommendedOwner = "pipeline" | "legacy" | "review";

export type ConvergenceTreatment =
  | "keep_for_now"
  | "bridge_to_pipeline"
  | "candidate_redirect_later";

export interface ConvergenceAuditRow {
  topicKey: string;
  taxonomyKind: ConvergenceTaxonomyKind;
  pipelineHref: string | null;
  pipelineTitle: string | null;
  legacyHref: string | null;
  legacyTitle: string | null;
  overlapType: ConvergenceOverlapType;
  recommendedOwner: ConvergenceRecommendedOwner;
  treatment: ConvergenceTreatment;
}

export interface ConvergenceAuditSummary {
  totalRows: number;
  byOverlap: Record<ConvergenceOverlapType, number>;
  pipelineOnlyCount: number;
  legacyOnlyCount: number;
  reviewOrConflictCount: number;
  bridgeToPipelineCandidates: number;
  candidateRedirectLaterCount: number;
  /** Rows where recommendedOwner is review (subset of conflicts). */
  reviewRowsCount: number;
}

export function normalizeTopicTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function titlesRoughlyEqual(a: string, b: string): boolean {
  return normalizeTopicTitle(a) === normalizeTopicTitle(b);
}

/** Pragmatic similarity: equality, substring, or strong token overlap. */
export function titlesSimilar(a: string, b: string): boolean {
  if (titlesRoughlyEqual(a, b)) return true;
  const na = normalizeTopicTitle(a);
  const nb = normalizeTopicTitle(b);
  if (!na.length || !nb.length) return false;
  if (na.includes(nb) || nb.includes(na)) return true;
  const wordsA = new Set(na.split(" ").filter((w) => w.length > 2));
  const wordsB = new Set(nb.split(" ").filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return false;
  let inter = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) inter += 1;
  }
  const union = wordsA.size + wordsB.size - inter;
  return union > 0 && inter / union >= 0.45;
}

function isLegacyExempt(
  kind: "problems" | "methods" | "surfaces" | "clusters",
  slug: string,
): boolean {
  const list = LEGACY_AUTHORITY_EXEMPT_SLUGS[kind];
  return list?.includes(slug) ?? false;
}

function classifyOverlap(
  pipelineTitle: string | null,
  legacyTitle: string | null,
): ConvergenceOverlapType {
  if (!pipelineTitle || !legacyTitle) {
    throw new Error("classifyOverlap requires both titles");
  }
  if (titlesRoughlyEqual(pipelineTitle, legacyTitle)) return "exact";
  if (titlesSimilar(pipelineTitle, legacyTitle)) return "near";
  return "conflict";
}

function recommendForPaired(
  overlap: ConvergenceOverlapType,
  kind: ConvergenceTaxonomyKind,
  legacySlug: string,
): {
  recommendedOwner: ConvergenceRecommendedOwner;
  treatment: ConvergenceTreatment;
} {
  if (
    isPipelineFirstCategory(kind) &&
    isLegacyExempt(kind, legacySlug)
  ) {
    return { recommendedOwner: "legacy", treatment: "keep_for_now" };
  }

  switch (overlap) {
    case "exact":
      return {
        recommendedOwner: "pipeline",
        treatment: "candidate_redirect_later",
      };
    case "near":
      return {
        recommendedOwner: "pipeline",
        treatment: "bridge_to_pipeline",
      };
    case "conflict":
      return { recommendedOwner: "review", treatment: "keep_for_now" };
    default:
      return { recommendedOwner: "pipeline", treatment: "keep_for_now" };
  }
}

function recommendPipelineOnly(_kind: ConvergenceTaxonomyKind): {
  recommendedOwner: ConvergenceRecommendedOwner;
  treatment: ConvergenceTreatment;
} {
  return { recommendedOwner: "pipeline", treatment: "keep_for_now" };
}

function recommendLegacyOnly(
  kind: ConvergenceTaxonomyKind,
): {
  recommendedOwner: ConvergenceRecommendedOwner;
  treatment: ConvergenceTreatment;
} {
  if (kind === "guides" || String(kind).startsWith("comparison_")) {
    return { recommendedOwner: "legacy", treatment: "keep_for_now" };
  }
  if (kind === "method_combo" || kind === "surface_problem_combo") {
    return { recommendedOwner: "legacy", treatment: "keep_for_now" };
  }
  if (isPipelineFirstCategory(kind)) {
    return { recommendedOwner: "pipeline", treatment: "bridge_to_pipeline" };
  }
  return { recommendedOwner: "legacy", treatment: "keep_for_now" };
}

type ComparableSide = {
  href: string;
  title: string;
  slug: string;
  kind: ConvergenceTaxonomyKind;
};

export function getConvergenceAuditRows(): ConvergenceAuditRow[] {
  const pipelinePublished = getResolvedEncyclopediaIndex().filter(
    (e) => e.status === "published" && e.fileExists,
  );

  const pipelineByKey = new Map<string, ComparableSide>();
  for (const e of pipelinePublished) {
    const kind = e.category as ConvergenceTaxonomyKind;
    const key = `${e.category}:${e.slug}`;
    pipelineByKey.set(key, {
      href: buildEncyclopediaHref(e.category, e.slug),
      title: e.title,
      slug: e.slug,
      kind,
    });
  }

  const legacySides: ComparableSide[] = [
    ...getAllProblemPages().map(
      (p): ComparableSide => ({
        href: getProblemDetailCanonicalPath(p.slug),
        title: p.title,
        slug: p.slug,
        kind: "problems",
      }),
    ),
    ...getAllMethodPages().map(
      (p): ComparableSide => ({
        href: getMethodDetailCanonicalPath(p.slug),
        title: p.title,
        slug: p.slug,
        kind: "methods",
      }),
    ),
    ...getAllSurfacePages().map(
      (p): ComparableSide => ({
        href: getSurfaceDetailCanonicalPath(p.slug),
        title: p.title,
        slug: p.slug,
        kind: "surfaces",
      }),
    ),
    ...getAllClusterSeeds().map(
      (s): ComparableSide => ({
        href: getClusterDetailCanonicalPath(s.slug),
        title: s.title,
        slug: s.slug,
        kind: "clusters",
      }),
    ),
    ...getAllGuidePages().map(
      (g): ComparableSide => ({
        href: getGuideDetailCanonicalPath(g.slug),
        title: g.title,
        slug: g.slug,
        kind: "guides",
      }),
    ),
    ...getMethodComboStaticParams().map(
      ({ methodSlug, comboSlug }): ComparableSide => ({
        href: getMethodComboCanonicalPath(methodSlug, comboSlug),
        title: `${methodSlug} / ${comboSlug}`,
        slug: `${methodSlug}__${comboSlug}`,
        kind: "method_combo",
      }),
    ),
    ...getSurfaceProblemStaticParams().map(
      ({ surfaceSlug, problemSlug }): ComparableSide => ({
        href: getSurfaceProblemComboCanonicalPath(surfaceSlug, problemSlug),
        title: `${surfaceSlug} / ${problemSlug}`,
        slug: `${surfaceSlug}__${problemSlug}`,
        kind: "surface_problem_combo",
      }),
    ),
    ...getAllComparisonSeeds().map((seed): ComparableSide => {
      const comparisonSlug = normalizeComparisonSlug(
        seed.leftSlug,
        seed.rightSlug,
      );
      const kind: ConvergenceTaxonomyKind =
        seed.type === "method_comparison" ? "comparison_methods"
        : seed.type === "surface_comparison" ? "comparison_surfaces"
        : "comparison_problems";
      const typeSeg =
        seed.type === "method_comparison" ? "methods"
        : seed.type === "surface_comparison" ? "surfaces"
        : "problems";
      return {
        href: getComparisonCanonicalPath(typeSeg, comparisonSlug),
        title: formatAuthorityComparisonTitle(comparisonSlug),
        slug: comparisonSlug,
        kind,
      };
    }),
  ];

  const legacyByKey = new Map<string, ComparableSide>();
  for (const s of legacySides) {
    legacyByKey.set(`${s.kind}:${s.slug}`, s);
  }

  const pipelineClusterSlugs = new Set(getEncyclopediaClusterSlugs());

  for (const slug of pipelineClusterSlugs) {
    const rollup = getEncyclopediaClusterRollup(slug);
    const title = rollup?.title ?? slug;
    const key = `clusters:${slug}`;
    if (!pipelineByKey.has(key)) {
      pipelineByKey.set(key, {
        href: `/encyclopedia/clusters/${slug}`,
        title,
        slug,
        kind: "clusters",
      });
    }
  }

  const keys = new Set<string>([
    ...pipelineByKey.keys(),
    ...legacyByKey.keys(),
  ]);

  const rows: ConvergenceAuditRow[] = [];

  for (const key of [...keys].sort()) {
    const pipe = pipelineByKey.get(key) ?? null;
    const leg = legacyByKey.get(key) ?? null;

    const colon = key.indexOf(":");
    const taxonomyKind = (
      colon === -1 ? key : key.slice(0, colon)
    ) as ConvergenceTaxonomyKind;

    let overlapType: ConvergenceOverlapType;
    let recommendedOwner: ConvergenceRecommendedOwner;
    let treatment: ConvergenceTreatment;

    if (pipe && leg) {
      overlapType = classifyOverlap(pipe.title, leg.title);
      ({ recommendedOwner, treatment } = recommendForPaired(
        overlapType,
        taxonomyKind,
        leg.slug,
      ));
    } else if (pipe && !leg) {
      overlapType = "pipeline_only";
      ({ recommendedOwner, treatment } = recommendPipelineOnly(taxonomyKind));
    } else {
      overlapType = "legacy_only";
      ({ recommendedOwner, treatment } = recommendLegacyOnly(taxonomyKind));
    }

    rows.push({
      topicKey: key,
      taxonomyKind,
      pipelineHref: pipe?.href ?? null,
      pipelineTitle: pipe?.title ?? null,
      legacyHref: leg?.href ?? null,
      legacyTitle: leg?.title ?? null,
      overlapType,
      recommendedOwner,
      treatment,
    });
  }

  rows.sort((a, b) => a.topicKey.localeCompare(b.topicKey));
  return rows;
}

export function summarizeConvergenceAudit(
  rows: ConvergenceAuditRow[],
): ConvergenceAuditSummary {
  const byOverlap: Record<ConvergenceOverlapType, number> = {
    exact: 0,
    near: 0,
    pipeline_only: 0,
    legacy_only: 0,
    conflict: 0,
  };
  for (const r of rows) {
    byOverlap[r.overlapType] += 1;
  }

  return {
    totalRows: rows.length,
    byOverlap,
    pipelineOnlyCount: rows.filter((r) => r.overlapType === "pipeline_only")
      .length,
    legacyOnlyCount: rows.filter((r) => r.overlapType === "legacy_only")
      .length,
    reviewOrConflictCount: rows.filter((r) => r.overlapType === "conflict")
      .length,
    bridgeToPipelineCandidates: rows.filter(
      (r) => r.treatment === "bridge_to_pipeline",
    ).length,
    candidateRedirectLaterCount: rows.filter(
      (r) => r.treatment === "candidate_redirect_later",
    ).length,
    reviewRowsCount: rows.filter((r) => r.recommendedOwner === "review")
      .length,
  };
}
