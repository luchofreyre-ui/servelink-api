import { analyzeSystemTestHistory } from "@/lib/systemTests/analyzeSystemTestHistory";
import { normalizeSystemTestRunDetail, trendVsPrevious } from "@/lib/systemTests/normalizeSystemTestRun";
import type {
  SystemTestHistoricalAnalysis,
  SystemTestReportPayload,
  SystemTestRunComparison,
  SystemTestRunDetailResponse,
  SystemTestRunSummary,
} from "@/types/systemTests";

export type BuildSystemTestReportPayloadInput = {
  currentDetailResponse: SystemTestRunDetailResponse;
  previousRunSummary?: SystemTestRunSummary | null;
  /** Prior run detail responses (any order); analyze layer sorts by hardened chronology. */
  priorDetailResponses?: SystemTestRunDetailResponse[];
  /** When already computed (e.g. on a page), avoids re-running history analysis. */
  historicalAnalysis?: SystemTestHistoricalAnalysis | null;
  comparison?: SystemTestRunComparison | null;
};

/**
 * Single entry point for normalized report inputs (clipboard today, scheduled digests later).
 * Does not fetch; callers supply API responses they already loaded.
 */
export function buildSystemTestReportPayload(input: BuildSystemTestReportPayloadInput): SystemTestReportPayload {
  const run = normalizeSystemTestRunDetail(input.currentDetailResponse);
  const previousRun = input.previousRunSummary ?? null;
  const trendVsPreviousVal = trendVsPrevious(run.summary, previousRun);

  let historicalAnalysis: SystemTestHistoricalAnalysis | null = input.historicalAnalysis ?? null;
  if (!historicalAnalysis && input.priorDetailResponses?.length) {
    historicalAnalysis = analyzeSystemTestHistory(input.currentDetailResponse, input.priorDetailResponses);
  }

  return {
    run,
    previousRun,
    trendVsPrevious: trendVsPreviousVal,
    comparison: input.comparison ?? null,
    historicalAnalysis,
  };
}
