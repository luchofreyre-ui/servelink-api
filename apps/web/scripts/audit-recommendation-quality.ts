/**
 * Mirrors production: getRecommendedProductsForDisplay + assignRecommendationRoleLabels
 * (+ pinnedSlugs on product comparison pages).
 * Run: npx tsx scripts/audit-recommendation-quality.ts
 */
import { buildProductComparisonPage } from "@/authority/data/authorityComparisonBuilder";
import {
  getComparisonSeedsByType,
  normalizeComparisonSlug,
} from "@/authority/data/authorityComparisonSelectors";
import { getPublishedProductBySlug } from "@/lib/products/productPublishing";
import { getRecommendedProductsForDisplay } from "@/lib/products/productRecommendationDensity";
import {
  resolveProductRecommendationContextForComparisonFallback,
  resolveProductRecommendationContextForMethodProblemPage,
  resolveProductRecommendationContextForProblemPage,
  resolveProductRecommendationContextForSurfaceProblemPage,
} from "@/lib/products/productRecommendationContext";
import { assignRecommendationRoleLabels } from "@/lib/products/recommendationRoles";
import type { ProductCleaningIntent } from "@/lib/products/productTypes";

const DEFAULT_SURFACE = "tile";

function cleaningPowerScore(slug: string): number | null {
  const snap = getPublishedProductBySlug(slug);
  if (!snap) return null;
  return snap.rating.cleaningPower.score;
}

function roleSlugSet(labels: ReturnType<typeof assignRecommendationRoleLabels>): string[] {
  return [labels.bestOverall, labels.bestForHeavy, labels.bestForMaintenance, labels.professional].filter(
    (s): s is string => Boolean(s),
  );
}

function auditLabels(
  url: string,
  meta: string,
  products: Parameters<typeof assignRecommendationRoleLabels>[0],
  surface: string,
  extras?: { pinned?: readonly string[] },
) {
  const labels = assignRecommendationRoleLabels(products, surface);
  const power = (slug: string) => cleaningPowerScore(slug) ?? "?";
  const roles = roleSlugSet(labels);
  const uniqueRoles = new Set(roles).size === roles.length;

  console.log(`\n## ${url}`);
  if (meta) console.log(meta);
  if (extras?.pinned?.length) console.log(`pinned: ${extras.pinned.join(" | ")}`);
  console.log(`surface (for roles): ${surface}`);
  console.log(`count: ${products.length}`);
  console.log(
    "ranked:",
    products.map((p) => `${p.slug}(cp=${power(p.slug)})`).join(" | "),
  );
  console.log(
    "labels:",
    `best=${labels.bestOverall} | heavy=${labels.bestForHeavy} | maint=${labels.bestForMaintenance} | pro=${labels.professional}`,
  );
  if (!uniqueRoles) console.log("WARN: duplicate slug across roles");
  if (extras?.pinned?.length) {
    const missing = extras.pinned.filter((s) => !products.some((p) => p.slug === s));
    if (missing.length) console.log(`WARN: pinned missing from list: ${missing.join(", ")}`);
  }
}

function auditProblem(url: string, problemSlug: string) {
  const ctx = resolveProductRecommendationContextForProblemPage(problemSlug);
  if (!ctx) {
    console.log(`\n## ${url}`);
    console.log("context: NULL");
    return;
  }
  const surface = ctx.surface ?? DEFAULT_SURFACE;
  const products = getRecommendedProductsForDisplay({
    problem: ctx.problem,
    surface,
    intent: ctx.intent,
    densityAuthorityProblemSlug: ctx.densityAuthorityProblemSlug,
  });
  auditLabels(
    url,
    `context: problem="${ctx.problem}" surface="${surface}" intent=${ctx.intent}`,
    products,
    surface,
  );
}

console.log("# Recommendation audit (production-aligned: display list + assignRecommendationRoleLabels)\n");

console.log("## Block A — Problem hubs (5)");
const problems = [
  "/problems/grease-buildup",
  "/problems/soap-scum",
  "/problems/hard-water-deposits",
  "/problems/mold-growth",
  "/problems/surface-discoloration",
];
for (const url of problems) {
  auditProblem(url, url.replace("/problems/", ""));
}

