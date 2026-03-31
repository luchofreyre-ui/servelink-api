import type { GeneratedIndexCandidate } from "./topicGenerator";

export type EncyclopediaNormalizationAction = "keep" | "review" | "reject";

export type EncyclopediaNormalizationWarningCode =
  | "REDUNDANT_ON_CLEANING"
  | "DOUBLE_PREPOSITION"
  | "COUNTERTOP_SURFACE_MISMATCH"
  | "FLOOR_ONLY_PROBLEM_ON_NON_FLOOR_SURFACE"
  | "SURFACE_NAME_NORMALIZED"
  | "DUPLICATE_SURFACE_SEGMENT"
  | "LOW_CONFIDENCE_REWRITE";

/**
 * Shape written by `generate:encyclopedia-reviewed-index-candidates`.
 * Keeps raw generator fields and adds normalization + reconciled recommendation.
 */
export type EncyclopediaReviewedIndexCandidate = Omit<GeneratedIndexCandidate, "recommendation"> & {
  scorerRecommendation: "promote" | "review" | "reject";
  normalizedTitle: string;
  normalizedSlug: string;
  normalizationWarnings: EncyclopediaNormalizationWarningCode[];
  normalizationAction: EncyclopediaNormalizationAction;
  recommendation: "promote" | "review" | "reject";
  /** Manual triage in review queue; effective recommendation is this ?? recommendation. */
  manualOverrideRecommendation?: "promote" | "review" | "reject";
};
