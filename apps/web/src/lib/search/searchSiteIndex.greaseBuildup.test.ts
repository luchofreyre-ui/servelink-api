import { describe, it, expect, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  };
});

import { searchUnifiedDocuments } from "./searchSiteIndex";

describe("search stacking - grease buildup", () => {
  it('puts the authority problem first for "kitchen grease"', () => {
    const results = searchUnifiedDocuments("kitchen grease", { limit: 10 });

    expect(results[0]?.href).toBe("/problems/grease-buildup");
    expect(results[1]?.href).toMatch(/^\/compare\/products\//);
    expect(results[2]?.href).toMatch(/^\/products\//);
  });
});
