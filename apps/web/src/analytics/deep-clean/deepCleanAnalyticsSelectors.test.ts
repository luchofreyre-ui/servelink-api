import { describe, expect, it } from "vitest";
import type { DeepCleanAnalyticsRowDisplay } from "@/mappers/deepCleanAnalyticsMappers";
import { mapDeepCleanAnalyticsRowApiToDisplay } from "@/mappers/deepCleanAnalyticsMappers";
import type { DeepCleanAnalyticsRowApi } from "@/types/deepCleanAnalytics";
import {
  getHighestOverrunRows,
  getHighestUnderrunRows,
  getReviewedRows,
  getRowsNeedingReview,
  getUnreviewedRowsNeedingReview,
  rowNeedsReview,
} from "./deepCleanAnalyticsSelectors";

function disp(over: Partial<DeepCleanAnalyticsRowApi>): DeepCleanAnalyticsRowDisplay {
  return mapDeepCleanAnalyticsRowApiToDisplay({
    bookingId: "b",
    programId: "p",
    programType: "single_visit_deep_clean",
    estimatedTotalDurationMinutes: 60,
    actualTotalDurationMinutes: 60,
    durationVarianceMinutes: 0,
    durationVariancePercent: 0,
    totalVisits: 1,
    completedVisits: 1,
    isFullyCompleted: true,
    hasAnyOperatorNotes: false,
    usableForCalibrationAnalysis: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...over,
  });
}

describe("deepCleanAnalyticsSelectors", () => {
  it("getHighestOverrunRows orders positive variance descending", () => {
    const rows = [
      disp({ bookingId: "a", durationVarianceMinutes: 10 }),
      disp({ bookingId: "b", durationVarianceMinutes: 50 }),
      disp({ bookingId: "c", durationVarianceMinutes: null }),
      disp({ bookingId: "d", durationVarianceMinutes: -5 }),
    ];
    const top = getHighestOverrunRows(rows, 2);
    expect(top.map((r) => r.bookingId)).toEqual(["b", "a"]);
  });

  it("getHighestUnderrunRows orders negative variance ascending (most negative first)", () => {
    const rows = [
      disp({ bookingId: "a", durationVarianceMinutes: -5 }),
      disp({ bookingId: "b", durationVarianceMinutes: -40 }),
      disp({ bookingId: "c", durationVarianceMinutes: 20 }),
    ];
    const top = getHighestUnderrunRows(rows, 2);
    expect(top.map((r) => r.bookingId)).toEqual(["b", "a"]);
  });

  it("rowNeedsReview matches deterministic rules", () => {
    expect(
      rowNeedsReview(
        disp({
          isFullyCompleted: true,
          usableForCalibrationAnalysis: false,
          hasAnyOperatorNotes: false,
          durationVariancePercent: 0,
        }),
      ),
    ).toBe(true);
    expect(
      rowNeedsReview(
        disp({
          hasAnyOperatorNotes: true,
          durationVariancePercent: 0,
        }),
      ),
    ).toBe(true);
    expect(
      rowNeedsReview(
        disp({
          durationVariancePercent: 26,
        }),
      ),
    ).toBe(true);
    expect(
      rowNeedsReview(
        disp({
          durationVariancePercent: -26,
        }),
      ),
    ).toBe(true);
    expect(
      rowNeedsReview(
        disp({
          durationVariancePercent: 24,
          hasAnyOperatorNotes: false,
          isFullyCompleted: false,
        }),
      ),
    ).toBe(false);
  });

  it("getUnreviewedRowsNeedingReview excludes reviewed rows", () => {
    const rows = [
      disp({ bookingId: "u", durationVariancePercent: 30 }),
      disp({
        bookingId: "r",
        reviewStatus: "reviewed",
        reviewReasonTags: ["other"],
        durationVariancePercent: 30,
      }),
    ];
    const q = getUnreviewedRowsNeedingReview(rows);
    expect(q.map((x) => x.bookingId)).toEqual(["u"]);
  });

  it("getReviewedRows filters by status", () => {
    const rows = [
      disp({ bookingId: "a", reviewStatus: "unreviewed" }),
      disp({
        bookingId: "b",
        reviewStatus: "reviewed",
        reviewReasonTags: ["other"],
      }),
    ];
    expect(getReviewedRows(rows).map((x) => x.bookingId)).toEqual(["b"]);
  });

  it("getRowsNeedingReview dedupes by booking id", () => {
    const rows = [
      disp({
        bookingId: "same",
        hasAnyOperatorNotes: true,
        durationVariancePercent: 30,
      }),
    ];
    expect(getRowsNeedingReview(rows)).toHaveLength(1);
  });
});
