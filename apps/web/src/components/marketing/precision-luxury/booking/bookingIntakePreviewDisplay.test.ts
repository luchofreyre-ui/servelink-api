import { describe, expect, it } from "vitest";
import {
  formatApproximateInHomeDurationMinutes,
  formatEstimateConfidence,
  formatScopePredictabilitySummary,
} from "./bookingIntakePreviewDisplay";

describe("formatApproximateInHomeDurationMinutes", () => {
  it("prefixes About and rounds to nearest 15 minutes", () => {
    expect(formatApproximateInHomeDurationMinutes(92)).toBe("About 1 hr 30 min");
  });

  it("reuses hour-only display when rounded ends on the hour", () => {
    expect(formatApproximateInHomeDurationMinutes(125)).toBe("About 2 hr");
  });
});

describe("formatScopePredictabilitySummary", () => {
  it("uses high band for strong model signals", () => {
    expect(formatScopePredictabilitySummary(0.85)).toBe(
      "High planning clarity (85% detail signal)",
    );
  });

  it("uses moderate band for mid signals", () => {
    expect(formatScopePredictabilitySummary(0.62)).toBe(
      "Moderate planning clarity (62% detail signal)",
    );
  });

  it("uses limited band for low signals", () => {
    expect(formatScopePredictabilitySummary(0.42)).toBe(
      "Limited planning clarity (42% detail signal)",
    );
  });

  it("keeps legacy percent formatter available for any secondary use", () => {
    expect(formatEstimateConfidence(0.85)).toBe("85%");
  });
});
