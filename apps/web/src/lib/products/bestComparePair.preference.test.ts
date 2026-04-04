import { beforeEach, describe, expect, it, vi } from "vitest";

const hasComparePage = vi.hoisted(() => vi.fn());

vi.mock("@/lib/products/compareAvailability", () => ({
  hasComparePage: (...args: unknown[]) => hasComparePage(...args),
}));

vi.mock("@/lib/products/problemComparePreference", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./problemComparePreference")>();
  return {
    ...actual,
    PROBLEM_COMPARE_PREFERENCES: [
      ...actual.PROBLEM_COMPARE_PREFERENCES,
      {
        problemSlug: "test-problem-pref",
        preferredPairs: [["a", "c"]],
      },
    ],
  };
});

import { getBestComparePair } from "./bestComparePair";

describe("getBestComparePair preference override", () => {
  beforeEach(() => {
    hasComparePage.mockReset();
  });

  it("prefers editorial pair when both [0,1] and [0,2] are valid compare pages", () => {
    hasComparePage.mockReturnValue(true);

    const out = getBestComparePair([{ slug: "a" }, { slug: "b" }, { slug: "c" }], {
      problemSlug: "test-problem-pref",
      surface: null,
    });

    expect(out.map((p) => p.slug)).toEqual(["a", "c"]);
  });
});

describe("getBestComparePair surface-specific preferences", () => {
  beforeEach(() => {
    hasComparePage.mockReturnValue(true);
  });

  it("smudge-marks glass picks Windex vs cloth", () => {
    const out = getBestComparePair(
      [
        { slug: "windex-original-glass-cleaner" },
        { slug: "rubbermaid-microfiber-cleaning-cloths" },
        { slug: "method-all-purpose-cleaner" },
      ],
      { problemSlug: "smudge-marks", surface: "glass" },
    );
    expect(out.map((p) => p.slug)).toEqual([
      "windex-original-glass-cleaner",
      "rubbermaid-microfiber-cleaning-cloths",
    ]);
  });

  it("smudge-marks stainless steel picks Method vs cloth", () => {
    const out = getBestComparePair(
      [
        { slug: "method-all-purpose-cleaner" },
        { slug: "rubbermaid-microfiber-cleaning-cloths" },
        { slug: "windex-original-glass-cleaner" },
      ],
      { problemSlug: "smudge-marks", surface: "stainless steel" },
    );
    expect(out.map((p) => p.slug)).toEqual([
      "method-all-purpose-cleaner",
      "rubbermaid-microfiber-cleaning-cloths",
    ]);
  });

  it("limescale-buildup glass vs tile choose different preferred ordering", () => {
    const products = [
      { slug: "zep-calcium-lime-rust-remover" },
      { slug: "clr-calcium-lime-rust" },
      { slug: "method-daily-shower-spray" },
    ];
    const glass = getBestComparePair(products, {
      problemSlug: "limescale-buildup",
      surface: "glass",
    });
    const tile = getBestComparePair(products, {
      problemSlug: "limescale-buildup",
      surface: "tile",
    });
    expect(glass.map((p) => p.slug)).toEqual([
      "clr-calcium-lime-rust",
      "zep-calcium-lime-rust-remover",
    ]);
    expect(tile.map((p) => p.slug)).toEqual([
      "zep-calcium-lime-rust-remover",
      "clr-calcium-lime-rust",
    ]);
  });
});
