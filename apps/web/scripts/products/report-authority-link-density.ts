/**
 * Reminder list: problem hubs should stay wired to products, comparisons, and guides.
 * Run: npm run report:authority-link-density
 */
import { AUTHORITY_PROBLEM_SLUGS } from "../../src/authority/data/authorityProblemSlugs";

console.log("\n=== AUTHORITY LINK DENSITY ===\n");

AUTHORITY_PROBLEM_SLUGS.forEach((slug) => {
  console.log(`/problems/${slug} → ensure links to products, comparisons, guides`);
});
