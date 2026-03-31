import { scoreGeneratedCandidate } from "../../../src/lib/encyclopedia/candidateScoring";
import type { ExpandedRawIndexCandidate } from "./build-expanded-index-candidates";
import type { ExpansionSourceFamily } from "./generation-expansion-config";

const INTENT_PROBLEM_SURFACE_FAMILIES = new Set<ExpansionSourceFamily>([
  "question_why_problem_surface",
  "question_cause_problem_surface",
  "prevention_problem_surface",
  "maintenance_problem_surface",
  "avoid_problem_surface",
]);
import {
  normalizeIndexCandidate,
  reconcileFinalRecommendation,
  type NormalizationWarningCode,
} from "@/lib/encyclopedia/normalizeIndexCandidate";

function resolveScoringFamily(sourceFamily: string): "problem_surface" | "method_surface" | null {
  if (
    sourceFamily === "problem_surface" ||
    sourceFamily === "gap_backfill_problem_surface" ||
    sourceFamily === "problem_surface_severity"
  ) {
    return "problem_surface";
  }

  if (
    sourceFamily === "method_surface" ||
    sourceFamily === "gap_backfill_method_surface" ||
    sourceFamily === "method_surface_severity" ||
    sourceFamily === "method_surface_tool"
  ) {
    return "method_surface";
  }

  return null;
}

export type ExpandedReviewedIndexCandidateRecord = {
  id: string;
  slug: string;
  title: string;
  category: "problems" | "methods";
  cluster: string;
  role: "supporting";
  status: "draft";
  generatedType: string;
  sourceFamily: ExpansionSourceFamily;
  sourceParts: Record<string, unknown>;
  seedWarnings?: string[];
  cleanedTitle?: string;
  cleanedSlug?: string;
  qualityScore?: number;
  qualityFlags?: string[];
  scorerRecommendation: "promote" | "review" | "reject";
  normalizedTitle: string;
  normalizedSlug: string;
  normalizationWarnings: NormalizationWarningCode[];
  normalizationAction: "keep" | "review" | "reject";
  recommendation: "promote" | "review" | "reject";
};

export type ExpandedIndexCandidatesFile = {
  generatedAt?: string;
  total?: number;
  excludedCount?: number;
  flaggedCount?: number;
  countsByFamily?: Record<string, number>;
  candidates: ExpandedRawIndexCandidate[];
};

export function parseExpandedIndexCandidatesFile(raw: unknown): ExpandedIndexCandidatesFile {
  if (!raw || typeof raw !== "object") {
    throw new Error("Expanded candidates file must be a JSON object.");
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.candidates)) {
    throw new Error("Expanded candidates file must contain a candidates array.");
  }
  return {
    generatedAt: typeof obj.generatedAt === "string" ? obj.generatedAt : undefined,
    total: typeof obj.total === "number" ? obj.total : undefined,
    excludedCount: typeof obj.excludedCount === "number" ? obj.excludedCount : undefined,
    flaggedCount: typeof obj.flaggedCount === "number" ? obj.flaggedCount : undefined,
    countsByFamily: obj.countsByFamily as Record<string, number> | undefined,
    candidates: obj.candidates as ExpandedRawIndexCandidate[],
  };
}

function scorerPayloadForExpanded(c: ExpandedRawIndexCandidate): {
  scorerRecommendation: "promote" | "review" | "reject";
  qualityScore?: number;
  qualityFlags?: string[];
  cleanedTitle?: string;
  cleanedSlug?: string;
} {
  if (INTENT_PROBLEM_SURFACE_FAMILIES.has(c.sourceFamily)) {
    return {
      scorerRecommendation: "review",
    };
  }

  const scoringFamily = resolveScoringFamily(c.sourceFamily);

  if (scoringFamily) {
    const score = scoreGeneratedCandidate({
      title: c.title,
      slug: c.slug,
      generatedType: scoringFamily,
    });

    return {
      scorerRecommendation: score.recommendation,
      qualityScore: score.score,
      qualityFlags: score.flags,
      cleanedTitle: c.title,
      cleanedSlug: c.slug,
    };
  }

  return {
    scorerRecommendation: "review",
  };
}

/**
 * Map one expanded raw row into the reviewed-candidate shape (normalization + reconciliation).
 * Seed families (comparisons, questions): scorer is forced to review (Option A).
 */
export function mapExpandedCandidateToReviewed(c: ExpandedRawIndexCandidate): ExpandedReviewedIndexCandidateRecord {
  const scorer = scorerPayloadForExpanded(c);
  const norm = normalizeIndexCandidate({
    id: c.id,
    title: c.title,
    slug: c.slug,
    category: c.category,
    cluster: c.cluster,
  });
  const recommendation = reconcileFinalRecommendation(scorer.scorerRecommendation, norm.normalizationAction);

  const row: ExpandedReviewedIndexCandidateRecord = {
    id: c.id,
    slug: c.slug,
    title: c.title,
    category: c.category,
    cluster: c.cluster,
    role: c.role,
    status: c.status,
    generatedType: c.generatedType,
    sourceFamily: c.sourceFamily,
    sourceParts: c.sourceParts,
    scorerRecommendation: scorer.scorerRecommendation,
    normalizedTitle: norm.normalizedTitle,
    normalizedSlug: norm.normalizedSlug,
    normalizationWarnings: norm.normalizationWarnings,
    normalizationAction: norm.normalizationAction,
    recommendation,
  };

  if (c.seedWarnings?.length) {
    row.seedWarnings = c.seedWarnings;
  }
  if (scorer.cleanedTitle !== undefined) {
    row.cleanedTitle = scorer.cleanedTitle;
    row.cleanedSlug = scorer.cleanedSlug;
  }
  if (scorer.qualityScore !== undefined) {
    row.qualityScore = scorer.qualityScore;
    row.qualityFlags = scorer.qualityFlags;
  }

  return row;
}

export function buildExpandedReviewedIndexCandidatesForExport(
  candidates: ExpandedRawIndexCandidate[],
): ExpandedReviewedIndexCandidateRecord[] {
  return candidates.map(mapExpandedCandidateToReviewed).sort((a, b) => a.slug.localeCompare(b.slug));
}
