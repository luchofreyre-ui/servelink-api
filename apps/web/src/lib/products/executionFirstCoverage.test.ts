import { describe, expect, it } from "vitest";

import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { hasComparePage } from "@/lib/products/compareAvailability";

const slugs = [
  "mold-growth",
  "light-mildew",
  "streaking-on-glass",
  "cloudy-glass",
  "smudge-marks",
  "odor-retention",
  "limescale-buildup",
];

describe("execution-first monetization coverage", () => {
  it("each problem has products and at least one compare path", () => {
    slugs.forEach((slug) => {
      const data = getProblemPageBySlug(slug);
      expect(data, slug).toBeTruthy();

      const scenario = data!.productScenarios?.find((s) => s.products?.length);
      expect(scenario).toBeTruthy();

      const products = scenario?.products || [];
      expect(products.length).toBeGreaterThan(0);

      if (products.length >= 2) {
        expect(hasComparePage(products)).toBe(true);
      }
    });
  });
});
