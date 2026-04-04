import { describe, expect, it } from "vitest";

import { deriveComparisonSlug } from "@/app/(public)/products/[slug]/productConversionDerives";

import { getComparisonOpponentSlug, getProductAuthorityContext } from "./productAuthorityContext";

describe("getProductAuthorityContext", () => {
  it("returns authority-backed context for bona", () => {
    const context = getProductAuthorityContext("bona-hard-surface-floor-cleaner");

    expect(context.problemContext).toBeTruthy();
    expect(context.problemUseChips.length).toBeGreaterThan(0);
    expect(context.problemUseChips[0]?.href).toBe("/problems/dust-buildup");
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

  it("deriveComparisonSlug mirrors authority context comparisonSlug (best-pair resolution)", () => {
    const ctx = getProductAuthorityContext("clr-calcium-lime-rust");
    expect(deriveComparisonSlug("clr-calcium-lime-rust")).toBe(ctx.comparisonSlug);
  });
});
