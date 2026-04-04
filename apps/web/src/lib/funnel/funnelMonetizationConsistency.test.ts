import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react")>();
  return { ...mod, cache: <T>(fn: T) => fn };
});

import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { deriveComparisonSlug } from "@/app/(public)/products/[slug]/productConversionDerives";
import { buildCompareProductsHref } from "@/lib/products/compareSlugBuilder";
import { getBestComparePair } from "@/lib/products/bestComparePair";
import { getBestProductForContext, getOrderedScenarioProducts } from "@/lib/products/bestProductForContext";
import { hasComparePage } from "@/lib/products/compareAvailability";
import { getProductAuthorityContext } from "@/lib/products/productAuthorityContext";
import { searchUnifiedDocuments } from "@/lib/search/searchSiteIndex";
import { buildFunnelGapReport } from "@/lib/funnel/funnelGapReport";

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

  it("Case C — injected compare URL matches graph-aware getBestComparePair (limescale preference)", () => {
    const problem = getProblemPageBySlug("limescale-buildup");
    const scenario = problem?.productScenarios?.find((row) => row.products?.length);
    const raw = (scenario?.products ?? []).slice(0, 3);
    const ctx = { problemSlug: "limescale-buildup" as const, surface: scenario?.surface ?? null };
    const ordered = getOrderedScenarioProducts(raw, ctx);
    const pair = getBestComparePair(ordered, ctx);
    const expectedHref = pair.length === 2 ? buildCompareProductsHref(pair) : null;
    expect(expectedHref).toBeTruthy();

    const results = searchUnifiedDocuments("scale buildup", { limit: 12 });
    expect(results[1]?.href).toBe(expectedHref);
  });

  it("Case D — CLR / limescale: best product, compare pair, search product, and chips align", () => {
    const problem = getProblemPageBySlug("limescale-buildup");
    const scenario = problem?.productScenarios?.find((row) => row.products?.length);
    const raw = (scenario?.products ?? []).slice(0, 3);
    const ctx = { problemSlug: "limescale-buildup" as const, surface: scenario?.surface ?? null };
    const ordered = getOrderedScenarioProducts(raw, ctx);

    expect(getBestProductForContext(ordered, ctx)?.slug).toBe("clr-calcium-lime-rust");

    const pair = getBestComparePair(ordered, ctx);
    expect(pair.some((p) => p.slug === "clr-calcium-lime-rust")).toBe(true);

    const results = searchUnifiedDocuments("scale buildup", { limit: 12 });
    expect(results[2]?.href).toBe("/products/clr-calcium-lime-rust");

    const auth = getProductAuthorityContext("clr-calcium-lime-rust");
    expect(auth.problemUseChips.some((c) => c.href === "/problems/limescale-buildup")).toBe(true);
    expect(deriveComparisonSlug("clr-calcium-lime-rust")).toBeTruthy();
  });

  it("Case E — limescale: glass vs tile surface preferences + ordered compare + clean gap report", () => {
    const products = [
      { slug: "zep-calcium-lime-rust-remover" },
      { slug: "clr-calcium-lime-rust" },
      { slug: "method-daily-shower-spray" },
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

    const orderedGlass = getOrderedScenarioProducts(products, {
      problemSlug: "limescale-buildup",
      surface: "glass",
    });
    const orderedTile = getOrderedScenarioProducts(products, {
      problemSlug: "limescale-buildup",
      surface: "tile",
    });
    expect(
      hasComparePage(
        getBestComparePair(orderedGlass, { problemSlug: "limescale-buildup", surface: "glass" }),
      ),
    ).toBe(true);
    expect(
      hasComparePage(
        getBestComparePair(orderedTile, { problemSlug: "limescale-buildup", surface: "tile" }),
      ),
    ).toBe(true);

    expect(buildFunnelGapReport()).toEqual([]);
  });
});
