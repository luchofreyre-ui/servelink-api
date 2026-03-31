import { describe, expect, it } from "vitest";

import { buildIndexEntryFromReviewedCandidate } from "../reviewed-candidate-to-master-entry";

describe("buildIndexEntryFromReviewedCandidate", () => {
  it("uses normalized title and slug when present", () => {
    const { entry, usedRawTitleSlugFallback } = buildIndexEntryFromReviewedCandidate({
      id: "P-TEST",
      title: "Raw Title",
      slug: "raw-slug",
      category: "problems",
      cluster: "c",
      role: "supporting",
      status: "draft",
      generatedType: "problem_surface",
      normalizedTitle: "Normalized Title",
      normalizedSlug: "normalized-slug",
    });
    expect(entry.title).toBe("Normalized Title");
    expect(entry.slug).toBe("normalized-slug");
    expect(usedRawTitleSlugFallback).toBe(false);
  });

  it("falls back to raw title/slug and flags fallback", () => {
    const { entry, usedRawTitleSlugFallback } = buildIndexEntryFromReviewedCandidate({
      id: "P-TEST2",
      title: "Only Raw Title",
      slug: "only-raw-slug",
      category: "problems",
      cluster: "c",
      role: "supporting",
      status: "draft",
      generatedType: "problem_surface",
    });
    expect(entry.title).toBe("Only Raw Title");
    expect(entry.slug).toBe("only-raw-slug");
    expect(usedRawTitleSlugFallback).toBe(true);
  });
});
