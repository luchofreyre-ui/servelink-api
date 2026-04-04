import { beforeEach, describe, expect, it, vi } from "vitest";

import { getBestComparePair } from "./bestComparePair";

const hasComparePage = vi.hoisted(() => vi.fn());

vi.mock("@/lib/products/compareAvailability", () => ({
  hasComparePage: (...args: unknown[]) => hasComparePage(...args),
}));

describe("getBestComparePair", () => {
  beforeEach(() => {
    hasComparePage.mockReset();
  });

  it("returns [0,1] when that pair is valid", () => {
    hasComparePage.mockImplementation(
      (pair: { slug: string }[]) => pair[0]?.slug === "a" && pair[1]?.slug === "b",
    );

    const out = getBestComparePair([{ slug: "a" }, { slug: "b" }, { slug: "c" }]);
    expect(out.map((p) => p.slug)).toEqual(["a", "b"]);
  });

  it("returns [0,2] when [0,1] is invalid but [0,2] is valid", () => {
    hasComparePage.mockImplementation((pair: { slug: string }[]) => {
      const k = `${pair[0]?.slug}-${pair[1]?.slug}`;
      return k === "a-c";
    });

    const out = getBestComparePair([{ slug: "a" }, { slug: "b" }, { slug: "c" }]);
    expect(out.map((p) => p.slug)).toEqual(["a", "c"]);
  });

  it("returns [1,2] when only that pair is valid", () => {
    hasComparePage.mockImplementation((pair: { slug: string }[]) => {
      const k = `${pair[0]?.slug}-${pair[1]?.slug}`;
      return k === "b-c";
    });

    const out = getBestComparePair([{ slug: "a" }, { slug: "b" }, { slug: "c" }]);
    expect(out.map((p) => p.slug)).toEqual(["b", "c"]);
  });

  it("returns [] when no candidate pair is valid", () => {
    hasComparePage.mockReturnValue(false);

    expect(getBestComparePair([{ slug: "a" }, { slug: "b" }, { slug: "c" }])).toEqual([]);
  });
});
