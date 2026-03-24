import type { DeepCleanEstimatorFeedbackBucketRowApi } from "@/types/deepCleanInsights";
import type {
  DeepCleanProgramTypeInsightRowDisplay,
  DeepCleanReasonTagInsightRowDisplay,
} from "@/mappers/deepCleanInsightsMappers";

export function buildReasonTagInsightExportRows(
  rows: DeepCleanReasonTagInsightRowDisplay[],
): DeepCleanReasonTagInsightRowDisplay[] {
  return rows.map((r) => ({ ...r }));
}

export function buildProgramTypeInsightExportRows(
  rows: DeepCleanProgramTypeInsightRowDisplay[],
): DeepCleanProgramTypeInsightRowDisplay[] {
  return rows.map((r) => ({ ...r }));
}

export function buildFeedbackBucketExportRows(
  rows: DeepCleanEstimatorFeedbackBucketRowApi[],
): DeepCleanEstimatorFeedbackBucketRowApi[] {
  return rows.map((r) => ({ ...r }));
}
