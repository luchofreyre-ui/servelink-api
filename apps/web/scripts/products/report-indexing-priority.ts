/**
 * Prints priority URLs for manual URL Inspection / indexing in Search Console.
 * Run: npm run report:indexing-priority
 */
import { AUTHORITY_PROBLEM_SLUGS } from "../../src/authority/data/authorityProblemSlugs";
import { AUTHORITY_GUIDE_SLUGS } from "../../src/authority/data/authorityGuideSlugs";
import { AUTHORITY_COMPARISON_SEEDS } from "../../src/authority/data/authorityComparisonSeeds";
import { normalizeComparisonSlug } from "../../src/authority/data/authorityComparisonSelectors";

function pickTop<T>(arr: readonly T[], count: number): T[] {
  return arr.slice(0, count);
}

function comparisonUrl(seed: (typeof AUTHORITY_COMPARISON_SEEDS)[number]): string {
  const slug = normalizeComparisonSlug(seed.leftSlug, seed.rightSlug);
  const seg =
    seed.type === "product_comparison"
      ? "products"
      : seed.type === "method_comparison"
        ? "methods"
        : seed.type === "surface_comparison"
          ? "surfaces"
          : "problems";
  return `/compare/${seg}/${slug}`;
}

console.log("\n=== INDEXING PRIORITY ===\n");

console.log("\nTop Problem Hubs:");
pickTop(AUTHORITY_PROBLEM_SLUGS, 10).forEach((s) => console.log(`/problems/${s}`));

console.log("\nTop Comparison Pages:");
pickTop(AUTHORITY_COMPARISON_SEEDS, 10).forEach((c) => console.log(comparisonUrl(c)));

console.log("\nTop Anti-Pattern Guides:");
pickTop(
  AUTHORITY_GUIDE_SLUGS.filter((s) => s.startsWith("why-")),
  10,
).forEach((s) => console.log(`/guides/${s}`));
