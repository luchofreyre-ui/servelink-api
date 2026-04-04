import { describe, expect, it } from "vitest";

import { hasComparePage } from "./compareAvailability";

describe("hasComparePage", () => {
  it("returns true when a product_comparison seed exists for the normalized pair", () => {
    expect(
      hasComparePage([
        { slug: "windex-original-glass-cleaner" },
        { slug: "invisible-glass-premium-glass-cleaner" },
      ]),
    ).toBe(true);
  });

  it("returns false when the pair is not in the lattice", () => {
    expect(hasComparePage([{ slug: "nonexistent-a" }, { slug: "nonexistent-b" }])).toBe(false);
  });

  it("returns false with fewer than two products", () => {
    expect(hasComparePage([{ slug: "windex-original-glass-cleaner" }])).toBe(false);
  });
});
