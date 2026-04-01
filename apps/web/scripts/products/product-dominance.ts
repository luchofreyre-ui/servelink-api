/**
 * Flags SKUs that appear too often in top-N recommendations across many scenarios
 * (vinegar drift, Dawn overreach, specialty cleaners leaking outside their lane).
 *
 * Run (from apps/web): npm run report:product-dominance
 */
import {
  getRecommendedProducts,
  inferRecommendationIntent,
} from "../../src/lib/products/getRecommendedProducts";
import type { ProductCleaningIntent } from "../../src/lib/products/productTypes";
import { PRODUCTS } from "../../src/lib/products/products.seed";

const SCENARIOS: { problem: string; surface: string }[] = [
  { problem: "dust buildup", surface: "granite" },
  { problem: "floor residue", surface: "hardwood floors" },
  { problem: "floor residue", surface: "tile floors" },
  { problem: "floor residue", surface: "vinyl" },
  { problem: "organic stains", surface: "carpet" },
  { problem: "urine", surface: "carpet" },
  { problem: "pet odor", surface: "carpet" },
  { problem: "odor retention", surface: "carpet" },
  { problem: "clog", surface: "drains" },
  { problem: "preventive maintenance", surface: "shower glass" },
  { problem: "limescale", surface: "shower glass" },
  { problem: "grease buildup", surface: "stainless steel" },
  { problem: "cooked-on grease", surface: "stainless steel" },
  { problem: "cooked-on grease", surface: "ovens" },
  { problem: "baked-on grease", surface: "grills" },
  { problem: "bacteria buildup", surface: "countertops" },
  { problem: "disinfection", surface: "countertops" },
  { problem: "soap scum", surface: "tile" },
  { problem: "hard water film", surface: "glass" },
  { problem: "adhesive residue", surface: "plastic" },
  { problem: "streaking", surface: "shower glass" },
  { problem: "mildew stains", surface: "tile" },
  { problem: "food residue", surface: "laminate" },
  { problem: "burnt residue", surface: "stainless steel" },
  { problem: "rust stains", surface: "porcelain" },
  { problem: "mineral deposits", surface: "chrome" },
  { problem: "dust buildup", surface: "sealed wood" },
  { problem: "floor residue", surface: "luxury vinyl" },
  { problem: "bio-organic buildup", surface: "tile" },
  { problem: "disinfection", surface: "laundry" },
  { problem: "laundry disinfection", surface: "laundry" },
  { problem: "laundry odor", surface: "laundry" },
  { problem: "odor retention", surface: "garbage cans" },
  { problem: "grease buildup", surface: "concrete" },
  { problem: "tannin stains", surface: "upholstery" },
  { problem: "dye transfer", surface: "carpet" },
  { problem: "wax buildup", surface: "hardwood floors" },
  { problem: "mold growth", surface: "countertops" },
  { problem: "biofilm", surface: "sinks" },
  { problem: "discoloration", surface: "toilets" },
  { problem: "product residue", surface: "granite" },
  { problem: "oil stains", surface: "concrete" },
  { problem: "sticky residue", surface: "countertops" },
  { problem: "calcium buildup", surface: "glass" },
  { problem: "grease splatter", surface: "tile" },
  { problem: "floor residue", surface: "laminate" },
  { problem: "dullness", surface: "vinyl" },
  { problem: "soap residue", surface: "tile floors" },
  { problem: "grease buildup", surface: "cooktops" },
  { problem: "light dust", surface: "cabinets" },
  { problem: "kitchen grease film", surface: "cooktops" },
  { problem: "greasy film", surface: "range hoods" },
  { problem: "musty odor", surface: "fabrics" },
  { problem: "fingerprints", surface: "stainless steel appliances" },
];

const LIMIT = 3;

function tally(scenarios: typeof SCENARIOS): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { problem, surface } of scenarios) {
    for (const p of getRecommendedProducts({ problem, surface, limit: LIMIT })) {
      counts.set(p.slug, (counts.get(p.slug) ?? 0) + 1);
    }
  }
  return counts;
}

const slugCategory = new Map(PRODUCTS.map((p) => [p.slug, p.category] as const));
const slugChemical = new Map(PRODUCTS.map((p) => [p.slug, p.chemicalClass] as const));
const categoryPopulation = PRODUCTS.reduce<Record<string, number>>((acc, p) => {
  acc[p.category] = (acc[p.category] ?? 0) + 1;
  return acc;
}, {});
const chemistryPopulation = PRODUCTS.reduce<Record<string, number>>((acc, p) => {
  acc[p.chemicalClass] = (acc[p.chemicalClass] ?? 0) + 1;
  return acc;
}, {});

