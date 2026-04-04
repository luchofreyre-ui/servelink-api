import { beforeEach, describe, expect, it, vi } from "vitest";

const getProductPurchaseUrl = vi.hoisted(() => vi.fn());

vi.mock("@/lib/products/getProductPurchaseUrl", () => ({
  getProductPurchaseUrl: (slug: string) => getProductPurchaseUrl(slug),
}));

import { getBestProductForContext, getOrderedScenarioProducts } from "./bestProductForContext";

describe("getBestProductForContext", () => {
  beforeEach(() => {
    getProductPurchaseUrl.mockImplementation((slug: string) =>
      slug === "no-buy" ? "#" : `https://example.com/${slug}`,
    );
  });

  it("prefers editorial order over scenario index when problem matches", () => {
    const products = [
      { slug: "zep-calcium-lime-rust-remover", name: "Zep" },
      { slug: "clr-calcium-lime-rust", name: "CLR" },
      { slug: "method-daily-shower-spray", name: "Method" },
    ];
    const best = getBestProductForContext(products, {
      problemSlug: "limescale-buildup",
      surface: null,
    });
    expect(best?.slug).toBe("clr-calcium-lime-rust");
  });

  it("prefers surface-specific preference over generic problem fallback", () => {
    const products = [
      { slug: "zep-calcium-lime-rust-remover", name: "Zep" },
      { slug: "clr-calcium-lime-rust", name: "CLR" },
      { slug: "method-daily-shower-spray", name: "Method" },
    ];
    expect(
      getBestProductForContext(products, {
        problemSlug: "limescale-buildup",
        surface: "glass",
      })?.slug,
    ).toBe("clr-calcium-lime-rust");
    expect(
      getBestProductForContext(products, {
        problemSlug: "limescale-buildup",
        surface: "tile",
      })?.slug,
    ).toBe("zep-calcium-lime-rust-remover");
  });

  it("falls back to first purchasable SKU when no preference applies", () => {
    const products = [
      { slug: "a", name: "A" },
      { slug: "no-buy", name: "X" },
    ];
    const best = getBestProductForContext(products, { problemSlug: "unknown-problem", surface: null });
    expect(best?.slug).toBe("a");
  });

  it("falls back to first in list when none are purchasable", () => {
    const products = [{ slug: "no-buy", name: "X" }];
    const best = getBestProductForContext(products, { problemSlug: "unknown-problem", surface: null });
    expect(best?.slug).toBe("no-buy");
  });
});

describe("getOrderedScenarioProducts", () => {
  beforeEach(() => {
    getProductPurchaseUrl.mockImplementation(() => "https://example.com/p");
  });

  it("places resolved best first", () => {
    const ordered = getOrderedScenarioProducts(
      [
        { slug: "zep-calcium-lime-rust-remover" },
        { slug: "clr-calcium-lime-rust" },
        { slug: "method-daily-shower-spray" },
      ],
      { problemSlug: "limescale-buildup", surface: null },
    );
    expect(ordered.map((p) => p.slug)).toEqual([
      "clr-calcium-lime-rust",
      "zep-calcium-lime-rust-remover",
      "method-daily-shower-spray",
    ]);
  });
});
