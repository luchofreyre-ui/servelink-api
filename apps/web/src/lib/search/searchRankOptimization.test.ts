import { describe, expect, it, beforeEach } from "vitest";

import {
  recordProductClick,
  resetProductClickDataForTests,
} from "@/lib/products/productClickData";

import type { UserBehaviorData } from "./searchOptimization";
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

  it("applies multi-dimensional behavior scores as a tie-break", () => {
    const products = [
      { slug: "a", name: "A" },
      { slug: "b", name: "B" },
    ] as const;
    const behavior: UserBehaviorData = {
      userSessionId: "s",
      timeSpentSeconds: 200,
      previousClicks: ["a"],
    };
    const out = optimizeSearchRanking([...products], { problemSlug: "dust-buildup" }, behavior);
    expect(out[0]?.slug).toBe("a");
  });
});
