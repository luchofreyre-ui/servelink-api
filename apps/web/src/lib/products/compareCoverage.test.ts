import { describe, expect, it } from "vitest";

import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { hasComparePage } from "@/lib/products/compareAvailability";

describe("comparison coverage (execution-first hubs)", () => {
  const slugs = ["dust-buildup", "surface-haze", "product-residue-buildup"] as const;

  it("each execution-first problem has at least one compare path (best vs heavy)", () => {
    for (const slug of slugs) {
      const data = getProblemPageBySlug(slug);
      expect(data, slug).toBeDefined();

      const products =
        data!.productScenarios?.find((s) => (s.products?.length ?? 0) > 0)?.products ?? [];

      expect(products.length, `${slug}: pinned scenario`).toBeGreaterThanOrEqual(2);
      expect(hasComparePage(products), `${slug}: hasComparePage`).toBe(true);
    }
  });
});
