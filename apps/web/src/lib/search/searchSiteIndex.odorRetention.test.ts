import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react")>();
  return {
    ...mod,
    cache: <T>(fn: T) => fn,
  };
});

import { searchUnifiedDocuments } from "./searchSiteIndex";

describe("search stacking - odor retention", () => {
  it('puts the authority problem first for "lingering odor"', () => {
    const results = searchUnifiedDocuments("lingering odor", { limit: 10 });

    expect(results[0]?.href).toBe("/problems/odor-retention");
  });
});
