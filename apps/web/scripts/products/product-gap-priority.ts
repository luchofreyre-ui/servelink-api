/**
 * Data-driven expansion hints: weak taxonomy tags and shallow (≤2 SKU) branches only.
 *
 * Run (from apps/web): npm run report:product-gap-priority
 */
import { PRODUCTS } from "../../src/lib/products/products.seed";

type CountMap = Record<string, number>;

function countBy(arr: string[]): CountMap {
  return arr.reduce<CountMap>((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

const surfaceCounts = countBy(PRODUCTS.flatMap((p) => p.surfaces));

const problemCounts = countBy(PRODUCTS.flatMap((p) => p.problems));

const intentCounts = countBy(PRODUCTS.map((p) => p.intent));

const chemCounts = countBy(PRODUCTS.map((p) => p.chemicalClass));

const surfaceProblemIntentCounts = new Map<string, number>();
for (const p of PRODUCTS) {
  for (const surf of p.surfaces) {
    for (const prob of p.problems) {
      const k = `${surf} + ${prob} + intent:${p.intent}`;
      surfaceProblemIntentCounts.set(k, (surfaceProblemIntentCounts.get(k) ?? 0) + 1);
    }
  }
}

console.log("\n=== GAP PRIORITY REPORT ===\n");

console.log("Weakest surfaces (fewest products listing compatibility):");
Object.entries(surfaceCounts)
  .sort((a, b) => a[1] - b[1])
  .slice(0, 5)
  .forEach(([k, v]) => console.log(`  ${k}: ${v}`));

console.log("\nWeakest problems (fewest products listing compatibility):");
Object.entries(problemCounts)
  .sort((a, b) => a[1] - b[1])
  .slice(0, 5)
  .forEach(([k, v]) => console.log(`  ${k}: ${v}`));

console.log("\nWeakest intents (fewest SKUs in that intent bucket):");
Object.entries(intentCounts)
  .sort((a, b) => a[1] - b[1])
  .forEach(([k, v]) => console.log(`  ${k}: ${v}`));

const shallowTriples = [...surfaceProblemIntentCounts.entries()]
  .filter(([, v]) => v <= 2)
  .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
if (shallowTriples.length) {
  console.log(
    `\nShallow branches — surface + problem + intent (≤2 SKUs claim this triple):\n${shallowTriples
      .slice(0, 60)
      .map(([k, v]) => `  (${v} SKU${v === 1 ? "" : "s"}) ${k}`)
      .join("\n")}${shallowTriples.length > 60 ? `\n  … +${shallowTriples.length - 60} more` : ""}`,
  );
} else {
  console.log("\nShallow branches (surface + problem + intent, ≤2 SKUs): (none)");
}

const shallowChem = Object.entries(chemCounts)
  .filter(([, v]) => v <= 2)
  .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
console.log(
  shallowChem.length
    ? `\nShallow chemistry branches (≤2 SKUs in chemicalClass):\n${shallowChem
        .map(([k, v]) => `  (${v} SKU${v === 1 ? "" : "s"}) ${k}`)
        .join("\n")}`
    : "\nShallow chemistry branches (≤2 SKUs): (none)",
);

const maintainSku = PRODUCTS.filter((p) => p.intent === "maintain").length;
const disinfectSku = PRODUCTS.filter((p) => p.intent === "disinfect").length;
const fabricListed = PRODUCTS.filter((p) =>
  p.surfaces.some((x) => {
    const u = x.toLowerCase();
    return u === "fabric" || u === "fabrics" || u === "laundry" || u === "bedding" || u === "towels";
  }),
).length;
const mustyListed = PRODUCTS.filter((p) => p.problems.some((x) => x.toLowerCase() === "musty odor")).length;
console.log(
  `\nSub-branch counts: maintain intent SKUs=${maintainSku}, disinfect intent SKUs=${disinfectSku}, products listing fabric/laundry/bedding/towels=${fabricListed}, products listing musty odor=${mustyListed}`,
);

console.log("");
