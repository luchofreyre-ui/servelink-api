import type { ProductRating, ProductSeed, ProductScore as PillarScore } from "./productTypes";

export const PRODUCT_RATING_WEIGHTS = {
  cleaningPower: 0.3,
  safety: 0.2,
  surfaceCompatibility: 0.2,
  easeOfUse: 0.15,
  consistency: 0.15,
} as const;

export type PillarKey = keyof typeof PRODUCT_RATING_WEIGHTS;

const MINERAL = new Set([
  "mineral deposits",
  "limescale",
  "hard water film",
  "hard water stains",
  "scale deposits",
  "calcium buildup",
  "mineral haze",
  "white film",
  "cloudy film",
  "water spots",
]);

const GREASE = new Set([
  "grease buildup",
  "grease splatter",
  "cooked-on grease",
  "baked-on grease",
  "greasy film",
  "kitchen grease film",
  "oil stains",
  "food residue",
  "sticky residue",
  "burnt residue",
  "cooked-on residue",
]);

const ORGANIC_STAIN = new Set([
  "tannin stains",
  "dye transfer",
  "mildew stains",
  "discoloration",
  "pink slime",
  "biofilm",
  "mold growth",
  "organic stains",
  "pet odor",
  "urine",
  "bio-organic buildup",
]);

const ENZYME_SOIL = new Set([
  "urine",
  "pet odor",
  "organic stains",
  "bio-organic buildup",
  "odor retention",
  "laundry odor",
]);

const STONE_LIKE = new Set([
  "stone",
  "granite",
  "marble",
  "quartz",
  "natural stone",
  "sealed stone",
  "sealed granite",
  "sealed marble",
  "quartz countertops",
]);

function clamp(n: number): number {
  return Math.min(10, Math.max(1, Math.round(n * 10) / 10));
}

function clampInt(n: number): number {
  return Math.min(10, Math.max(1, Math.round(n)));
}

export function effectivenessForProblem(chemical: string, problem: string): number {
  const c = chemical.toLowerCase().trim();
  const p = problem.toLowerCase().trim();
  if (p === "clog") {
    if (c === "caustic" || c === "alkaline") return 9;
    return 2;
  }
  if (ENZYME_SOIL.has(p)) {
    if (c === "enzyme") return 10;
    if (c === "oxygen_bleach") return 6;
    if (c === "disinfectant" || c === "bleach") return 4;
    if (c === "surfactant" || c === "acid" || c === "neutral") return 5;
    return 5;
  }
  if (p === "floor residue") {
    if (c === "neutral") return 8;
    if (c === "surfactant") return 7;
    if (c === "acid" || c === "solvent_blend" || c === "bleach" || c === "caustic") return 3;
    return 5;
  }
  if (p === "preventive maintenance") {
    if (c === "surfactant" || c === "neutral") return 8;
    return 4;
  }
  if (p === "light dust" || p === "light film") {
    if (c === "surfactant" || c === "neutral") return 8;
    if (c === "stainless_polish") return 8;
    return 5;
  }
  if (p === "musty odor") {
    if (c === "neutral") return 10;
    if (c === "surfactant") return 9;
    if (c === "enzyme") return 7;
    if (c === "disinfectant" || c === "bleach") return 4;
    if (c === "alkaline") return 4;
    return 5;
  }
  if (p === "light adhesive residue") {
    if (c === "solvent_blend" || c === "solvent") return 9;
    if (c === "surfactant") return 5;
    return 4;
  }
  if (p === "fingerprints" || p === "surface haze" || p === "smudge marks") {
    if (c === "stainless_polish") return 10;
    if (c === "neutral" || c === "surfactant") return 7;
    if (c === "ammonia_blend") return 7;
    return 4;
  }
  if (p === "mold staining") {
    if (c === "mold_control") return 9;
    if (c === "bleach" || c === "disinfectant") return 8;
    if (c === "enzyme") return 4;
    return 6;
  }
  if (MINERAL.has(p) || p === "rust stains" || p === "soap residue") {
    if (c === "acid") return 9;
    if (c === "surfactant") return 5;
    if (c === "ammonia_blend") return 5;
    if (c === "alkaline") return 6;
    if (c === "oxygen_bleach") return 5;
    if (c === "neutral") return 4;
    return 5;
  }
  if (GREASE.has(p)) {
    if (c === "surfactant" || c === "alkaline") return 9;
    if (c === "ammonia_blend") return 8;
    if (c === "acid") return 5;
    if (c === "oxygen_bleach") return 6;
    if (c === "neutral") return 6;
    return 6;
  }
  if (
    p === "bacteria buildup" ||
    p === "biofilm" ||
    p === "mold growth" ||
    p === "mildew growth" ||
    p === "mildew stains" ||
    p === "disinfection" ||
    p === "laundry disinfection"
  ) {
    if (c === "disinfectant" || c === "bleach") return 9;
    if (c === "mold_control") return 8;
    if (c === "oxygen_bleach") return 7;
    if (c === "surfactant" || c === "acid" || c === "ammonia_blend") return 4;
    return 5;
  }
  if (ORGANIC_STAIN.has(p)) {
    if (c === "oxygen_bleach") return 9;
    if (c === "bleach") return 8;
    if (c === "alkaline") return 7;
    if (c === "acid") return 6;
    if (c === "surfactant") return 6;
    if (c === "ammonia_blend") return 6;
    return 6;
  }
  return 6;
}