console.log("\n## Block B — Surface / problem (5)");
const combos = [
  ["/surfaces/stainless-steel/grease-buildup", "stainless-steel", "grease-buildup"],
  ["/surfaces/tile/soap-scum", "tile", "soap-scum"],
  ["/surfaces/shower-glass/hard-water-deposits", "shower-glass", "hard-water-deposits"],
  ["/surfaces/granite-countertops/water-spotting", "granite-countertops", "water-spotting"],
  ["/surfaces/finished-wood/dust-buildup", "finished-wood", "dust-buildup"],
] as const;
for (const [url, surf, prob] of combos) {
  const ctx = resolveProductRecommendationContextForSurfaceProblemPage(surf, prob);
  if (!ctx) {
    console.log(`\n## ${url}`);
    console.log("context: NULL");
    continue;
  }
  const surface = ctx.surface ?? DEFAULT_SURFACE;
  const products = getRecommendedProductsForDisplay({
    problem: ctx.problem,
    surface,
    intent: ctx.intent,
    densityAuthorityProblemSlug: ctx.densityAuthorityProblemSlug,
  });
  auditLabels(url, `context: problem="${ctx.problem}" surface="${surface}" intent=${ctx.intent}`, products, surface);
}

console.log("\n## Block C — Product comparisons (pinned = dossier pair, matches live compare pages)");

const PRIORITY_COMPARE_SLUGS = [
  "3m-adhesive-remover-vs-goo-gone-original-liquid",
  "biokleen-bac-out-stain-odor-remover-vs-natures-miracle-stain-and-odor-remover",
] as const;

for (const comparisonSlug of PRIORITY_COMPARE_SLUGS) {
  const data = buildProductComparisonPage(comparisonSlug);
  if (!data || data.type !== "product_comparison") {
    console.log(`\n## /compare/products/${comparisonSlug}`);
    console.log("SKIP: no product comparison data");
    continue;
  }
  const ctx = resolveProductRecommendationContextForComparisonFallback(
    data.topSharedProblemSlug ?? "",
    data.topSharedSurfaceSlug,
  );
  if (!ctx) {
    console.log(`\n## /compare/products/${data.slug}`);
    console.log("context: NULL");
    continue;
  }
  const surface = ctx.surface ?? DEFAULT_SURFACE;
  const pinned = [data.leftSlug, data.rightSlug] as const;
  const products = getRecommendedProductsForDisplay({
    problem: ctx.problem,
    surface,
    intent: ctx.intent,
    densityAuthorityProblemSlug: data.topSharedProblemSlug,
    pinnedSlugs: pinned,
  });
  auditLabels(
    `/compare/products/${data.slug}`,
    `fallback: problem="${ctx.problem}" playbook ${data.topSharedSurfaceSlug}/${data.topSharedProblemSlug}`,
    products,
    surface,
    { pinned },
  );
}

console.log("\n## Block D — More product comparisons (first 3 with scenario context, pinned)");
const productSeeds = getComparisonSeedsByType("product_comparison");
let shown = 0;
for (const seed of productSeeds) {
  if (shown >= 3) break;
  const comparisonSlug = normalizeComparisonSlug(seed.leftSlug, seed.rightSlug);
  if (PRIORITY_COMPARE_SLUGS.includes(comparisonSlug as (typeof PRIORITY_COMPARE_SLUGS)[number])) continue;
  const data = buildProductComparisonPage(comparisonSlug);
  if (!data?.topSharedProblemSlug) continue;
  const ctx = resolveProductRecommendationContextForComparisonFallback(
    data.topSharedProblemSlug,
    data.topSharedSurfaceSlug,
  );
  if (!ctx) continue;
  shown++;
  const surface = ctx.surface ?? DEFAULT_SURFACE;
  const pinned = [data.leftSlug, data.rightSlug] as const;
  const products = getRecommendedProductsForDisplay({
    problem: ctx.problem,
    surface,
    intent: ctx.intent,
    densityAuthorityProblemSlug: data.topSharedProblemSlug,
    pinnedSlugs: pinned,
  });
  auditLabels(
    `/compare/products/${data.slug}`,
    `fallback: problem="${ctx.problem}" playbook ${data.topSharedSurfaceSlug}/${data.topSharedProblemSlug}`,
    products,
    surface,
    { pinned },
  );
}

console.log("\n## Block E — Method + problem (2)");
const methodProblems = [
  ["/methods/degreasing/grease-buildup", "degreasing", "grease-buildup"],
  ["/methods/soap-scum-removal/soap-scum", "soap-scum-removal", "soap-scum"],
] as const;
for (const [url, method, prob] of methodProblems) {
  const ctx = resolveProductRecommendationContextForMethodProblemPage(method, prob);
  if (!ctx) {
    console.log(`\n## ${url}`);
    console.log("context: NULL");
    continue;
  }
  const surface = ctx.surface ?? DEFAULT_SURFACE;
  const products = getRecommendedProductsForDisplay({
    problem: ctx.problem,
    surface,
    intent: ctx.intent,
    densityAuthorityProblemSlug: ctx.densityAuthorityProblemSlug,
  });
  auditLabels(url, `context: problem="${ctx.problem}" surface="${surface}" intent=${ctx.intent}`, products, surface);
}

