import { describe, expect, it } from "vitest";
import {
  getProgramTypesByWorstVariance,
  getTopFeedbackBuckets,
  getTopReasonTags,
} from "./deepCleanInsightsSelectors";

describe("deepCleanInsightsSelectors", () => {
  it("ranks reason tags by reviewed count", () => {
    const rows = [
      { reasonTag: "a", reasonTagLabel: "A", reviewedCount: 1, averageVarianceMinutes: null, averageVariancePercent: null, averageEstimatedTotalDurationMinutes: null, averageActualTotalDurationMinutes: null },
      { reasonTag: "b", reasonTagLabel: "B", reviewedCount: 5, averageVarianceMinutes: null, averageVariancePercent: null, averageEstimatedTotalDurationMinutes: null, averageActualTotalDurationMinutes: null },
    ];
    const top = getTopReasonTags(rows, 1);
    expect(top[0]?.reasonTag).toBe("b");
  });

  it("ranks feedback buckets by count", () => {
    const rows = [
      { bucket: "other", count: 1 },
      { bucket: "estimator_issue", count: 9 },
    ];
    expect(getTopFeedbackBuckets(rows, 1)[0]?.bucket).toBe("estimator_issue");
  });

  it("orders program types by worst absolute variance percent", () => {
    const rows = [
      {
        programType: "single_visit_deep_clean",
        programTypeLabel: "Single visit",
        reviewedCount: 1,
        usableCount: 1,
        averageVarianceMinutes: 10,
        averageVariancePercent: -40,
      },
      {
        programType: "phased_deep_clean_program",
        programTypeLabel: "Three visit",
        reviewedCount: 1,
        usableCount: 1,
        averageVarianceMinutes: 5,
        averageVariancePercent: 10,
      },
    ];
    const worst = getProgramTypesByWorstVariance(rows);
    expect(worst[0]?.programType).toBe("single_visit_deep_clean");
  });
});