export function compatibilityForSurface(chemical: string, surface: string): number {
  const c = chemical.toLowerCase().trim();
  const s = surface.toLowerCase().trim();
  if (s === "drains") {
    if (c === "caustic" || c === "alkaline") return 8;
    return 3;
  }
  if (s === "carpet" || s === "upholstery") {
    if (c === "solvent_blend") return 4;
    if (c === "acid" || c === "bleach" || c === "caustic") return 4;
    if (c === "enzyme" || c === "surfactant") return 8;
    if (c === "neutral") return 8;
    return 6;
  }
  if (s === "hardwood floors" || s === "tile floors") {
    if (c === "neutral") return 9;
    if (c === "surfactant") return 8;
    if (c === "acid" || c === "caustic" || c === "bleach") return 3;
    if (c === "solvent_blend") return 4;
    return 6;
  }
  if (STONE_LIKE.has(s)) {
    if (c === "acid") return 4;
    if (c === "oxygen_bleach") return 6;
    if (c === "alkaline") return 7;
    if (c === "ammonia_blend") return 5;
    if (c === "surfactant") return 8;
    if (c === "neutral") return 9;
    return 6;
  }
  if (s.includes("grout")) {
    if (c === "acid") return 5;
    return 7;
  }
  if (s === "laminate" || s === "vinyl" || s.includes("plastic")) {
    if (c === "solvent_blend") return 4;
    if (c === "acid") return 6;
    return 8;
  }
  if (s.includes("glass") || s === "mirrors" || s === "shower glass") {
    if (c === "acid") return 7;
    return 8;
  }
  if (s.includes("stainless") || s.includes("chrome") || s.includes("fixtures")) {
    if (c === "acid") return 7;
    return 8;
  }
  return 7;
}

function scoreCleaningPower(chemical: string, problems: string[]): number {
  const eff = problems.map((p) => effectivenessForProblem(chemical, p));
  const avg = eff.reduce((a, b) => a + b, 0) / Math.max(1, eff.length);
  return clampInt(avg + (problems.length >= 4 ? 0.5 : 0));
}

function scoreSafety(chemical: string, surfaces: string[]): number {
  const c = chemical.toLowerCase().trim();
  let base = 7;
  if (c === "acid") base = 5;
  if (c === "bleach") base = 5;
  if (c === "oxygen_bleach") base = 6;
  if (c === "disinfectant") base = 6;
  if (c === "solvent_blend") base = 4;
  if (c === "neutral") base = 9;
  if (c === "surfactant") base = 8;
  if (c === "ammonia_blend") base = 6;
  if (c === "alkaline") base = 6;
  if (c === "enzyme") base = 8;
  if (c === "caustic") base = 3;
  if (c === "mold_control") base = 7;
  if (c === "stainless_polish") base = 8;

  const hasStone = surfaces.some((s) => STONE_LIKE.has(s.toLowerCase().trim()));
  if (hasStone && (c === "acid" || c === "oxygen_bleach")) base -= 1;

  return clampInt(base);
}

function scoreSurfaceCompatibility(chemical: string, surfaces: string[]): number {
  if (surfaces.length === 0) return 7;
  const comps = surfaces.map((s) => compatibilityForSurface(chemical, s));
  const avg = comps.reduce((a, b) => a + b, 0) / comps.length;
  return clampInt(avg);
}

function scoreEaseOfUse(seed: ProductSeed): number {
  const cat = seed.category.toLowerCase();
  if (cat.includes("spray")) return 9;
  if (cat.includes("liquid")) return 8;
  if (cat.includes("powder")) return 6;
  if (cat.includes("vinegar")) return 7;
  return 7;
}

function scoreConsistency(seed: ProductSeed): number {
  if (seed.brand && seed.name.length < 80) return 8;
  return 7;
}

