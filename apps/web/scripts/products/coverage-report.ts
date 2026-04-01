/**
 * Product library coverage report: chemistry classes, problem clusters,
 * "better alternative" gaps, and over-recommendation signals across a small grid.
 *
 * Run: npm run report:product-coverage
 */
import { PRODUCTS } from "../../src/lib/products/products.seed";
import { getRecommendedProducts } from "../../src/lib/products/getRecommendedProducts";
import { getRelatedProducts } from "../../src/lib/products/productRelated";
import { getPublishedProductBySlug } from "../../src/lib/products/productPublishing";

const PROBLEM_CLUSTERS: Record<string, readonly string[]> = {
  mineral_scale: [
    "limescale",
    "mineral deposits",
    "calcium buildup",
    "hard water stains",
    "hard water film",
    "rust stains",
  ],
  grease_kitchen: ["grease buildup", "oil stains", "food residue", "cooked-on grease", "burnt residue"],
  disinfect: ["bacteria buildup", "mold growth", "biofilm", "mildew stains"],
  glass_clarity: ["streaking", "dust buildup", "product residue"],
  adhesive: ["adhesive residue", "sticky residue", "wax buildup"],
  bathroom_soap: ["soap scum", "soap residue"],
  stain_oxygen: ["tannin stains", "discoloration", "dye transfer", "odor retention"],
  toilet: ["hard water stains", "bacteria buildup", "discoloration"],
};

const SAMPLE_PAIRS: { problem: string; surface: string }[] = [
  { problem: "limescale", surface: "shower glass" },
  { problem: "mineral deposits", surface: "chrome" },
  { problem: "rust stains", surface: "stainless steel" },
  { problem: "grease buildup", surface: "stainless steel" },
  { problem: "food residue", surface: "countertops" },
  { problem: "bacteria buildup", surface: "countertops" },
  { problem: "mold growth", surface: "tile" },
  { problem: "soap scum", surface: "shower glass" },
  { problem: "adhesive residue", surface: "glass" },
  { problem: "streaking", surface: "mirrors" },
  { problem: "tannin stains", surface: "countertops" },
  { problem: "hard water stains", surface: "toilets" },
  { problem: "biofilm", surface: "bathtubs" },
  { problem: "discoloration", surface: "porcelain" },
  { problem: "calcium buildup", surface: "toilets" },
];

function main() {
  const chemClasses = new Set(PRODUCTS.map((p) => p.chemicalClass));
  console.log("=== Chemistry classes represented ===\n");
  console.log([...chemClasses].sort().join(", "));
  console.log(`\nCount: ${chemClasses.size}\n`);

  console.log("=== Problem cluster coverage (products with ≥1 matching problem) ===\n");
  const weak: string[] = [];
  for (const [name, probs] of Object.entries(PROBLEM_CLUSTERS)) {
    const n = PRODUCTS.filter((p) => probs.some((pr) => p.problems.includes(pr))).length;
    console.log(`${name}: ${n} product(s)`);
    if (n < 2) weak.push(`${name} (${n})`);
  }
  if (weak.length) {
    console.log("\nWeak clusters (<2 products):", weak.join("; "));
  }
  console.log("");

  console.log('=== Products with no "better" related pick (empty similar pool edge case) ===\n');
  const noBetter: string[] = [];
  for (const p of PRODUCTS) {
    const snap = getPublishedProductBySlug(p.slug);
    if (!snap) continue;
    const better = getRelatedProducts(snap, { mode: "better", limit: 1 });
    if (better.length === 0) noBetter.push(p.slug);
  }
  console.log(noBetter.length ? noBetter.join("\n") : "(none — catalog always has at least one other SKU)");
  console.log("");

  console.log("=== Over-recommended across sample grid (top-3 appearances) ===\n");
  const counts = new Map<string, number>();
  for (const { problem, surface } of SAMPLE_PAIRS) {
    for (const prod of getRecommendedProducts({ problem, surface, limit: 3 })) {
      counts.set(prod.slug, (counts.get(prod.slug) ?? 0) + 1);
    }
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const threshold = Math.max(4, Math.ceil(SAMPLE_PAIRS.length * 0.35));
  for (const [slug, c] of sorted) {
    const flag = c >= threshold ? " ⚠ frequent on grid" : "";
    console.log(`${slug}: ${c}/${SAMPLE_PAIRS.length}${flag}`);
  }
  console.log(`\n(Frequent threshold ≈ ${threshold} hits on ${SAMPLE_PAIRS.length} pairs)\n`);
}

main();
