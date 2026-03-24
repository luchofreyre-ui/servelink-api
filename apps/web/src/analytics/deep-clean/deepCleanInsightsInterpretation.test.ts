import { describe, expect, it } from "vitest";
import { buildDeepCleanInsightsFingerprint } from "./deepCleanInsightsInterpretation";

describe("buildDeepCleanInsightsFingerprint", () => {
  it("returns nulls when no reviewed programs", () => {
    const fp = buildDeepCleanInsightsFingerprint({
      summary: {
        totalReviewedPrograms: 0,
        reviewedEstimatorIssuePrograms: 0,
        reviewedOperationalIssuePrograms: 0,
        reviewedScopeIssuePrograms: 0,
        averageReviewedVarianceMinutes: null,
        averageReviewedVariancePercent: null,
      },
      feedbackBuckets: [{ bucket: "estimator_issue", count: 1 }],
      reasonTagRows: [],
      programTypeRows: [],
    });
    expect(fp.dominantIssueBucket).toBeNull();
    expect(fp.topReviewReason).toBeNull();
    expect(fp.worstProgramTypeByVariance).toBeNull();
  });

  it("picks dominant bucket, top tag, and worst program type deterministically", () => {
    const fp = buildDeepCleanInsightsFingerprint({
      summary: {
        totalReviewedPrograms: 5,
        reviewedEstimatorIssuePrograms: 2,
        reviewedOperationalIssuePrograms: 1,
        reviewedScopeIssuePrograms: 0,
        averageReviewedVarianceMinutes: 12,
        averageReviewedVariancePercent: 15,
      },
      feedbackBuckets: [
        { bucket: "estimator_issue", count: 3 },
        { bucket: "operational_issue", count: 2 },
      ],
      reasonTagRows: [
        {
          reasonTag: "underestimation",
          reviewedCount: 4,
          averageVarianceMinutes: 20,
          averageVariancePercent: 25,
          averageEstimatedTotalDurationMinutes: 100,
          averageActualTotalDurationMinutes: 120,
        },
        {
          reasonTag: "other",
          reviewedCount: 1,
          averageVarianceMinutes: 1,
          averageVariancePercent: 1,
          averageEstimatedTotalDurationMinutes: 100,
          averageActualTotalDurationMinutes: 101,
        },
      ],
      programTypeRows: [
        {
          programType: "single_visit_deep_clean",
          reviewedCount: 2,
          usableCount: 2,
          averageVarianceMinutes: 5,
          averageVariancePercent: 5,
        },
        {
          programType: "phased_deep_clean_program",
          reviewedCount: 3,
          usableCount: 3,
          averageVarianceMinutes: 30,
          averageVariancePercent: -50,
        },
      ],
    });
    expect(fp.dominantIssueBucket).toBe("Estimator issue");
    expect(fp.topReviewReason).toBe("Underestimation");
    expect(fp.worstProgramTypeByVariance).toBe("Three visit");
  });
});
