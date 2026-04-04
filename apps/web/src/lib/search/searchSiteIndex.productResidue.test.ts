import { describe, it, expect, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  };
});

import { searchUnifiedDocuments } from "./searchSiteIndex";

describe("search stacking - product residue", () => {
  it('stacks authority problem, compare, then product for "cleaner residue"', () => {
    const results = searchUnifiedDocuments("cleaner residue", { limit: 10 });

    expect(results[0]?.href).toBe("/problems/product-residue-buildup");
    expect(results[1]?.href).toMatch(/^\/compare\/products\//);
    expect(results[2]?.href).toBe("/products/dawn-platinum-dish-spray");
  });
});
