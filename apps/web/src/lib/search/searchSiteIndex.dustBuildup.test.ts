import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react")>();
  return {
    ...mod,
    cache: <T>(fn: T) => fn,
  };
});

import { searchUnifiedDocuments } from "./searchSiteIndex";

describe("searchSiteIndex problem-intent stacking", () => {
  it("ranks authority problem, then compare, then top product for dust-buildup query", () => {
    const results = searchUnifiedDocuments("dust buildup", { limit: 24 });

    expect(results[0]?.href).toBe("/problems/dust-buildup");
    expect(results[1]?.href).toMatch(/^\/compare\/products\//);
    expect(results[2]?.href).toBe("/products/bona-hard-surface-floor-cleaner");

    const encyclopediaIndex = results.findIndex(
      (row) => row.href === "/encyclopedia/problems/dust-buildup",
    );
    expect(encyclopediaIndex).toBeGreaterThan(0);
  });
});
