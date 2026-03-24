import { describe, expect, it } from "vitest";
import type { DeepCleanEstimatorVersionImpactRowDisplay } from "@/mappers/deepCleanEstimatorImpactMappers";
import { mapEstimatorImpactComparisonApiToDisplay } from "@/mappers/deepCleanEstimatorImpactMappers";
import {
  getBestVersionByVariance,
  getDominantUnderOverPattern,
  getLatestVersion,
  getMostRecentComparison,
  getWorstVersionByVariance,
} from "./deepCleanEstimatorImpactSelectors";

function row(partial: Partial<DeepCleanEstimatorVersionImpactRowDisplay>): DeepCleanEstimatorVersionImpactRowDisplay {
  return {
    estimatorConfigVersion: 1,
    estimatorConfigLabel: null,
    programCount: 1,
    usableProgramCount: 1,
    reviewedProgramCount: 1,
    averageVarianceMinutes: 0,
    averageVariancePercent: 0,
    underestimationTagCount: 0,
    overestimationTagCount: 0,
    estimatorIssueCount: 0,
    operationalIssueCount: 0,
    scopeIssueCount: 0,
    dataQualityIssueCount: 0,
    mixedIssueCount: 0,
    otherIssueCount: 0,
    versionLabel: "v1",
    ...partial,
  };
}

describe("getBestVersionByVariance / getWorstVersionByVariance", () => {
  it("picks smallest and largest absolute average variance %", () => {
    const rows = [
      row({ estimatorConfigVersion: 1, averageVariancePercent: -20, versionLabel: "v1" }),
      row({ estimatorConfigVersion: 2, averageVariancePercent: 5, versionLabel: "v2" }),
      row({ estimatorConfigVersion: 3, averageVariancePercent: 10, versionLabel: "v3" }),
    ];
    expect(getBestVersionByVariance(rows)?.estimatorConfigVersion).toBe(2);
    expect(getWorstVersionByVariance(rows)?.estimatorConfigVersion).toBe(1);
  });
});

describe("getLatestVersion", () => {
  it("returns max numeric version", () => {
    const rows = [
      row({ estimatorConfigVersion: 1, versionLabel: "v1" }),
      row({ estimatorConfigVersion: 9, versionLabel: "v9" }),
    ];
    expect(getLatestVersion(rows)?.estimatorConfigVersion).toBe(9);
  });
});

describe("getMostRecentComparison", () => {
  it("returns last comparison in array order", () => {
    const c = [
      mapEstimatorImpactComparisonApiToDisplay({
        baselineVersion: 1,
        comparisonVersion: 2,
        baselineAverageVariancePercent: 1,
        comparisonAverageVariancePercent: 2,
        deltaVariancePercent: 1,
        baselineAverageVarianceMinutes: null,
        comparisonAverageVarianceMinutes: null,
        deltaVarianceMinutes: null,
      }),
      mapEstimatorImpactComparisonApiToDisplay({
        baselineVersion: 2,
        comparisonVersion: 3,
        baselineAverageVariancePercent: 2,
        comparisonAverageVariancePercent: 1,
        deltaVariancePercent: -1,
        baselineAverageVarianceMinutes: null,
        comparisonAverageVarianceMinutes: null,
        deltaVarianceMinutes: null,
      }),
    ];
    const last = getMostRecentComparison(c);
    expect(last?.baselineVersion).toBe(2);
    expect(last?.comparisonVersion).toBe(3);
  });
});

describe("getDominantUnderOverPattern", () => {
  it("detects underestimation majority", () => {
    expect(getDominantUnderOverPattern(row({ underestimationTagCount: 3, overestimationTagCount: 1 }))).toEqual({
      pattern: "underestimation",
      count: 3,
    });
  });
});
