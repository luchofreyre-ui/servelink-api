import { describe, expect, it } from "vitest";
import {
  buildEstimatorImpactComparisonExportRows,
  buildEstimatorImpactVersionExportRows,
} from "./deepCleanEstimatorImpactExport";

describe("deepCleanEstimatorImpactExport", () => {
  it("builds version export rows", () => {
    const { headers, rows } = buildEstimatorImpactVersionExportRows([
      {
        estimatorConfigVersion: 2,
        estimatorConfigLabel: "L",
        programCount: 3,
        usableProgramCount: 2,
        reviewedProgramCount: 1,
        averageVarianceMinutes: 1.5,
        averageVariancePercent: 2,
        underestimationTagCount: 0,
        overestimationTagCount: 1,
        estimatorIssueCount: 0,
        operationalIssueCount: 0,
        scopeIssueCount: 0,
        dataQualityIssueCount: 0,
        mixedIssueCount: 0,
        otherIssueCount: 0,
      },
    ]);
    expect(headers[0]).toBe("estimatorConfigVersion");
    expect(rows[0]?.[0]).toBe("2");
    expect(rows[0]?.[1]).toBe("L");
  });

  it("builds comparison export rows", () => {
    const { headers, rows } = buildEstimatorImpactComparisonExportRows([
      {
        baselineVersion: 1,
        comparisonVersion: 2,
        baselineAverageVariancePercent: 10,
        comparisonAverageVariancePercent: 8,
        deltaVariancePercent: -2,
        baselineAverageVarianceMinutes: 5,
        comparisonAverageVarianceMinutes: 4,
        deltaVarianceMinutes: -1,
      },
    ]);
    expect(headers).toContain("deltaVariancePercent");
    expect(rows[0]?.[4]).toBe("-2");
  });
});