type NumericPillars = Record<PillarKey, number>;

function weightedFinal(scores: NumericPillars): number {
  const w = PRODUCT_RATING_WEIGHTS;
  const sum =
    scores.cleaningPower * w.cleaningPower +
    scores.safety * w.safety +
    scores.surfaceCompatibility * w.surfaceCompatibility +
    scores.easeOfUse * w.easeOfUse +
    scores.consistency * w.consistency;
  return clamp(sum);
}

function buildReasons(seed: ProductSeed, scores: NumericPillars): Record<PillarKey, string> {
  const chem = seed.chemicalClass;
  const problems = seed.problems.map((p) => p.toLowerCase());
  const hasMineral = problems.some((p) => MINERAL.has(p) || p === "rust stains" || p === "soap residue");
  const hasGrease = problems.some((p) => GREASE.has(p));
  const hasOrganic = problems.some((p) => ORGANIC_STAIN.has(p));

  const cpParts: string[] = [];
  if (hasMineral) cpParts.push("mineral / hardness soils");
  if (hasGrease) cpParts.push("grease and organic films");
  if (hasOrganic) cpParts.push("organic staining");
  if (cpParts.length === 0) cpParts.push("general soils on tagged problems");
  const cleaningPowerReason = `Scored from chemistry class (${chem}) vs declared problems (${cpParts.join(", ")}).`;

  let safetyReason = `Default handling profile for ${chem} formulations when used as directed.`;
  if (chem === "acid" || chem === "bleach" || chem === "solvent_blend" || chem === "disinfectant") {
    safetyReason += " Higher caution: test, ventilate, rinse, and keep off incompatible finishes.";
  }
  if (chem === "caustic") {
    safetyReason += " Caustic drain chemistry: never use as a surface spray; extreme mix hazards with acids and other cleaners.";
  }
  if (chem === "enzyme") {
    safetyReason += " Enzyme products need dwell time and compatible surfaces—avoid mixing with incompatible disinfectants per label.";
  }
  if (chem === "ammonia_blend") {
    safetyReason +=
      " Ammonia-system products need ventilation, never mix with bleach, and avoid incompatible coatings (some glass films).";
  }
  if (chem === "alkaline") {
    safetyReason += " Alkaline cleaners can dull sensitive finishes or etch aluminum if misused—rinse and test.";
  }
  if (chem === "neutral" || chem === "surfactant") safetyReason += " Typically more forgiving on mixed finishes.";

  const narrow = scores.surfaceCompatibility <= 6;
  const surfaceReason = narrow
    ? "Listed surfaces include acid- or solvent-sensitive tags that pull the average down—spot testing matters."
    : "Compatibility averages across the declared surface tags look relatively broad for this chemistry.";

  const eu = seed.category.toLowerCase();
  const easeReason = eu.includes("spray")
    ? "Spray format keeps application friction low."
    : eu.includes("powder")
      ? "Powder formats usually imply measuring, dwell, or rinse steps—slightly higher friction."
      : "Liquid / conventional format—moderate application effort.";

  const consistencyReason =
    seed.brand && seed.name.length < 80
      ? "Named retail SKU with stable labeling—heuristic consistency ticked up."
      : "Generic length/heuristic—consistency held at baseline.";

  return {
    cleaningPower: cleaningPowerReason,
    safety: safetyReason,
    surfaceCompatibility: surfaceReason,
    easeOfUse: easeReason,
    consistency: consistencyReason,
  };
}

function pillar(score: number, reason: string): PillarScore {
  return { score: clampInt(score), reason };
}

/** Deterministic pillar scores, weighted final, and per-pillar reasons. */
export function rateProduct(seed: ProductSeed): ProductRating {
  const chemical = seed.chemicalClass;
  const numeric: NumericPillars = {
    cleaningPower: scoreCleaningPower(chemical, seed.problems),
    safety: scoreSafety(chemical, seed.surfaces),
    surfaceCompatibility: scoreSurfaceCompatibility(chemical, seed.surfaces),
    easeOfUse: scoreEaseOfUse(seed),
    consistency: scoreConsistency(seed),
  };

  const reasons = buildReasons(seed, numeric);

  return {
    cleaningPower: pillar(numeric.cleaningPower, reasons.cleaningPower),
    safety: pillar(numeric.safety, reasons.safety),
    surfaceCompatibility: pillar(numeric.surfaceCompatibility, reasons.surfaceCompatibility),
    easeOfUse: pillar(numeric.easeOfUse, reasons.easeOfUse),
    consistency: pillar(numeric.consistency, reasons.consistency),
    finalScore: weightedFinal(numeric),
  };
}
