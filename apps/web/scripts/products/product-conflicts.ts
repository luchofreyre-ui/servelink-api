/**
 * System integrity checks with leveled output (error / warning / info).
 * Info-level rows are collected but not printed—reduces noise vs actionable signal.
 *
 * Run: npm run report:product-conflicts
 */
import { PRODUCTS } from "../../src/lib/products/products.seed";
import { getRecommendedProducts } from "../../src/lib/products/getRecommendedProducts";
import { compatibilityForSurface, effectivenessForProblem } from "../../src/lib/products/productRating";
import { PRODUCT_RESEARCH } from "../../src/lib/products/productResearch";

type ConflictLevel = "error" | "warning" | "info";

type Conflict = { level: ConflictLevel; message: string };

const conflicts: Conflict[] = [];

function pushConflict(entry: Conflict) {
  conflicts.push(entry);
}

const GRID: { problem: string; surface: string }[] = [
  { problem: "dust buildup", surface: "granite" },
  { problem: "floor residue", surface: "hardwood floors" },
  { problem: "floor residue", surface: "tile floors" },
  { problem: "organic stains", surface: "carpet" },
  { problem: "urine", surface: "carpet" },
  { problem: "odor retention", surface: "carpet" },
  { problem: "clog", surface: "drains" },
  { problem: "preventive maintenance", surface: "shower glass" },
  { problem: "limescale", surface: "shower glass" },
  { problem: "grease buildup", surface: "stainless steel" },
  { problem: "bacteria buildup", surface: "countertops" },
  { problem: "soap scum", surface: "tile" },
];

