import type { DeepCleanEstimatorFeedbackBucketRowApi } from "@/types/deepCleanInsights";
import type { DeepCleanReasonTagInsightRowDisplay } from "@/mappers/deepCleanInsightsMappers";
import type { DeepCleanProgramTypeInsightRowDisplay } from "@/mappers/deepCleanInsightsMappers";

export function getTopReasonTags(
  rows: DeepCleanReasonTagInsightRowDisplay[],
  count: number,
): DeepCleanReasonTagInsightRowDisplay[] {
  const copy = [...rows];
  copy.sort((a, b) => {
        if (b.reviewedCount !== a.reviewedCount) return b.reviewedCount - a.reviewedCount;
        return a.reasonTag.localeCompare(b.reasonTag);
      });
  return copy.slice(0, Math.max(0, count));
}

export function getTopFeedbackBuckets(
  buckets: DeepCleanEstimatorFeedbackBucketRowApi[],
  count: number,
): DeepCleanEstimatorFeedbackBucketRowApi[] {
  const copy = [...buckets];
  copy.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.bucket.localeCompare(b.bucket);
  });
  return copy.slice(0, Math.max(0, count));
}

/** Higher |variance %| first; tie-break by |minutes|; deterministic. */
export function getProgramTypesByWorstVariance(
  rows: DeepCleanProgramTypeInsightRowDisplay[],
): DeepCleanProgramTypeInsightRowDisplay[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    const ap = Math.abs(a.averageVariancePercent ?? 0);
    const bp = Math.abs(b.averageVariancePercent ?? 0);
    if (bp !== ap) return bp - ap;
    const am = Math.abs(a.averageVarianceMinutes ?? 0);
    const bm = Math.abs(b.averageVarianceMinutes ?? 0);
    if (bm !== am) return bm - am;
    return a.programType.localeCompare(b.programType);
  });
  return copy;
}