console.log("\n## FOCUS — Delta checklist (canonical subset)");
const focus: Array<{
  label: string;
  url: string;
  problem: string;
  surface: string;
  intent: ProductCleaningIntent;
  density?: string;
  pinned?: readonly string[];
}> = [];

const hw = resolveProductRecommendationContextForProblemPage("hard-water-deposits");
if (hw) {
  focus.push({
    label: "hard-water-deposits",
    url: "/problems/hard-water-deposits",
    problem: hw.problem,
    surface: hw.surface ?? DEFAULT_SURFACE,
    intent: hw.intent,
    density: hw.densityAuthorityProblemSlug,
  });
}
const mold = resolveProductRecommendationContextForProblemPage("mold-growth");
if (mold) {
  focus.push({
    label: "mold-growth",
    url: "/problems/mold-growth",
    problem: mold.problem,
    surface: mold.surface ?? DEFAULT_SURFACE,
    intent: mold.intent,
    density: mold.densityAuthorityProblemSlug,
  });
}
const disc = resolveProductRecommendationContextForProblemPage("surface-discoloration");
if (disc) {
  focus.push({
    label: "surface-discoloration",
    url: "/problems/surface-discoloration",
    problem: disc.problem,
    surface: disc.surface ?? DEFAULT_SURFACE,
    intent: disc.intent,
    density: disc.densityAuthorityProblemSlug,
  });
}
const ssg = resolveProductRecommendationContextForSurfaceProblemPage("stainless-steel", "grease-buildup");
if (ssg) {
  focus.push({
    label: "stainless-steel/grease-buildup",
    url: "/surfaces/stainless-steel/grease-buildup",
    problem: ssg.problem,
    surface: ssg.surface ?? DEFAULT_SURFACE,
    intent: ssg.intent,
    density: ssg.densityAuthorityProblemSlug,
  });
}
const sghw = resolveProductRecommendationContextForSurfaceProblemPage("shower-glass", "hard-water-deposits");
if (sghw) {
  focus.push({
    label: "shower-glass/hard-water-deposits",
    url: "/surfaces/shower-glass/hard-water-deposits",
    problem: sghw.problem,
    surface: sghw.surface ?? DEFAULT_SURFACE,
    intent: sghw.intent,
    density: sghw.densityAuthorityProblemSlug,
  });
}
for (const comparisonSlug of PRIORITY_COMPARE_SLUGS) {
  const data = buildProductComparisonPage(comparisonSlug);
  if (!data?.topSharedProblemSlug) continue;
  const ctx = resolveProductRecommendationContextForComparisonFallback(
    data.topSharedProblemSlug,
    data.topSharedSurfaceSlug,
  );
  if (!ctx) continue;
  focus.push({
    label: `compare:${comparisonSlug}`,
    url: `/compare/products/${data.slug}`,
    problem: ctx.problem,
    surface: ctx.surface ?? DEFAULT_SURFACE,
    intent: ctx.intent,
    density: data.topSharedProblemSlug,
    pinned: [data.leftSlug, data.rightSlug],
  });
}

for (const row of focus) {
  const products = getRecommendedProductsForDisplay({
    problem: row.problem,
    surface: row.surface,
    intent: row.intent,
    densityAuthorityProblemSlug: row.density,
    pinnedSlugs: row.pinned,
  });
  const labels = assignRecommendationRoleLabels(products, row.surface);
  const power = (slug: string) => cleaningPowerScore(slug) ?? "?";
  const bestCp = labels.bestOverall ? cleaningPowerScore(labels.bestOverall) : null;
  const heavyCp = labels.bestForHeavy ? cleaningPowerScore(labels.bestForHeavy) : null;
  const bestVsHeavyOk =
    labels.bestOverall && labels.bestForHeavy && labels.bestOverall !== labels.bestForHeavy ?
      heavyCp !== null && bestCp !== null && heavyCp >= bestCp
    : true;
  console.log(
    `\n[${row.label}] ${row.url}\n  ranked: ${products.map((p) => `${p.slug}(cp=${power(p.slug)})`).join(" | ")}\n  roles: best=${labels.bestOverall} | heavy=${labels.bestForHeavy} | maint=${labels.bestForMaintenance} | pro=${labels.professional}\n  checks: uniqueRoles=${new Set(roleSlugSet(labels)).size === roleSlugSet(labels).length} | heavy>=bestCp=${bestVsHeavyOk}${row.pinned ? ` | pinsInList=${row.pinned.every((s) => products.some((p) => p.slug === s))}` : ""}`,
  );
}
