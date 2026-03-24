import type {
  DeepCleanEstimatorFeedbackBucketRowApi,
  DeepCleanInsightsSummaryApi,
  DeepCleanProgramTypeInsightRowApi,
  DeepCleanReasonTagInsightRowApi,
} from "@/types/deepCleanInsights";
import {
  DEEP_CLEAN_INSIGHT_BUCKET_LABELS,
  mapProgramTypeInsightRowApiToDisplay,
  mapReasonTagInsightRowApiToDisplay,
  programTypePersistedToLabel,
} from "@/mappers/deepCleanInsightsMappers";
import {
  getProgramTypesByWorstVariance,
  getTopFeedbackBuckets,
  getTopReasonTags,
} from "./deepCleanInsightsSelectors";

export type DeepCleanInsightsFingerprint = {
  dominantIssueBucket: string | null;
  topReviewReason: string | null;
  worstProgramTypeByVariance: string | null;
};

/**
 * Deterministic, factual summary lines from the current filtered insight payload (no AI).
 */
export function buildDeepCleanInsightsFingerprint(input: {
  summary: DeepCleanInsightsSummaryApi;
  feedbackBuckets: DeepCleanEstimatorFeedbackBucketRowApi[];
  reasonTagRows: DeepCleanReasonTagInsightRowApi[];
  programTypeRows: DeepCleanProgramTypeInsightRowApi[];
}): DeepCleanInsightsFingerprint {
  const { summary, feedbackBuckets, reasonTagRows, programTypeRows } = input;
  if (summary.totalReviewedPrograms <= 0) {
    return {
      dominantIssueBucket: null,
      topReviewReason: null,
      worstProgramTypeByVariance: null,
    };
  }

  const topBuckets = getTopFeedbackBuckets(feedbackBuckets, 1);
  const dom = topBuckets[0];
  const dominantIssueBucket =
    dom && dom.count > 0
      ? DEEP_CLEAN_INSIGHT_BUCKET_LABELS[dom.bucket] ?? dom.bucket
      : null;

  const tagDisplays = reasonTagRows.map(mapReasonTagInsightRowApiToDisplay);
  const topTags = getTopReasonTags(tagDisplays, 1);
  const tr = topTags[0];
  const topReviewReason = tr && tr.reviewedCount > 0 ? tr.reasonTagLabel : null;

  const ptDisplays = programTypeRows.map(mapProgramTypeInsightRowApiToDisplay);
  const worst = getProgramTypesByWorstVariance(ptDisplays).find((p) => p.reviewedCount > 0);
  const worstProgramTypeByVariance = worst
    ? programTypePersistedToLabel(worst.programType)
    : null;

  return {
    dominantIssueBucket,
    topReviewReason,
    worstProgramTypeByVariance,
  };
}
