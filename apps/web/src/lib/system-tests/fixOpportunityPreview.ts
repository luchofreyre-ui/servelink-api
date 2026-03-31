import type {
  SystemTestFixOpportunity,
  SystemTestResolutionPreview,
} from "@/types/systemTestResolution";

/** Maps dashboard fix-opportunity DTOs to the shared resolution preview shape (Phase 10A). */
export function fixOpportunityToResolutionPreview(
  opp: SystemTestFixOpportunity,
): SystemTestResolutionPreview {
  return {
    hasResolution: true,
    category: opp.category,
    confidence: opp.confidence,
    confidenceLabel: opp.confidenceLabel,
    topRecommendationSummary: opp.topRecommendationSummary,
    recommendationCount: opp.topRecommendationSummary ? 1 : 0,
    diagnosisSummary: null,
    highestPriority: opp.highestPriority,
  };
}
