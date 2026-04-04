import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react")>();
  return {
    ...mod,
    cache: <T>(fn: T) => fn,
  };
});

import { searchUnifiedDocuments } from "./searchSiteIndex";

describe("search stacking - limescale buildup", () => {
  it('puts the authority problem first for "scale buildup"', () => {
    const results = searchUnifiedDocuments("scale buildup", { limit: 10 });

    expect(results[0]?.href).toBe("/problems/limescale-buildup");
  });
});