function printSection(title: string, counts: Map<string, number>, n: number) {
  const warnAt = Math.max(6, Math.ceil(n * 0.15));
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`\n--- ${title} (${n} scenarios, warn ≥ ${warnAt}) ---\n`);
  const warnings = ranked.filter(([, c]) => c >= warnAt);
  if (!warnings.length) {
    console.log("(no warnings at threshold)\n");
  } else {
    for (const [slug, c] of warnings) {
      console.log(`  [WARN] ${slug}: ${c}/${n}`);
    }
    console.log("");
  }
  console.log("Top 5:");
  ranked.slice(0, 5).forEach(([slug, c], i) => console.log(`  ${i + 1}. ${slug}: ${c}`));
}

function printNormalizedDominance(title: string, counts: Map<string, number>, n: number) {
  const minRaw = 5;
  const rows = [...counts.entries()]
    .filter(([, c]) => c >= minRaw)
    .map(([slug, c]) => {
      const cat = slugCategory.get(slug) ?? "(unknown category)";
      const chem = slugChemical.get(slug) ?? "(unknown chemistry)";
      const catPop = Math.max(1, categoryPopulation[cat] ?? 1);
      const chemPop = Math.max(1, chemistryPopulation[chem] ?? 1);
      return {
        slug,
        c,
        catRatio: c / catPop,
        chemRatio: c / chemPop,
        cat,
        chem,
      };
    })
    .sort((a, b) => b.catRatio - a.catRatio);
  console.log(`\n--- ${title} (raw ≥ ${minRaw} on ${n} scenarios) ---\n`);
  console.log("Category-normalized (appearances ÷ SKUs in same seed category):");
  rows.slice(0, 12).forEach((r, i) => {
    console.log(
      `  ${i + 1}. ${r.slug}: ${r.c}/${n} raw → ${r.catRatio.toFixed(2)}× vs category (“${r.cat}”, ${categoryPopulation[r.cat] ?? "?"} SKUs)`,
    );
  });
  console.log("\nChemistry-normalized (appearances ÷ SKUs in same seed chemicalClass):");
  const byChem = [...rows].sort((a, b) => b.chemRatio - a.chemRatio);
  byChem.slice(0, 12).forEach((r, i) => {
    console.log(
      `  ${i + 1}. ${r.slug}: ${r.c}/${n} raw → ${r.chemRatio.toFixed(2)}× vs chemistry (${r.chem}, ${chemistryPopulation[r.chem] ?? "?"} SKUs)`,
    );
  });
  console.log("");
}

const n = SCENARIOS.length;
const globalCounts = tally(SCENARIOS);

console.log("\n=== PRODUCT DOMINANCE REPORT ===\n");
console.log(`Grid: ${n} problem/surface pairs × top ${LIMIT} picks (max appearances = ${n}).`);

printSection("Global", globalCounts, n);
printNormalizedDominance("Normalized dominance (global grid)", globalCounts, n);

