import { describe, expect, it } from "vitest";
import { mapDeepCleanAnalyticsRowApiToDisplay } from "@/mappers/deepCleanAnalyticsMappers";
import { buildDeepCleanAnalyticsExportRows } from "./deepCleanAnalyticsExport";

describe("buildDeepCleanAnalyticsExportRows", () => {
  it("produces flat export objects", () => {
    const row = mapDeepCleanAnalyticsRowApiToDisplay({
      bookingId: "bk",
      programId: "pr",
      programType: "phased_deep_clean_program",
      estimatedTotalDurationMinutes: 300,
      actualTotalDurationMinutes: 280,
      durationVarianceMinutes: -20,
      durationVariancePercent: -6.5,
      totalVisits: 3,
      completedVisits: 3,
      isFullyCompleted: true,
      hasAnyOperatorNotes: true,
      usableForCalibrationAnalysis: true,
      reviewStatus: "reviewed" as const,
      reviewedAt: "2025-01-02T00:00:00.000Z",
      reviewReasonTags: ["underestimation"],
      reviewNote: "note",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-03T00:00:00.000Z",
    });
    const [out] = buildDeepCleanAnalyticsExportRows([row]);
    expect(out.bookingId).toBe("bk");
    expect(out.programTypeLabel).toBe("Three visit");
    expect(out.severity).toBe("normal");
    expect(out.hasAnyOperatorNotes).toBe(true);
    expect(out.reviewStatus).toBe("reviewed");
    expect(out.reviewReasonTags).toEqual(["underestimation"]);
  });
});
