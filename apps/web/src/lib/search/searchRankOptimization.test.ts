import { describe, expect, it, beforeEach } from "vitest";

import {
  recordProductClick,
  resetProductClickDataForTests,
} from "@/lib/products/productClickData";

import { optimizeSearchRanking } from "./searchRankOptimization";

describe("optimizeSearchRanking", () => {
  beforeEach(() => {
    resetProductClickDataForTests();
  });

  it("returns the same length as input (after editorial ordering)", () => {
    const products = [
      { slug: "alpha", name: "Alpha" },
      { slug: "beta", name: "Beta" },
    ];
    const out = optimizeSearchRanking(products, { problemSlug: "dust-buildup" });
    expect(out).toHaveLength(2);
  });

  it("ranks higher-click products ahead for the same problem hub", () => {
    const products = [
      { slug: "a", name: "A" },
      { slug: "b", name: "B" },
    ] as const;
    recordProductClick("dust-buildup", "b");
    recordProductClick("dust-buildup", "b");
    const out = optimizeSearchRanking([...products], { problemSlug: "dust-buildup" });
    expect(out[0]?.slug).toBe("b");
  });
});