function printBranchDominance(counts: Map<string, number>, scenariosN: number) {
  const byChem = new Map<string, Map<string, number>>();
  for (const [slug, c] of counts) {
    const chem = slugChemical.get(slug) ?? "unknown";
    if (!byChem.has(chem)) byChem.set(chem, new Map());
    byChem.get(chem)!.set(slug, c);
  }
  console.log(`\n--- Branch dominance (share within chemicalClass, raw grid ${scenariosN} scenarios) ---\n`);
  const minBranchTotal = 8;
  const warnShare = 0.35;
  const rows: { chem: string; slug: string; c: number; total: number; pct: number }[] = [];
  for (const [chem, slugMap] of [...byChem.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const total = [...slugMap.values()].reduce((a, b) => a + b, 0);
    if (total < minBranchTotal) continue;
    const sorted = [...slugMap.entries()].sort((x, y) => y[1] - x[1]);
    const [topSlug, topC] = sorted[0]!;
    const pct = topC / total;
    rows.push({ chem, slug: topSlug, c: topC, total, pct });
  }
  for (const r of rows.sort((a, b) => b.pct - a.pct).slice(0, 14)) {
    const pctLabel = `${(r.pct * 100).toFixed(0)}%`;
    const flag = r.pct >= warnShare ? " [branch-heavy]" : "";
    console.log(
      `  ${r.chem}: ${r.slug} holds ${pctLabel} of branch appearances (${r.c}/${r.total} raw)${flag}`,
    );
  }
  console.log("");
}

printBranchDominance(globalCounts, n);

function printSpecialistBroadLaneIntegrity(scenariosN: number) {
  const lanes: {
    label: string;
    problem: string;
    surface: string;
    specialists: Set<string>;
    broad: Set<string>;
  }[] = [
    {
      label: "Cooktop kitchen grease film",
      problem: "kitchen grease film",
      surface: "cooktops",
      specialists: new Set([
        "weiman-gas-range-cleaner-degreaser",
        "easy-off-kitchen-degreaser",
        "krud-kutter-kitchen-degreaser",
      ]),
      broad: new Set([
        "simple-green-pro-hd",
        "krud-kutter-original-cleaner-degreaser",
        "method-heavy-duty-degreaser",
        "dawn-platinum-dish-spray",
        "simple-green-all-purpose-cleaner",
      ]),
    },
    {
      label: "Range hood greasy film",
      problem: "greasy film",
      surface: "range hoods",
      specialists: new Set([
        "weiman-gas-range-cleaner-degreaser",
        "easy-off-kitchen-degreaser",
        "krud-kutter-kitchen-degreaser",
      ]),
      broad: new Set([
        "simple-green-pro-hd",
        "krud-kutter-original-cleaner-degreaser",
        "method-heavy-duty-degreaser",
        "dawn-platinum-dish-spray",
      ]),
    },
  ];

  console.log(`\n--- Specialist vs broad lane checks (top ${LIMIT}) ---\n`);
  let warns = 0;
  for (const lane of lanes) {
    const rec = getRecommendedProducts({ problem: lane.problem, surface: lane.surface, limit: LIMIT });
    const top = rec[0]?.slug;
    const hasSpec = rec.some((x) => lane.specialists.has(x.slug));
    const broadLeads = Boolean(top && lane.broad.has(top));
    if (broadLeads && !hasSpec) {
      console.log(
        `  [WARN] ${lane.label}: broad leader "${top}" with no cooktop/hood specialist in top ${LIMIT} (${lane.problem} / ${lane.surface})`,
      );
      warns += 1;
    } else {
      console.log(`  [OK] ${lane.label}: top=${top ?? "(empty)"}, specialist_present=${hasSpec}`);
    }
  }

  const fabricMusty = getRecommendedProducts({ problem: "musty odor", surface: "fabrics", limit: LIMIT });
  const refreshSlugs = new Set(["febreze-fabric-refresher-antimicrobial", "odoban-fabric-laundry-spray"]);
  const sanSlugs = new Set(["lysol-laundry-sanitizer", "clorox-laundry-sanitizer"]);
  const fmTop = fabricMusty[0]?.slug;
  const hasRefresh = fabricMusty.some((x) => refreshSlugs.has(x.slug));
  if (fmTop && sanSlugs.has(fmTop) && !hasRefresh) {
    console.log(
      `  [WARN] Musty odor / fabrics: laundry sanitizer "${fmTop}" leads without fabric refresh SKU in top ${LIMIT}`,
    );
    warns += 1;
  } else {
    console.log(`  [OK] Musty odor / fabrics: top=${fmTop ?? "(empty)"}, refresh_present=${hasRefresh}`);
  }

  console.log(
    warns
      ? `\n  Specialist/broad fabric-kitchen warnings: ${warns} (grid size ${scenariosN})\n`
      : `\n  Specialist/broad fabric-kitchen warnings: 0 (grid size ${scenariosN})\n`,
  );
}

printSpecialistBroadLaneIntegrity(n);

const INTENTS: ProductCleaningIntent[] = ["clean", "disinfect", "restore", "remove_residue", "maintain"];
for (const intent of INTENTS) {
  const sub = SCENARIOS.filter(({ problem }) => inferRecommendationIntent(problem) === intent);
  if (sub.length < 3) continue;
  const c = tally(sub);
  printSection(`Intent: ${intent}`, c, sub.length);
}

const surfaces = [...new Set(SCENARIOS.map((s) => s.surface))].sort();
for (const surface of surfaces) {
  const sub = SCENARIOS.filter((s) => s.surface === surface);
  if (sub.length < 2) continue;
  const c = tally(sub);
  const max = Math.max(...c.values(), 0);
  if (max < 2) continue;
  printSection(`Surface: ${surface}`, c, sub.length);
}

const enzymeScenarios = SCENARIOS.filter(({ problem }) =>
  ["urine", "pet odor", "organic stains", "bio-organic buildup", "laundry odor"].includes(
    problem.toLowerCase().trim(),
  ),
);
if (enzymeScenarios.length >= 3) {
  const c = tally(enzymeScenarios);
  printSection("Enzyme-heavy problems (urine/pet/organic/bio/laundry odor)", c, enzymeScenarios.length);
}

console.log("");
