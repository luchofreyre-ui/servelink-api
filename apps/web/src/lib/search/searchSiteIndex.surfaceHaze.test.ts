import { describe, it, expect, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  };
});

import { searchUnifiedDocuments } from "./searchSiteIndex";

describe("search stacking - surface haze", () => {
  it('stacks authority problem, compare, then product for "glass haze"', () => {
    const results = searchUnifiedDocuments("glass haze", { limit: 10 });

    expect(results[0]?.href).toBe("/problems/surface-haze");
    expect(results[1]?.href).toMatch(/^\/compare\/products\//);
    expect(results[2]?.href).toBe("/products/invisible-glass-premium-glass-cleaner");
  });
});