function main() {
  for (const p of PRODUCTS) {
    const chem = p.chemicalClass;
    for (const surf of p.surfaces) {
      const score = compatibilityForSurface(chem, surf);
      if (score <= 4) {
        pushConflict({
          level: "warning",
          message: `${p.slug} → surface "${surf}" model compat score ${score} (class ${chem})`,
        });
      }
    }
  }

  const stoneRiskSlugs = new Set([
    "clr-calcium-lime-rust",
    "lime-a-way-cleaner",
    "zep-calcium-lime-rust-remover",
    "bar-keepers-friend-cleanser",
    "heinz-distilled-white-vinegar-5pct",
  ]);
  const top = getRecommendedProducts({ problem: "dust buildup", surface: "granite", limit: 5 });
  const hits = top.filter((x) => stoneRiskSlugs.has(x.slug));
  if (hits.length) {
    pushConflict({
      level: "error",
      message: `Acid/mineral leaders on granite + dust: ${hits.map((x) => x.slug).join(", ")}`,
    });
  } else {
    pushConflict({
      level: "info",
      message: "No acid/mineral leaders in top 5 for granite + dust buildup",
    });
  }

  const DRAIN_SLUGS = new Set([
    "drano-max-gel-drain-clog-remover",
    "liquid-plumr-clog-destroyer-plus-pipeguard",
  ]);
  const OVEN_SLUGS = new Set(["easy-off-heavy-duty-oven-cleaner", "zep-oven-and-grill-cleaner"]);
  const MAINT_SLUGS = new Set([
    "wet-and-forget-shower-cleaner",
    "method-daily-shower-spray",
    "tilex-daily-shower-cleaner",
    "scrubbing-bubbles-daily-shower-cleaner",
  ]);

  for (const { problem, surface } of GRID) {
    const rec = getRecommendedProducts({ problem, surface, limit: 5 });
    for (const slug of DRAIN_SLUGS) {
      if (rec.some((x) => x.slug === slug) && (problem !== "clog" || surface !== "drains")) {
        pushConflict({
          level: "error",
          message: `Drain opener ${slug} surfaced for ${problem} / ${surface}`,
        });
      }
    }
    for (const slug of OVEN_SLUGS) {
      if (
        rec.some((x) => x.slug === slug) &&
        (surface !== "ovens" && surface !== "grills")
      ) {
        pushConflict({
          level: "error",
          message: `Oven/grill cleaner ${slug} surfaced for ${problem} / ${surface}`,
        });
      }
    }
  }
  pushConflict({
    level: "info",
    message: "Drain + oven isolation sweep completed on sample grid",
  });

  const restoreTop = getRecommendedProducts({
    problem: "limescale",
    surface: "shower glass",
    limit: 3,
    intent: "restore",
  });
  for (const slug of MAINT_SLUGS) {
    if (restoreTop.some((x) => x.slug === slug)) {
      pushConflict({
        level: "error",
        message: `Maintenance cleaner ${slug} in top-3 for restore intent (limescale / shower glass)`,
      });
    }
  }
  pushConflict({
    level: "info",
    message: "Maintenance vs restore intent check completed",
  });

  const STAINLESS_FINISH_SLUGS = new Set([
    "weiman-stainless-steel-cleaner-polish",
    "therapy-stainless-steel-cleaner-polish",
    "sprayway-stainless-steel-cleaner",
  ]);

  const DISINFECT_FORWARD_SLUGS = new Set([
    "lysol-disinfectant-spray",
    "microban-24-hour-disinfectant-sanitizing-spray",
    "clorox-disinfecting-wipes",
    "clorox-clean-up-cleaner-bleach",
    "seventh-generation-disinfecting-multi-surface-cleaner",
  ]);

  const KITCHEN_HOOD_DEG_SLUGS = new Set([
    "easy-off-kitchen-degreaser",
    "weiman-gas-range-cleaner-degreaser",
    "krud-kutter-kitchen-degreaser",
  ]);

  for (const { problem, surface } of [
    { problem: "musty odor", surface: "fabrics" as const },
    { problem: "musty odor", surface: "upholstery" as const },
  ]) {
    const rec = getRecommendedProducts({ problem, surface, limit: 3 });
    const hits = rec.filter((x) => DISINFECT_FORWARD_SLUGS.has(x.slug));
    if (hits.length) {
      pushConflict({
        level: "warning",
        message: `Disinfectant-class SKU(s) in top-3 for ${problem} / ${surface}: ${hits.map((x) => x.slug).join(", ")}`,
      });
    }
  }

  const COOKTOP_LIGHT_DEG_LEADERS = new Set([
    ...KITCHEN_HOOD_DEG_SLUGS,
    "simple-green-pro-hd",
    "krud-kutter-original-cleaner-degreaser",
    "method-heavy-duty-degreaser",
    "dawn-platinum-dish-spray",
  ]);
  for (const problem of ["smudge marks", "light film"] as const) {
    const rec = getRecommendedProducts({ problem, surface: "cooktops", limit: 3 });
    const top = rec[0]?.slug;
    const hasCerama = rec.some((x) => x.slug === "cerama-bryte-cooktop-cleaner");
    if (top && COOKTOP_LIGHT_DEG_LEADERS.has(top) && !hasCerama) {
      pushConflict({
        level: "warning",
        message: `Cooktop light cleaning (${problem}): heavy/broad degreaser "${top}" leads without Cerama Bryte in top-3`,
      });
    }
  }

  const ODOR_NEUTRALIZER_SLUGS = new Set([
    "zero-odor-eliminator-spray",
    "fresh-wave-odor-removing-spray",
  ]);
  for (const { problem, surface } of [
    { problem: "grease buildup", surface: "stainless steel" as const },
    { problem: "mineral deposits", surface: "chrome" as const },
  ]) {
    const rec = getRecommendedProducts({ problem, surface, limit: 3 });
    const hits = rec.filter((x) => ODOR_NEUTRALIZER_SLUGS.has(x.slug));
    if (hits.length) {
      pushConflict({
        level: "warning",
        message: `Odor neutralizer in top-3 for ${problem} / ${surface}: ${hits.map((x) => x.slug).join(", ")}`,
      });
    }
  }

  for (const problem of ["limescale", "mineral deposits", "rust stains"] as const) {
    for (const surface of ["chrome", "stainless steel", "finished stainless"] as const) {
      const rec = getRecommendedProducts({ problem, surface, limit: 3 });
      const hits = rec.filter((x) => STAINLESS_FINISH_SLUGS.has(x.slug));
      if (hits.length) {
        pushConflict({
          level: "warning",
          message: `Stainless appearance product(s) in top-3 for ${problem} / ${surface}: ${hits.map((x) => x.slug).join(", ")}`,
        });
      }
    }
  }

  const ovenGreaseRec = getRecommendedProducts({
    problem: "cooked-on grease",
    surface: "ovens",
    limit: 5,
  });
  for (const slug of KITCHEN_HOOD_DEG_SLUGS) {
    if (ovenGreaseRec.some((x) => x.slug === slug)) {
      pushConflict({
        level: "error",
        message: `Cooktop/hood degreaser ${slug} in recommendations for ovens + cooked-on grease`,
      });
    }
  }

  const MOLD_CONTROL_SLUGS = new Set(["concrobium-mold-control", "mold-armor-rapid-clean-remediation"]);

  const moldControlOnEnzymeScenarios: { problem: string; surface: string }[] = [
    { problem: "urine", surface: "carpet" },
    { problem: "pet odor", surface: "carpet" },
    { problem: "laundry odor", surface: "laundry" },
    { problem: "musty odor", surface: "fabrics" },
    { problem: "musty odor", surface: "upholstery" },
  ];
  for (const { problem, surface } of moldControlOnEnzymeScenarios) {
    const rec = getRecommendedProducts({ problem, surface, limit: 3 });
    const moldHit = rec.filter((x) => MOLD_CONTROL_SLUGS.has(x.slug));
    if (moldHit.length) {
      pushConflict({
        level: "error",
        message: `Mold-control SKU(s) in top-3 for ${problem} / ${surface}: ${moldHit.map((x) => x.slug).join(", ")}`,
      });
    }
  }

  const ADHESIVE_REMOVER_SLUGS = new Set([
    "goo-gone-original-liquid",
    "goo-gone-spray-gel",
    "un-du-adhesive-remover",
    "3m-adhesive-remover",
    "goof-off-professional-strength-remover",
  ]);

  const COOKTOP_SPECIALISTS = new Set([
    "weiman-gas-range-cleaner-degreaser",
    "easy-off-kitchen-degreaser",
    "krud-kutter-kitchen-degreaser",
  ]);
  const BROAD_DEGREASER_LEADERS = new Set([
    "simple-green-pro-hd",
    "krud-kutter-original-cleaner-degreaser",
    "method-heavy-duty-degreaser",
  ]);
  for (const { problem, surface } of [
    { problem: "kitchen grease film", surface: "cooktops" as const },
    { problem: "greasy film", surface: "range hoods" as const },
  ]) {
    const rec = getRecommendedProducts({ problem, surface, limit: 3 });
    const hasSpec = rec.some((x) => COOKTOP_SPECIALISTS.has(x.slug));
    const top = rec[0]?.slug;
    if (top && BROAD_DEGREASER_LEADERS.has(top) && !hasSpec) {
      pushConflict({
        level: "error",
        message: `Broad degreaser ${top} leads ${problem} / ${surface} without cooktop/hood specialist in top-3`,
      });
    }
  }

  const fabricMustyRec = getRecommendedProducts({ problem: "musty odor", surface: "fabrics", limit: 3 });
  const LAUNDRY_SAN = new Set(["lysol-laundry-sanitizer", "clorox-laundry-sanitizer"]);
  const FABRIC_REFRESH = new Set(["febreze-fabric-refresher-antimicrobial", "odoban-fabric-laundry-spray"]);
  if (
    fabricMustyRec[0] &&
    LAUNDRY_SAN.has(fabricMustyRec[0].slug) &&
    !fabricMustyRec.some((x) => FABRIC_REFRESH.has(x.slug))
  ) {
    pushConflict({
      level: "warning",
      message: `Laundry sanitizer leads musty odor / fabrics without fabric refresh peer in top-3 (${fabricMustyRec[0].slug})`,
    });
  }
  for (const surface of ["marble", "granite"] as const) {
    const rec = getRecommendedProducts({ problem: "adhesive residue", surface, limit: 3 });
    for (const x of rec) {
      if (ADHESIVE_REMOVER_SLUGS.has(x.slug)) {
        pushConflict({
          level: "warning",
          message: `Adhesive remover ${x.slug} in top-3 for adhesive residue / ${surface} (stone finish risk—verify label)`,
        });
      }
    }
  }

  pushConflict({
    level: "info",
    message:
      "Specialist containment checks (stainless polish, hood deg on ovens, mold vs odor fabric, cooktop broad beat, fabric musty, adhesive on stone, musty vs disinfect, cooktop light vs deg, odor neutralizer on grease/mineral) completed",
  });

  for (const { problem, surface } of GRID) {
    const rec = getRecommendedProducts({ problem, surface, limit: 3 });
    for (const prod of rec) {
      const chem = prod.chemicalClass ?? "neutral";
      const eff = effectivenessForProblem(chem, problem);
      if (eff < 4) {
        pushConflict({
          level: "warning",
          message: `${problem} / ${surface} → ${prod.slug} (modeled effectiveness ${eff})`,
        });
      }
    }
  }

  const counts = new Map<string, number>();
  for (const { problem, surface } of GRID) {
    for (const prod of getRecommendedProducts({ problem, surface, limit: 3 })) {
      counts.set(prod.slug, (counts.get(prod.slug) ?? 0) + 1);
    }
  }
  const threshold = 8;
  for (const [slug, n] of counts) {
    if (n >= threshold) {
      pushConflict({
        level: "error",
        message: `Over-broad: ${slug} in top-3 on ${n}/${GRID.length} grid pairs`,
      });
    }
  }

  for (const p of PRODUCTS) {
    const r = PRODUCT_RESEARCH[p.slug];
    if (!r?.safetyWarnings?.length) continue;
    const warn = r.safetyWarnings.join(" ").toLowerCase();
    const chem = p.chemicalClass;
    if (warn.includes("bleach") && chem !== "bleach" && chem !== "oxygen_bleach" && chem !== "disinfectant") {
      pushConflict({
        level: "info",
        message: `${p.slug}: dossier mentions bleach; seed class ${chem} (often mix-hazard copy—expected)`,
      });
    }
  }

  const visible = conflicts.filter((c) => c.level !== "info");
  const errors = visible.filter((c) => c.level === "error");
  const warnings = visible.filter((c) => c.level === "warning");

  console.log("\n=== PRODUCT CONFLICTS (errors + warnings only) ===\n");
  if (!visible.length) {
    console.log("(no errors or warnings)\n");
  } else {
    for (const c of visible) {
      console.log(`[${c.level.toUpperCase()}] ${c.message}`);
    }
    console.log("");
  }

  const infoCount = conflicts.filter((c) => c.level === "info").length;
  console.log(`Summary: ${errors.length} error(s), ${warnings.length} warning(s), ${infoCount} info (suppressed)\n`);
}

main();
