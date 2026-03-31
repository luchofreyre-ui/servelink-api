import { describe, expect, it } from "vitest";

import { buildReviewedIndexCandidatesForExport } from "../build-reviewed-index-candidates";
import { reconcileFinalRecommendation } from "@/lib/encyclopedia/normalizeIndexCandidate";

describe("buildReviewedIndexCandidatesForExport", () => {
  it("final recommendation always matches scorer + normalization reconciliation", () => {
    const rows = buildReviewedIndexCandidatesForExport();
    for (const r of rows) {
      expect(r.recommendation).toBe(
        reconcileFinalRecommendation(r.scorerRecommendation, r.normalizationAction),
      );
    }
  });

  it("each row includes normalization fields and scorerRecommendation", () => {
    const rows = buildReviewedIndexCandidatesForExport();
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(typeof r.normalizedTitle).toBe("string");
      expect(typeof r.normalizedSlug).toBe("string");
      expect(Array.isArray(r.normalizationWarnings)).toBe(true);
      expect(["keep", "review", "reject"]).toContain(r.normalizationAction);
      expect(["promote", "review", "reject"]).toContain(r.scorerRecommendation);
      expect(["promote", "review", "reject"]).toContain(r.recommendation);
    }
  });
});
