import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getOrderedScenarioProducts } from "@/lib/products/bestProductForContext";
import { getBestComparePair } from "@/lib/products/bestComparePair";
import { hasComparePage } from "@/lib/products/compareAvailability";
import { getProductPurchaseUrl } from "@/lib/products/getProductPurchaseUrl";
import { getProductResearch } from "@/lib/products/getProductResearch";

const MONETIZED_PROBLEM_SLUGS = [
  "dust-buildup",
  "surface-haze",
  "product-residue-buildup",
  "grease-buildup",
  "hard-water-deposits",
  "mold-growth",
  "light-mildew",
  "streaking-on-glass",
  "cloudy-glass",
  "smudge-marks",
  "odor-retention",
  "limescale-buildup",
] as const;

export type FunnelGap = {
  problemSlug: string;
  code:
    | "missing_problem"
    | "missing_scenario_products"
    | "missing_compare"
    | "missing_best_product"
    | "missing_purchase_url"
    | "missing_research";
  detail: string;
};

export function buildFunnelGapReport(): FunnelGap[] {
  const gaps: FunnelGap[] = [];

  for (const problemSlug of MONETIZED_PROBLEM_SLUGS) {
    const page = getProblemPageBySlug(problemSlug);

    if (!page) {
      gaps.push({
        problemSlug,
        code: "missing_problem",
        detail: "Problem page not found.",
      });
      continue;
    }

    const scenario = page.productScenarios?.find((row) => row.products?.length);
    if (!scenario) {
      gaps.push({
        problemSlug,
        code: "missing_scenario_products",
        detail: "No scenario with products found.",
      });
      continue;
    }

    const orderedProducts = getOrderedScenarioProducts(scenario.products ?? [], {
      problemSlug,
      surface: scenario.surface ?? null,
    });

    const bestProduct = orderedProducts[0];
    if (!bestProduct) {
      gaps.push({
        problemSlug,
        code: "missing_best_product",
        detail: "No best product resolved from scenario products.",
      });
      continue;
    }

    const comparePair = getBestComparePair(orderedProducts, {
      problemSlug,
      surface: scenario.surface ?? null,
    });

    if (comparePair.length < 2 || !hasComparePage(comparePair)) {
      gaps.push({
        problemSlug,
        code: "missing_compare",
        detail: "No valid compare pair resolved.",
      });
    }

    if (getProductPurchaseUrl(bestProduct.slug) === "#") {
      gaps.push({
        problemSlug,
        code: "missing_purchase_url",
        detail: `Best product ${bestProduct.slug} has no purchase URL.`,
      });
    }

    if (!getProductResearch(bestProduct.slug)) {
      gaps.push({
        problemSlug,
        code: "missing_research",
        detail: `Best product ${bestProduct.slug} has no research entry.`,
      });
    }
  }

  return gaps;
}
