import { describe, it, expect } from "vitest";
import {
  MIN_SECTION_LENGTH,
  REQUIRED_CANONICAL_SECTION_KEYS,
} from "../generationValidator";
import { buildReviewImportPayloadFromReviewedCorpus } from "../reviewImportExporter";

const validSnapshot = {
  slug: "how-to-clean-glass-shower-doors",
  title: "How to Clean Glass Shower Doors",
  problem: "hard water stains",
  surface: "glass shower doors",
  intent: "how-clean",
  riskLevel: "low" as const,
  sections: REQUIRED_CANONICAL_SECTION_KEYS.map((key, index) => ({
    key,
    title: key,
    content: "x".repeat(MIN_SECTION_LENGTH[key] + index),
  })),
  internalLinks: [
    "remove-hard-water-stains",
    "clean-shower-glass",
    "diagnose-etching-on-glass",
  ],
};

describe("review import exporter", () => {
  it("maps reviewed corpus entries into API import payload shape", () => {
    const result = buildReviewImportPayloadFromReviewedCorpus([
      {
        slug: validSnapshot.slug,
        title: validSnapshot.title,
        recommendation: "promote",
        canonicalSnapshot: validSnapshot,
      },
      {
        slug: "should-be-rejected",
        title: "Should Be Rejected",
        recommendation: "reject",
        canonicalSnapshot: {
          ...validSnapshot,
          slug: "should-be-rejected",
          title: "Should Be Rejected",
        },
      },
    ]);

    expect(result).toHaveLength(2);

    expect(result[0]).toMatchObject({
      slug: validSnapshot.slug,
      title: validSnapshot.title,
      reviewStatus: "approved",
      publishStatus: "draft",
    });

    expect(result[1]).toMatchObject({
      slug: "should-be-rejected",
      reviewStatus: "rejected",
      publishStatus: "draft",
    });
  });

  it("dedupes by slug using the last occurrence", () => {
    const result = buildReviewImportPayloadFromReviewedCorpus([
      {
        slug: validSnapshot.slug,
        title: "Old Title",
        recommendation: "review",
        canonicalSnapshot: {
          ...validSnapshot,
          title: "Old Title",
        },
      },
      {
        slug: validSnapshot.slug,
        title: "New Title",
        recommendation: "promote",
        canonicalSnapshot: {
          ...validSnapshot,
          title: "New Title",
        },
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("New Title");
    expect(result[0].reviewStatus).toBe("approved");
  });

  it("reads content-batches review-store shape (records + canonicalContent)", () => {
    const result = buildReviewImportPayloadFromReviewedCorpus({
      records: [
        {
          slug: validSnapshot.slug,
          reviewStatus: "approved",
          canonicalContent: validSnapshot,
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      slug: validSnapshot.slug,
      title: validSnapshot.title,
      reviewStatus: "approved",
      publishStatus: "draft",
    });
    expect(result[0].canonicalSnapshot).toEqual(validSnapshot);
  });
});
