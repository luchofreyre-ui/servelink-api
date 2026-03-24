import { describe, expect, it } from "vitest";
import {
  classifyVariancePercentDeltaDirection,
  mapEstimatorImpactComparisonApiToDisplay,
  mapEstimatorImpactRowApiToDisplay,
} from "./deepCleanEstimatorImpactMappers";

describe("classifyVariancePercentDeltaDirection", () => {
  it("improved when delta < -1", () => {
    expect(classifyVariancePercentDeltaDirection(-1.01)).toBe("improved");
    expect(classifyVariancePercentDeltaDirection(-10)).toBe("improved");
  });
  it("worsened when delta > 1", () => {
    expect(classifyVariancePercentDeltaDirection(1.01)).toBe("worsened");
    expect(classifyVariancePercentDeltaDirection(4)).toBe("worsened");
  });
  it("flat for null, NaN, and within [-1, 1]", () => {
    expect(classifyVariancePercentDeltaDirection(null)).toBe("flat");
    expect(classifyVariancePercentDeltaDirection(0)).toBe("flat");
    expect(classifyVariancePercentDeltaDirection(-1)).toBe("flat");
    expect(classifyVariancePercentDeltaDirection(1)).toBe("flat");
    expect(classifyVariancePercentDeltaDirection(0.5)).toBe("flat");
  });
});

describe("mapEstimatorImpactRowApiToDisplay", () => {
  it("uses API label when present", () => {
    const d = mapEstimatorImpactRowApiToDisplay({
      estimatorConfigVersion: 3,
      estimatorConfigLabel: "release-3",
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
    });
    expect(d.versionLabel).toBe("release-3");
  });
  it("falls back to v{n} when label missing", () => {
    const d = mapEstimatorImpactRowApiToDisplay({
      estimatorConfigVersion: 2,
      estimatorConfigLabel: null,
      programCount: 1,
      usableProgramCount: 1,
      reviewedProgramCount: 1,
      averageVarianceMinutes: null,
      averageVariancePercent: null,
      underestimationTagCount: 0,
      overestimationTagCount: 0,
      estimatorIssueCount: 0,
      operationalIssueCount: 0,
      scopeIssueCount: 0,
      dataQualityIssueCount: 0,
      mixedIssueCount: 0,
      otherIssueCount: 0,
    });
    expect(d.versionLabel).toBe("v2");
  });
});

describe("mapEstimatorImpactComparisonApiToDisplay", () => {
  it("adds variancePercentDirection", () => {
    const d = mapEstimatorImpactComparisonApiToDisplay({
      baselineVersion: 1,
      comparisonVersion: 2,
      baselineAverageVariancePercent: 10,
      comparisonAverageVariancePercent: 5,
      deltaVariancePercent: -5,
      baselineAverageVarianceMinutes: 1,
      comparisonAverageVarianceMinutes: 2,
      deltaVarianceMinutes: 1,
    });
    expect(d.variancePercentDirection).toBe("improved");
  });
});
