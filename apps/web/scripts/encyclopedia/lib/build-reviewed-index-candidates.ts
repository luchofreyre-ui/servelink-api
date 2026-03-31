import { buildGeneratedIndexCandidates } from "../../../src/lib/encyclopedia/topicGenerator";
import {
  normalizeIndexCandidate,
  reconcileFinalRecommendation,
} from "@/lib/encyclopedia/normalizeIndexCandidate";

export type ReviewedIndexCandidateRecord = ReturnType<
  typeof buildReviewedIndexCandidatesForExport
>[number];

export function buildReviewedIndexCandidatesForExport() {
  return buildGeneratedIndexCandidates().map((c) => {
    const scorerRecommendation = c.recommendation ?? "review";
    const norm = normalizeIndexCandidate({
      id: c.id,
      title: c.title,
      slug: c.slug,
      category: c.category,
      cluster: c.cluster,
    });
    const recommendation = reconcileFinalRecommendation(scorerRecommendation, norm.normalizationAction);

    const { recommendation: _omitScorerField, ...rest } = c;

    return {
      ...rest,
      scorerRecommendation,
      normalizedTitle: norm.normalizedTitle,
      normalizedSlug: norm.normalizedSlug,
      normalizationWarnings: norm.normalizationWarnings,
      normalizationAction: norm.normalizationAction,
      recommendation,
    };
  });
}
