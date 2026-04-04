import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react")>();
  return {
    ...mod,
    cache: <T>(fn: T) => fn,
  };
});

import { searchUnifiedDocuments } from "./searchSiteIndex";

describe("search stacking - streaking on glass", () => {
  it('puts the authority problem first for "glass streaks"', () => {
    const results = searchUnifiedDocuments("glass streaks", { limit: 10 });

    expect(results[0]?.href).toBe("/problems/streaking-on-glass");
  });
});
