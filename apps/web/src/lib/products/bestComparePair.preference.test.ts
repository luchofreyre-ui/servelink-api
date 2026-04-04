import { beforeEach, describe, expect, it, vi } from "vitest";

const hasComparePage = vi.hoisted(() => vi.fn());

vi.mock("@/lib/products/compareAvailability", () => ({
  hasComparePage: (...args: unknown[]) => hasComparePage(...args),
}));

vi.mock("@/lib/products/problemComparePreference", () => ({
  PROBLEM_COMPARE_PREFERENCES: [
    {
      problemSlug: "test-problem-pref",
      preferredPairs: [
        ["a", "c"],
      ],
    },
  ],
}));

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
