import { describe, expect, it } from "vitest";
import {
  formatEstimateConfidence,
  formatScopePredictabilitySummary,
} from "./bookingIntakePreviewDisplay";

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
