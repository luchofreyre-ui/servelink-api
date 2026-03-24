import { describe, expect, it } from "vitest";
import {
  buildFeedbackBucketExportRows,
  buildProgramTypeInsightExportRows,
  buildReasonTagInsightExportRows,
} from "./deepCleanInsightsExport";

describe("deepCleanInsightsExport", () => {
  it("clones reason tag rows for export", () => {
    const rows = [
      {
        reasonTag: "other",
        reasonTagLabel: "Other",
        reviewedCount: 1,
        averageVarianceMinutes: null,
        averageVariancePercent: null,
        averageEstimatedTotalDurationMinutes: null,
        averageActualTotalDurationMinutes: null,
      },
    ];
    const out = buildReasonTagInsightExportRows(rows);
    expect(out).toEqual(rows);
    expect(out[0]).not.toBe(rows[0]);
  });

  it("clones program type rows for export", () => {
    const rows = [
      {
        programType: "single_visit_deep_clean",
        programTypeLabel: "Single visit",
        reviewedCount: 1,
        usableCount: 1,
        averageVarianceMinutes: 1,
        averageVariancePercent: 2,
      },
    ];
    const out = buildProgramTypeInsightExportRows(rows);
    expect(out[0]).not.toBe(rows[0]);
  });

  it("clones feedback bucket rows for export", () => {
    const rows = [{ bucket: "mixed", count: 2 }];
    const out = buildFeedbackBucketExportRows(rows);
    expect(out[0]).not.toBe(rows[0]);
  });
});
