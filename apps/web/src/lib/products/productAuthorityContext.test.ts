import { describe, expect, it } from "vitest";

import { getComparisonOpponentSlug, getProductAuthorityContext } from "./productAuthorityContext";

describe("getProductAuthorityContext", () => {
  it("returns authority-backed context for bona", () => {
    const context = getProductAuthorityContext("bona-hard-surface-floor-cleaner");

    expect(context.problemContext).toBeTruthy();
    expect(context.problemUseChips.length).toBeGreaterThan(0);
    expect(context.problemUseChips.some((chip) => chip.href === "/problems/dust-buildup")).toBe(true);
    expect(context.comparisonSlug).toBeTruthy();
  });

  it("resolves the comparison opponent slug when a pair exists", () => {
    expect(getComparisonOpponentSlug("bona-hard-surface-floor-cleaner")).toBe("zep-neutral-ph-floor-cleaner");
  });

  it("returns empty fallbacks for unknown product", () => {
    const context = getProductAuthorityContext("not-a-real-product");

    expect(context.problemContext).toBeNull();
    expect(context.comparisonSlug).toBeNull();
    expect(context.problemUseChips).toEqual([]);
  });
});
