import {
  inferRecommendationIntent,
  recommendationAdjustment,
  type PublishedProductLike,
} from "./getRecommendedProducts";
import { getAllPublishedProducts, getPublishedProductBySlug } from "./productPublishing";
import { PRODUCT_SEEDS } from "./productSeeds";
import { PRODUCTS } from "./products.seed";
import type { CleaningProduct } from "./productTaxonomy";
import type { ProductCleaningIntent } from "./productTypes";

export type ExplainParams = {
  slug: string;
  problem: string;
  surface: string;
  intent: string;
};

function seedChemicalClass(slug: string): string | undefined {
  return PRODUCTS.find((p) => p.slug === slug)?.chemicalClass;
}

function dossierForSlug(slug: string): CleaningProduct | undefined {
  return PRODUCT_SEEDS.find((p) => p.slug === slug);
}

/**
 * Short, defensible reasons for encyclopedia recommendation cards (max 4 bullets).
 * Merges published seed chemistry with dossier surfaces / incompat lists.
 */
export function buildRecommendationReasons({ slug, problem, surface, intent }: ExplainParams): string[] {
  const reasons: string[] = [];
  const pLower = problem.toLowerCase();
  const sLower = surface.toLowerCase();
  const dossier = dossierForSlug(slug);
  const chemicalClass = (seedChemicalClass(slug) ?? "").toLowerCase().trim();

  const compatibleProblems = dossier?.compatibleProblems ?? PRODUCTS.find((x) => x.slug === slug)?.problems ?? [];
  const compatibleSurfaces = dossier?.compatibleSurfaces ?? PRODUCTS.find((x) => x.slug === slug)?.surfaces ?? [];
  const incompatibleSurfaces = dossier?.incompatibleSurfaces ?? [];
  const incompatibleProblems = dossier?.incompatibleProblems ?? [];
  const cleaningStrength = dossier?.cleaningStrength;

  if (compatibleProblems.some((x) => x === problem)) {
    reasons.push(`Tagged for “${problem}” in the product library`);
  }

  if (compatibleSurfaces.some((x) => x.toLowerCase() === sLower)) {
    reasons.push(`Listed as compatible with ${surface}`);
  }

  if (intent === "disinfect" && chemicalClass === "disinfectant") {
    reasons.push("Disinfectant-class chemistry aligns with disinfection intent");
  }
  if (intent === "disinfect" && chemicalClass === "bleach") {
    reasons.push("Bleach-class chemistry aligns with disinfection intent");
  }

  if (intent === "restore" && cleaningStrength === "restoration") {
    reasons.push("Restoration-strength chemistry fits restore intent");
  }
  if (intent === "restore" && chemicalClass === "acid" && cleaningStrength !== "light") {
    reasons.push("Acid chemistry often fits mineral / scale restoration (label-safe surfaces only)");
  }

  if (intent === "maintain" && cleaningStrength === "light") {
    reasons.push("Light-duty profile fits maintenance intent");
  }

  if (pLower.includes("grease") && chemicalClass === "surfactant") {
    reasons.push("Surfactant class is strong for grease and food films");
  }
  if (pLower.includes("grease") && chemicalClass === "alkaline") {
    reasons.push("Alkaline chemistry helps cut kitchen grease when labeled for the surface");
  }

  if (pLower.includes("mineral") && chemicalClass === "acid") {
    reasons.push("Acid chemistry targets mineral and hardness deposits (never on acid-sensitive stone)");
  }
  if ((pLower.includes("lime") || pLower.includes("scale") || pLower === "calcium buildup") && chemicalClass === "acid") {
    reasons.push("Acid chemistry fits limescale / calcium-type deposits where allowed");
  }

  if (pLower.includes("adhesive") && chemicalClass === "solvent_blend") {
    reasons.push("Solvent blend helps soften adhesive and sticky residue");
  }

  if (pLower.includes("odor") && chemicalClass === "enzyme") {
    reasons.push("Enzyme chemistry targets many organic odor sources (dwell + label steps)");
  }

  if (incompatibleSurfaces.some((x) => x.toLowerCase() === sLower)) {
    reasons.push(`Caution: dossier flags ${surface} as incompatible or high-risk`);
  }
  if (incompatibleProblems.some((x) => x === problem)) {
    reasons.push(`Caution: not positioned for “${problem}” in the master dossier`);
  }

  const deduped = [...new Set(reasons)];
  return deduped.slice(0, 4);
}

const MINERAL_HEAVY = new Set([
  "limescale",
  "mineral deposits",
  "calcium buildup",
  "rust stains",
  "hard water stains",
  "hard water film",
  "scale deposits",
]);

/**
 * When a product is still in the top set despite ranking penalties, show one plain-language caveat.
 */
export function buildRecommendationCaveat({ slug, problem, surface, intent }: ExplainParams): string | null {
  const snapshot = getPublishedProductBySlug(slug);
  if (!snapshot) return null;
  const product = snapshot as PublishedProductLike;
  const effectiveIntent = (intent as ProductCleaningIntent) || inferRecommendationIntent(problem);
  const catalog = getAllPublishedProducts() as PublishedProductLike[];
  const adj = recommendationAdjustment(product, problem, surface, effectiveIntent, catalog);
  if (adj > -6) return null;

  const pLower = problem.toLowerCase().trim();
  const sLower = surface.toLowerCase().trim();
  const chem = (product.chemicalClass ?? "").toLowerCase().trim();
  const dossier = dossierForSlug(slug);
  const cleaningStrength = dossier?.cleaningStrength;

  const delicateStone =
    sLower === "marble" ||
    sLower === "granite" ||
    sLower === "quartz" ||
    sLower === "sealed stone" ||
    sLower === "stone";

  if (delicateStone && chem === "acid") return "Not ideal for delicate stone";
  if (delicateStone && (chem === "bleach" || chem === "caustic"))
    return "Verify finish safety on stone and keep contact minimal";

  if (MINERAL_HEAVY.has(pLower) && (chem === "surfactant" || chem === "neutral" || chem === "enzyme"))
    return "Weaker on heavy mineral scale";

  if (slug === "wet-and-forget-shower-cleaner" && effectiveIntent === "restore")
    return "Maintenance-focused, not restoration-focused";

  if (chem === "enzyme" && effectiveIntent === "disinfect")
    return "Not a primary disinfectant—biology and dwell drive results";

  if (dossier?.ventilationRequired && adj <= -12) return "Requires stronger ventilation";

  if (effectiveIntent === "maintain" && (chem === "acid" || chem === "bleach" || chem === "caustic"))
    return "Aggressive chemistry for a maintenance intent—prefer lighter profiles when possible";

  if (effectiveIntent === "restore" && cleaningStrength === "light")
    return "Light-duty profile—may underperform vs true restoration chemistry";

  if (adj <= -10) return "Situational ranking penalty—double-check label fit for this surface and soil";

  return null;
}
