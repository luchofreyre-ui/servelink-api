import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react")>();
  return { ...mod, cache: <T>(fn: T) => fn };
});

import { searchUnifiedDocuments } from "./searchSiteIndex";

describe("searchSiteIndex odor-retention monetization", () => {
  it("stacks authority problem, compare, then best scenario product", () => {
    const results = searchUnifiedDocuments("lingering odor", { limit: 24 });

    expect(results[0]?.href).toBe("/problems/odor-retention");
    expect(results[1]?.href).toMatch(/^\/compare\/products\//);
    expect(results[2]?.href).toBe("/products/zero-odor-eliminator-spray");
  });
});
