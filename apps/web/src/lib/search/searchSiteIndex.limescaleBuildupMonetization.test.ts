import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react")>();
  return { ...mod, cache: <T>(fn: T) => fn };
});

import { searchUnifiedDocuments } from "./searchSiteIndex";

describe("searchSiteIndex limescale-buildup monetization", () => {
  it("stacks authority problem, compare, then resolver best (not raw scenario index 0)", () => {
    const results = searchUnifiedDocuments("scale buildup", { limit: 24 });

    expect(results[0]?.href).toBe("/problems/limescale-buildup");
    expect(results[1]?.href).toMatch(/^\/compare\/products\//);
    // First scenario lists Zep before CLR; surface-aware preference picks CLR on glass.
    expect(results[2]?.href).toBe("/products/clr-calcium-lime-rust");
  });
});
