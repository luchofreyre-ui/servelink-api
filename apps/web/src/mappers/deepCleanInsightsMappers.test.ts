import { describe, expect, it } from "vitest";
import {
  mapFeedbackBucketApiToDisplay,
  mapProgramTypeInsightRowApiToDisplay,
  mapReasonTagInsightRowApiToDisplay,
  programTypePersistedToLabel,
  topEstimatorIssueShare,
} from "./deepCleanInsightsMappers";

describe("deepCleanInsightsMappers", () => {
  it("labels program types for display", () => {
    expect(programTypePersistedToLabel("single_visit_deep_clean")).toBe("Single visit");
    expect(programTypePersistedToLabel("phased_deep_clean_program")).toBe("Three visit");
  });

  it("maps reason tag rows with labels", () => {
    const row = mapReasonTagInsightRowApiToDisplay({
      reasonTag: "underestimation",
      reviewedCount: 3,
      averageVarianceMinutes: 10,
      averageVariancePercent: 12,
      averageEstimatedTotalDurationMinutes: 100,
      averageActualTotalDurationMinutes: 110,
    });
    expect(row.reasonTagLabel).toBe("Underestimation");
  });

  it("maps feedback buckets with labels", () => {
    const row = mapFeedbackBucketApiToDisplay({ bucket: "estimator_issue", count: 4 });
    expect(row.bucketLabel).toBe("Estimator issue");
  });

  it("maps program type rows", () => {
    const row = mapProgramTypeInsightRowApiToDisplay({
      programType: "phased_deep_clean_program",
      reviewedCount: 2,
      usableCount: 2,
      averageVarianceMinutes: -5,
      averageVariancePercent: -4,
    });
    expect(row.programTypeLabel).toBe("Three visit");
  });

  it("computes topEstimatorIssueShare", () => {
    expect(
      topEstimatorIssueShare(
        [
          { bucket: "estimator_issue", count: 3 },
          { bucket: "operational_issue", count: 2 },
        ],
        10,
      ),
    ).toBe(0.3);
    expect(topEstimatorIssueShare([], 0)).toBeNull();
  });
});
