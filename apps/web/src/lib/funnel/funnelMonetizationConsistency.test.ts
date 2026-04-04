import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react")>();
  return { ...mod, cache: <T>(fn: T) => fn };
});

import { getProductAuthorityContext } from "@/lib/products/productAuthorityContext";
import { searchUnifiedDocuments } from "@/lib/search/searchSiteIndex";

describe("funnel monetization consistency", () => {
  it("Case A — Bona / dust: chips, compare, and search align", () => {
    const ctx = getProductAuthorityContext("bona-hard-surface-floor-cleaner");
    expect(ctx.problemUseChips[0]?.href).toBe("/problems/dust-buildup");
    expect(ctx.comparisonSlug).toBeTruthy();

    const results = searchUnifiedDocuments("dust buildup", { limit: 12 });
    expect(results[0]?.href).toBe("/problems/dust-buildup");
    expect(results[1]?.href).toMatch(/^\/compare\/products\//);
    expect(results[2]?.href).toBe("/products/bona-hard-surface-floor-cleaner");
  });

  it("Case B — CLR / limescale: context, compare, and search align", () => {
    const ctx = getProductAuthorityContext("clr-calcium-lime-rust");
    expect(ctx.problemUseChips.some((c) => c.href === "/problems/limescale-buildup")).toBe(true);
    expect(ctx.comparisonSlug).toBeTruthy();

    const results = searchUnifiedDocuments("scale buildup", { limit: 12 });
    expect(results[0]?.href).toBe("/problems/limescale-buildup");
    expect(results[1]?.href).toMatch(/^\/compare\/products\//);
    expect(results[2]?.href).toBe("/products/clr-calcium-lime-rust");
  });
});
