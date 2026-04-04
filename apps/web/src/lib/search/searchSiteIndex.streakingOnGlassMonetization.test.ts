import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react")>();
  return { ...mod, cache: <T>(fn: T) => fn };
});

import { searchUnifiedDocuments } from "./searchSiteIndex";

describe("searchSiteIndex streaking-on-glass monetization", () => {
  it("stacks authority problem, compare, then best scenario product", () => {
    const results = searchUnifiedDocuments("glass streaks", { limit: 24 });

    expect(results[0]?.href).toBe("/problems/streaking-on-glass");
    expect(results[1]?.href).toMatch(/^\/compare\/products\//);
    expect(results[2]?.href).toBe("/products/invisible-glass-premium-glass-cleaner");
  });
});
