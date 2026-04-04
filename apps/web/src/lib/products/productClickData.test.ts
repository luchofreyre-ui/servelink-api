import { beforeEach, describe, expect, it } from "vitest";

import {
  getProblemChipRankForProduct,
  getProductClickRank,
  recordProductClick,
  resetProductClickDataForTests,
  sortProductsByClickRank,
} from "./productClickData";

describe("productClickData", () => {
  beforeEach(() => {
    resetProductClickDataForTests();
  });

  it("records clicks and ranks products for a problem hub", () => {
    recordProductClick("dust-buildup", "a");
    recordProductClick("dust-buildup", "b");
    recordProductClick("dust-buildup", "b");
    expect(getProductClickRank("dust-buildup")).toEqual(["b", "a"]);
  });

  it("sortProductsByClickRank prefers higher-click SKUs when rank data exists", () => {
    recordProductClick("limescale-buildup", "zep-calcium-lime-rust-remover");
    recordProductClick("limescale-buildup", "zep-calcium-lime-rust-remover");
    recordProductClick("limescale-buildup", "clr-calcium-lime-rust");
    const sorted = sortProductsByClickRank(
      [
        { slug: "clr-calcium-lime-rust", name: "CLR" },
        { slug: "zep-calcium-lime-rust-remover", name: "Zep" },
      ],
      "limescale-buildup",
    );
    expect(sorted.map((p) => p.slug)).toEqual([
      "zep-calcium-lime-rust-remover",
      "clr-calcium-lime-rust",
    ]);
  });

  it("ranks problem chips for a product by click volume", () => {
    recordProductClick("dust-buildup", "bona-hard-surface-floor-cleaner");
    recordProductClick("surface-haze", "bona-hard-surface-floor-cleaner");
    recordProductClick("surface-haze", "bona-hard-surface-floor-cleaner");
    expect(getProblemChipRankForProduct("bona-hard-surface-floor-cleaner")).toEqual([
      "surface-haze",
      "dust-buildup",
    ]);
  });
});
