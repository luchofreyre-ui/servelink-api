import { describe, expect, it } from "vitest";
import type { DeepCleanAnalyticsRowApi } from "@/types/deepCleanAnalytics";
import {
  mapDeepCleanAnalyticsRowApiToDisplay,
  mapDeepCleanAnalyticsSummaryApiToDisplay,
  programTypeToLabel,
  variancePercentToSeverity,
} from "./deepCleanAnalyticsMappers";

function baseRow(over: Partial<DeepCleanAnalyticsRowApi> = {}): DeepCleanAnalyticsRowApi {
  return {
    bookingId: "bk_1",
    programId: "pr_1",
    programType: "single_visit_deep_clean",
    estimatedTotalDurationMinutes: 120,
    actualTotalDurationMinutes: 150,
    durationVarianceMinutes: 30,
    durationVariancePercent: 25,
    totalVisits: 1,
    completedVisits: 1,
    isFullyCompleted: true,
    hasAnyOperatorNotes: false,
    usableForCalibrationAnalysis: true,
    reviewStatus: "unreviewed",
    reviewedAt: null,
    reviewReasonTags: [],
    reviewNote: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-02T00:00:00.000Z",
    ...over,
  };
}

describe("deepCleanAnalyticsMappers", () => {
  it("maps program type labels", () => {
    expect(programTypeToLabel("single_visit_deep_clean")).toBe("Single visit");
    expect(programTypeToLabel("phased_deep_clean_program")).toBe("Three visit");
    expect(programTypeToLabel("unknown")).toBe("unknown");
  });

  it("classifies severity from variance percent", () => {
    expect(variancePercentToSeverity(null)).toBeNull();
    expect(variancePercentToSeverity(NaN)).toBeNull();
    expect(variancePercentToSeverity(5)).toBe("normal");
    expect(variancePercentToSeverity(-5)).toBe("normal");
    expect(variancePercentToSeverity(10)).toBe("watch");
    expect(variancePercentToSeverity(-10)).toBe("watch");
    expect(variancePercentToSeverity(25)).toBe("high");
    expect(variancePercentToSeverity(-25)).toBe("high");
  });

  it("maps row with severity and label", () => {
    const d = mapDeepCleanAnalyticsRowApiToDisplay(baseRow({ durationVariancePercent: 12 }));
    expect(d.programTypeLabel).toBe("Single visit");
    expect(d.severity).toBe("watch");
  });

  it("maps row with null percent to null severity", () => {
    const d = mapDeepCleanAnalyticsRowApiToDisplay(
      baseRow({ durationVariancePercent: null }),
    );
    expect(d.severity).toBeNull();
  });

  it("sets needsReview false when already reviewed", () => {
    const d = mapDeepCleanAnalyticsRowApiToDisplay(
      baseRow({
        reviewStatus: "reviewed",
        reviewedAt: "2025-01-02T00:00:00.000Z",
        reviewReasonTags: ["underestimation"],
        durationVariancePercent: 99,
      }),
    );
    expect(d.needsReview).toBe(false);
  });

  it("passes summary through display mapper", () => {
    const s = mapDeepCleanAnalyticsSummaryApiToDisplay({
      totalProgramCalibrations: 2,
      usableProgramCalibrations: 1,
      fullyCompletedPrograms: 1,
      programsWithOperatorNotes: 0,
      averageVarianceMinutes: 3.5,
      averageVariancePercent: 4.2,
      averageEstimatedTotalDurationMinutes: 100,
      averageActualTotalDurationMinutes: 110,
    });
    expect(s.totalProgramCalibrations).toBe(2);
    expect(s.averageVarianceMinutes).toBe(3.5);
  });
});
