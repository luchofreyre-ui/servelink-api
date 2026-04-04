import { describe, it, expect, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  };
});

import { searchUnifiedDocuments } from "./searchSiteIndex";

describe("search stacking - hard water deposits", () => {
  it('puts the authority problem first for "water spots"', () => {
    const results = searchUnifiedDocuments("water spots", { limit: 48 });

    expect(results[0]?.href).toBe("/problems/hard-water-deposits");
    const authorityIndex = results.findIndex((row) => row.href === "/problems/hard-water-deposits");
    expect(authorityIndex).toBe(0);
    const encIdx = results.findIndex(
      (row) =>
        row.href.startsWith("/encyclopedia/problems/") && row.href.includes("hard-water-deposits"),
    );
    if (encIdx >= 0) {
      expect(authorityIndex).toBeLessThan(encIdx);
    }
  });
});
