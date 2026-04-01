import { describe, it, expect } from "vitest";
import type { CanonicalPageSnapshot } from "../encyclopediaPipelineTypes";
import {
  MIN_SECTION_LENGTH,
  REQUIRED_CANONICAL_SECTION_KEYS,
  validateGeneratedSnapshot,
} from "../generationValidator";

function uniqueBodyForKey(key: string, index: number): string {
  const min = MIN_SECTION_LENGTH[key as keyof typeof MIN_SECTION_LENGTH] ?? 100;
  let body = `First independent sentence for ${key} at index ${index} covers soil behavior. Second sentence explains rinse mechanics differently for the same surface. Third sentence adds technician caution about dry-down timing and gloss evaluation.`;
  let wave = 0;
  while (body.length < min) {
    wave += 1;
    body += ` Additional unique wave ${wave} expands ${key} without repeating prior claims.`;
  }
  return body;
}

function validSnapshot(overrides: Partial<CanonicalPageSnapshot> = {}): CanonicalPageSnapshot {
  const sections = REQUIRED_CANONICAL_SECTION_KEYS.map((key, index) => ({
    key,
    title: key,
    content: uniqueBodyForKey(key, index),
  }));
  return {
    title: "Valid Title Example Here",
    slug: "valid-example-slug",
    problem: "Grease buildup on surfaces",
    surface: "Kitchen stovetop",
    intent: "Remove safely",
    riskLevel: "low",
    seo: {
      title: "Valid SEO title example here",
      slug: "valid-seo-title-example-here",
      metaDescription: "Meta description long enough for validation purposes.",
    },
    sections,
    internalLinks: ["related-one", "related-two", "related-three"],
    ...overrides,
  };
}

describe("generation validator", () => {
  it("rejects missing required sections", () => {
    const snapshot: CanonicalPageSnapshot = {
      title: "Test Title Long",
      slug: "test-slug",
      problem: "Problem text here",
      surface: "Surface text",
      intent: "Intent text",
      riskLevel: "low",
      sections: [],
      internalLinks: ["a", "b", "c"],
    };

    const result = validateGeneratedSnapshot(snapshot);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("accepts valid snapshot", () => {
    const result = validateGeneratedSnapshot(validSnapshot());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects weak section bodies", () => {
    const snapshot = validSnapshot({
      sections: REQUIRED_CANONICAL_SECTION_KEYS.map((key) => ({
        key,
        title: key,
        content: "short",
      })),
    });
    const result = validateGeneratedSnapshot(snapshot);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("too short"))).toBe(true);
  });

  it("rejects too few internal links", () => {
    const result = validateGeneratedSnapshot(
      validSnapshot({ internalLinks: ["only-one", "two"] })
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("internal link"))).toBe(true);
  });
});
