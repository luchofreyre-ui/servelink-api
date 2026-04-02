import { getAllPublishedProducts } from "./productPublishing";
import type { ProductCleaningIntent } from "./productTypes";

export type PublishedProductLike = {
  slug: string;
  title?: string;
  brand?: string;
  chemicalClass?: string | null;
  intent?: ProductCleaningIntent;
  compatibleProblems?: string[];
  compatibleSurfaces?: string[];
  rating?: {
    finalScore?: number;
  };
  finalScore?: number;
  score?: number;
  amazonUrl?: string;
  amazonAffiliateUrl?: string;
  isPurchaseAvailable?: boolean;
  buyLabel?: string;
};

export type RecommendationInput = {
  problem: string;
  surface: string;
  limit?: number;
  /** When omitted, derived from `problem` via `inferRecommendationIntent`. */
  intent?: ProductCleaningIntent;
};

const MINERAL_HEAVY = new Set([
  "limescale",
  "mineral deposits",
  "calcium buildup",
  "rust stains",
  "hard water stains",
  "hard water film",
  "scale deposits",
]);

const GREASE_KITCHEN = new Set([
  "grease buildup",
  "grease splatter",
  "cooked-on grease",
  "cooked-on residue",
  "baked-on grease",
  "oil stains",
  "food residue",
  "burnt residue",
  "greasy film",
  "kitchen grease film",
]);

const STAIN_OXIDATION = new Set([
  "tannin stains",
  "mildew stains",
  "discoloration",
  "dye transfer",
  "mold growth",
  "mold staining",
  "odor retention",
]);

const GLASS_VISUAL = new Set(["streaking", "dust buildup", "product residue"]);

const BATHROOM_SOAP = new Set(["soap scum", "soap residue"]);

const ADHESIVE_WAX = new Set(["adhesive residue", "sticky residue", "wax buildup", "light adhesive residue"]);

const DELICATE_STONE = new Set(["marble", "granite", "quartz", "sealed stone", "stone"]);

const VINEGAR_HARD_EXCLUDE_PROBLEMS = new Set(["limescale", "mineral deposits", "rust stains"]);

const DISINFECT_PROBLEMS = new Set([
  "bacteria buildup",
  "mold growth",
  "mildew growth",
  "biofilm",
  "mildew stains",
  "disinfection",
  "laundry disinfection",
]);

const MAINTAIN_PROBLEMS = new Set(["preventive maintenance"]);

const ENZYME_BIO_PROBLEMS = new Set([
  "urine",
  "pet odor",
  "organic stains",
  "bio-organic buildup",
  "odor retention",
  "laundry odor",
]);

/** Strong enzyme preference: biological / pet / laundry odor—not musty neutralization. */
const ENZYME_PREFERRED_PROBLEMS = new Set([
  "urine",
  "pet odor",
  "organic stains",
  "bio-organic buildup",
]);

const RESTORE_PROBLEMS = new Set([
  "limescale",
  "mineral deposits",
  "calcium buildup",
  "rust stains",
  "hard water stains",
  "hard water film",
  "scale deposits",
]);

const RESIDUE_PROBLEMS = new Set(["adhesive residue", "sticky residue", "wax buildup", "light adhesive residue"]);

/** Maps encyclopedia problem strings to recommendation intent (replaces ad-hoc string sets at call sites). */
export function inferRecommendationIntent(problem: string): ProductCleaningIntent {
  const p = problem.toLowerCase().trim();
  if (DISINFECT_PROBLEMS.has(p)) return "disinfect";
  if (MAINTAIN_PROBLEMS.has(p)) return "maintain";
  if (RESTORE_PROBLEMS.has(p)) return "restore";
  if (RESIDUE_PROBLEMS.has(p)) return "remove_residue";
  return "clean";
}

/** Intent hint for method + problem playbooks (does not change scoring tables—routes intent like the method family). */
export function inferRecommendationIntentForMethodPlaybook(
  methodSlug: string,
  problemLibraryString: string,
): ProductCleaningIntent {
  if (methodSlug === "touchpoint-sanitization") return "disinfect";
  if (methodSlug === "hard-water-deposit-removal") return "restore";
  return inferRecommendationIntent(problemLibraryString);
}

function getScore(product: PublishedProductLike): number {
  return product.finalScore ?? product.score ?? product.rating?.finalScore ?? 0;
}

function isGlassClassSurface(surface: string): boolean {
  const s = surface.toLowerCase();
  return s === "glass" || s === "mirrors" || s === "shower glass" || s.includes("glass");
}

function isStainlessSteelSurface(surface: string): boolean {
  return surface.toLowerCase().includes("stainless");
}

function isToiletOnlySurface(surface: string): boolean {
  const s = surface.toLowerCase();
  return s === "toilet" || s === "toilets";
}

function isStoneFamilySurface(surface: string): boolean {
  return DELICATE_STONE.has(surface.toLowerCase().trim());
}

function isFloorSurface(surface: string): boolean {
  return surface.toLowerCase().includes("floor");
}

function isFiberSurface(surface: string): boolean {
  const s = surface.toLowerCase().trim();
  return (
    s === "carpet" ||
    s === "upholstery" ||
    s === "laundry" ||
    s === "fabrics" ||
    s === "fabric" ||
    s === "bedding" ||
    s === "towels" ||
    s === "delicates"
  );
}

const ACID_DESCALER_SLUGS = new Set([
  "clr-calcium-lime-rust",
  "lime-a-way-cleaner",
  "zep-calcium-lime-rust-remover",
]);

const ACID_TOILET_BOWL_SLUGS = new Set(["lysol-power-toilet-bowl-cleaner"]);

const DRAIN_OPENER_SLUGS = new Set([
  "drano-max-gel-drain-clog-remover",
  "liquid-plumr-clog-destroyer-plus-pipeguard",
]);

const OVEN_CLEANER_SLUGS = new Set([
  "easy-off-heavy-duty-oven-cleaner",
  "zep-oven-and-grill-cleaner",
]);

const OVEN_CLASS_PROBLEMS = new Set(["cooked-on grease", "burnt residue", "baked-on grease"]);

function isOvenClassSurface(surface: string): boolean {
  const s = surface.toLowerCase().trim();
  return s === "ovens" || s === "grills";
}

const BROAD_KITCHEN_DEGREASERS = new Set([
  "dawn-platinum-dish-spray",
  "krud-kutter-original-cleaner-degreaser",
  "method-heavy-duty-degreaser",
  "simple-green-all-purpose-cleaner",
  "simple-green-pro-hd",
]);

const ENZYME_PRODUCT_SLUGS = new Set([
  "natures-miracle-stain-and-odor-remover",
  "rocco-roxie-stain-odor-eliminator",
  "biokleen-bac-out-stain-odor-remover",
]);

const KITCHEN_HOOD_DEGREASER_SLUGS = new Set([
  "weiman-gas-range-cleaner-degreaser",
  "easy-off-kitchen-degreaser",
  "krud-kutter-kitchen-degreaser",
]);

const MOLD_CONTROL_SLUGS = new Set(["concrobium-mold-control", "mold-armor-rapid-clean-remediation"]);

const ODOR_NEUTRALIZER_SLUGS = new Set([
  "zero-odor-eliminator-spray",
  "fresh-wave-odor-removing-spray",
]);

/** Broad SKUs dampened when another non-broad product matches the same problem + surface. */
const BROAD_CONTAINMENT_SLUGS = new Set([
  "simple-green-pro-hd",
  "krud-kutter-original-cleaner-degreaser",
  "method-heavy-duty-degreaser",
  "pine-sol-original-multi-surface-cleaner",
]);

/** Broad concentrate / multi-surface degreasers dampened when specialists or finish contexts apply. */
const BROAD_INDUSTRIAL_DEGREASERS = new Set([
  "simple-green-pro-hd",
  "krud-kutter-original-cleaner-degreaser",
  "method-heavy-duty-degreaser",
]);

const STAINLESS_POLISH_CLUSTER = new Set([
  "weiman-stainless-steel-cleaner-polish",
  "therapy-stainless-steel-cleaner-polish",
  "sprayway-stainless-steel-cleaner",
]);

/** When product declared intent matches scenario intent (after inference / override). */
export function intentAlignmentBoost(
  product: PublishedProductLike,
  effectiveIntent: ProductCleaningIntent,
): number {
  if (product.intent !== effectiveIntent) return 0;
  switch (effectiveIntent) {
    case "disinfect":
      return 12;
    case "restore":
      return 10;
    case "remove_residue":
      return 8;
    case "clean":
      return 4;
    case "maintain":
      return 6;
    default:
      return 0;
  }
}

/** Exported for related-product ranking so intent rules stay aligned with recommendations. */
export function intentChemistryAdjustment(product: PublishedProductLike, effectiveIntent: ProductCleaningIntent): number {
  const chem = (product.chemicalClass ?? "").toLowerCase().trim();
  const slug = product.slug;
  if (effectiveIntent !== "disinfect") return 0;

  if (ACID_TOILET_BOWL_SLUGS.has(slug)) return 10;

  if (chem === "disinfectant" || chem === "bleach") return 10;
  if (chem === "enzyme") return -10;
  if (chem === "mold_control") return 4;
  if (
    chem === "surfactant" ||
    chem === "acid" ||
    chem === "solvent_blend" ||
    chem === "oxygen_bleach" ||
    chem === "ammonia_blend" ||
    chem === "alkaline" ||
    chem === "stainless_polish"
  ) {
    return -10;
  }
  return 0;
}

function problemSurfaceFlags(problem: string) {
  const p = problem.toLowerCase();
  return {
    mineralHeavy: MINERAL_HEAVY.has(p),
    greaseKitchen: GREASE_KITCHEN.has(p),
    stainOx: STAIN_OXIDATION.has(p),
    glassVisual: GLASS_VISUAL.has(p),
    bathSoap: BATHROOM_SOAP.has(p),
    adhesive: ADHESIVE_WAX.has(p),
    odorOnly: p === "odor retention",
    mildFilm: p === "soap residue" || p === "soap scum" || p === "hard water film",
  };
}

export function recommendationAdjustment(
  product: PublishedProductLike,
  problem: string,
  surface: string,
  effectiveIntent: ProductCleaningIntent,
  catalog?: readonly PublishedProductLike[],
): number {
  const slug = product.slug;
  const s = surface.toLowerCase();
  const pLower = problem.toLowerCase().trim();
  const chem = (product.chemicalClass ?? "").toLowerCase().trim();
  const flags = problemSurfaceFlags(problem);
  let adj = intentChemistryAdjustment(product, effectiveIntent);

  const stoneFamily = isStoneFamilySurface(surface);
  const floorCtx = isFloorSurface(surface);
  const fiberCtx = isFiberSurface(surface);
  const enzymeCtx = ENZYME_BIO_PROBLEMS.has(pLower);
  const mustyCtx = pLower === "musty odor";

  if (mustyCtx) {
    if (slug === "zero-odor-eliminator-spray") adj += 26;
    if (slug === "fresh-wave-odor-removing-spray") adj += 24;
    if (slug === "febreze-fabric-refresher-antimicrobial") adj += 15;
    if (slug === "odoban-fabric-laundry-spray") adj += 12;
    if (ENZYME_PRODUCT_SLUGS.has(slug)) adj -= 18;
    if (chem === "disinfectant" || chem === "bleach") adj -= 20;
    if (chem === "alkaline" || chem === "caustic") adj -= 18;
    if (chem === "acid") adj -= 22;
  }

  if (ODOR_NEUTRALIZER_SLUGS.has(slug)) {
    if (flags.greaseKitchen || flags.mineralHeavy) adj -= 24;
    if (ENZYME_PREFERRED_PROBLEMS.has(pLower)) adj -= 22;
    if (pLower === "laundry odor") adj -= 14;
  }

  if (
    pLower === "bio-organic buildup" &&
    effectiveIntent === "disinfect" &&
    (chem === "disinfectant" || chem === "bleach")
  )
    adj += 6;

  if (effectiveIntent === "maintain") {
    if (chem === "acid") adj -= 14;
    if (chem === "bleach") adj -= 12;
    if (chem === "caustic") adj -= 20;
  }

  if (stoneFamily) {
    if (chem === "acid") adj -= 22;
    if (chem === "oxygen_bleach") adj -= 8;
    if (slug === "bar-keepers-friend-cleanser") adj -= 18;
    if (chem === "neutral" && (slug === "granite-gold-daily-cleaner" || slug === "stonetech-daily-cleaner"))
      adj += 18;
  }

  if (floorCtx) {
    if (chem === "acid") adj -= 16;
    if (chem === "solvent_blend") adj -= 18;
    if (chem === "bleach") adj -= 14;
    if (chem === "ammonia_blend") adj -= 10;
    if (chem === "caustic") adj -= 25;
    const floorMaintProblems =
      pLower === "floor residue" ||
      pLower === "dust buildup" ||
      pLower === "dullness" ||
      pLower === "soap residue" ||
      pLower === "product residue";

    if (slug === "bona-hardwood-floor-cleaner") {
      if (floorMaintProblems && s.includes("hardwood")) adj += 22;
      else if (floorMaintProblems && floorCtx) adj += 10;
      if (s.includes("vinyl") || s.includes("luxury vinyl")) adj -= 10;
    }

    if (slug === "bona-hard-surface-floor-cleaner") {
      const hardSurfaceCtx =
        s.includes("vinyl") ||
        s.includes("luxury vinyl") ||
        s.includes("tile") ||
        s === "laminate" ||
        s.includes("hard-surface") ||
        s === "ceramic";
      if (floorMaintProblems && hardSurfaceCtx && !s.includes("hardwood")) adj += 22;
      if (s.includes("hardwood")) adj -= 16;
    }

    if (slug === "zep-neutral-ph-floor-cleaner") {
      if (floorMaintProblems && floorCtx) adj += 14;
      if (floorMaintProblems && s === "floors") adj += 6;
    }

    if (slug === "murphy-oil-soap-wood-cleaner") {
      const woodLike =
        s.includes("sealed wood") ||
        s.includes("hardwood") ||
        s.includes("laminate") ||
        s === "cabinets" ||
        s.includes("finished wood");
      if (
        woodLike &&
        (pLower === "floor residue" ||
          pLower === "dust buildup" ||
          pLower === "dullness" ||
          pLower === "soap residue" ||
          pLower === "product residue")
      )
        adj += 16;
    }
    if (slug === "rejuvenate-luxury-vinyl-floor-cleaner") {
      if (
        (s.includes("vinyl") || s.includes("luxury vinyl")) &&
        (pLower === "floor residue" ||
          pLower === "dust buildup" ||
          pLower === "dullness" ||
          pLower === "soap residue" ||
          pLower === "product residue")
      )
        adj += 18;
    }
    if (
      slug === "dawn-platinum-dish-spray" ||
      slug === "krud-kutter-original-cleaner-degreaser" ||
      slug === "method-heavy-duty-degreaser"
    ) {
      adj -= 14;
    }
  }

  const cooktopHoodCtx =
    s.includes("cooktop") ||
    s.includes("range hood") ||
    s === "stainless steel appliances";
  const rangeGreaseProblem =
    flags.greaseKitchen ||
    pLower === "greasy film" ||
    pLower === "food residue" ||
    pLower === "light film" ||
    pLower === "light dust";
  const rangeGreaseCtx = cooktopHoodCtx && rangeGreaseProblem;
  if (
    (slug === "dawn-platinum-dish-spray" ||
      slug === "krud-kutter-original-cleaner-degreaser" ||
      slug === "method-heavy-duty-degreaser") &&
    rangeGreaseCtx
  ) {
    adj -= 12;
  }
  if (BROAD_KITCHEN_DEGREASERS.has(slug) && rangeGreaseCtx) adj -= 14;
  if (KITCHEN_HOOD_DEGREASER_SLUGS.has(slug)) {
    if (rangeGreaseCtx) adj += 24;
    if (cooktopHoodCtx && pLower === "cooked-on grease" && !isOvenClassSurface(surface)) adj += 12;
    if (s.includes("stainless") && flags.greaseKitchen && !isOvenClassSurface(surface)) adj += 8;
  }

  const heavyCooktopSoil =
    pLower === "greasy film" ||
    pLower === "kitchen grease film" ||
    pLower === "grease buildup" ||
    pLower === "cooked-on grease" ||
    pLower === "baked-on grease" ||
    pLower === "burnt residue";
  const cooktopLightCosmetic =
    s.includes("cooktop") &&
    !heavyCooktopSoil &&
    (pLower === "smudge marks" ||
      pLower === "light film" ||
      pLower === "light dust" ||
      pLower === "streaking" ||
      pLower === "product residue");
  if (cooktopLightCosmetic) {
    if (slug === "cerama-bryte-cooktop-cleaner") adj += 24;
    if (OVEN_CLEANER_SLUGS.has(slug)) adj -= 30;
    if (BROAD_INDUSTRIAL_DEGREASERS.has(slug) || slug === "dawn-platinum-dish-spray") adj -= 18;
    if (KITCHEN_HOOD_DEGREASER_SLUGS.has(slug)) adj -= 12;
  }

  if (fiberCtx) {
    const listsFiber = product.compatibleSurfaces?.some(
      (x) => x === "carpet" || x === "upholstery" || x === "fabric" || x === "fabrics",
    );
    if (!listsFiber) adj -= 22;

    if (slug === "resolve-carpet-cleaner-spray" || slug === "folex-instant-carpet-spot-remover") {
      if (
        pLower === "organic stains" ||
        pLower === "food residue" ||
        pLower === "tannin stains" ||
        pLower === "dye transfer"
      )
        adj += 18;
    }
    if (slug === "oxiclean-versatile-stain-remover" || slug === "oxiclean-max-force-spray") adj -= 8;
    if (ACID_DESCALER_SLUGS.has(slug) || slug === "bar-keepers-friend-cleanser") adj -= 28;
    if (slug === "dawn-platinum-dish-spray" || slug === "krud-kutter-original-cleaner-degreaser") adj -= 16;
  }

  if (enzymeCtx) {
    if (slug === "natures-miracle-stain-and-odor-remover") {
      adj += 18;
      if (fiberCtx && (s === "carpet" || s === "upholstery")) adj += 4;
    }
    if (slug === "rocco-roxie-stain-odor-eliminator") {
      adj += 20;
      if (fiberCtx && (s === "carpet" || s === "upholstery")) adj += 2;
    }
    if (slug === "biokleen-bac-out-stain-odor-remover") {
      adj += 17;
      if (s === "laundry" || s === "fabrics" || s === "bedding") adj += 3;
    }
    if (chem === "disinfectant" || chem === "bleach") {
      if (slug === "odoban-disinfectant-odor-eliminator" && pLower === "odor retention") adj -= 5;
      else adj -= 15;
    }
    if (
      chem === "surfactant" &&
      slug !== "natures-miracle-stain-and-odor-remover" &&
      slug !== "rocco-roxie-stain-odor-eliminator" &&
      slug !== "biokleen-bac-out-stain-odor-remover"
    )
      adj -= 12;
    if (chem === "acid") adj -= 18;
    if (slug === "oxiclean-versatile-stain-remover" || slug === "oxiclean-max-force-spray") adj -= 12;
    if (slug === "odoban-disinfectant-odor-eliminator" && pLower !== "odor retention") adj -= 10;
  }

  if (ENZYME_PRODUCT_SLUGS.has(slug) && !enzymeCtx) adj -= 36;

  if (slug === "biokleen-bac-out-stain-odor-remover") {
    const coreFiber =
      s === "carpet" || s === "upholstery" || s === "laundry" || s === "fabrics" || s === "bedding";
    if (enzymeCtx && !coreFiber) adj -= 10;
    if (enzymeCtx && pLower === "odor retention" && !coreFiber) adj -= 8;
    if (effectiveIntent === "disinfect") adj -= 12;
  }

  if (slug === "odoban-disinfectant-odor-eliminator") {
    if (pLower === "odor retention") adj += 8;
    if (pLower === "disinfection" || pLower === "bacteria buildup") adj -= 10;
  }

  if (slug === "wet-and-forget-shower-cleaner") {
    if (effectiveIntent === "maintain") adj += 21;
    if (effectiveIntent === "restore") adj -= 26;
    if (flags.greaseKitchen || flags.mineralHeavy) adj -= 24;
  }

  if (slug === "method-daily-shower-spray") {
    const showerCtx =
      s.includes("shower") || s.includes("tile") || s === "porcelain" || s === "ceramic" || s === "chrome";
    if (effectiveIntent === "maintain" && showerCtx) adj += 18;
    if (effectiveIntent === "restore" || flags.mineralHeavy) adj -= 26;
    if (flags.bathSoap && effectiveIntent === "maintain") adj += 6;
  }

  if (slug === "tilex-daily-shower-cleaner") {
    const showerCtx =
      s.includes("shower") || s.includes("tile") || s === "porcelain" || s === "ceramic" || s === "chrome";
    if (effectiveIntent === "maintain" && showerCtx) adj += 18;
    if (effectiveIntent === "restore" || flags.mineralHeavy) adj -= 26;
    if (flags.bathSoap && effectiveIntent === "maintain") adj += 8;
  }

  if (slug === "scrubbing-bubbles-daily-shower-cleaner") {
    const showerCtx =
      s.includes("shower") || s.includes("tile") || s === "porcelain" || s === "ceramic" || s === "chrome";
    if (effectiveIntent === "maintain" && showerCtx) adj += 17;
    if (effectiveIntent === "restore" || flags.mineralHeavy) adj -= 26;
    if (flags.bathSoap && effectiveIntent === "maintain") adj += 10;
  }

  if (slug === "method-wood-for-good-daily-clean") {
    const woodCtx =
      s.includes("finished wood") ||
      s.includes("sealed wood") ||
      s.includes("cabinet") ||
      s === "cabinets" ||
      s.includes("cabinet fronts");
    if (
      (pLower === "light dust" ||
        pLower === "light film" ||
        pLower === "dust buildup" ||
        pLower === "smudge marks") &&
      woodCtx
    )
      adj += 17;
    if (floorCtx && s.includes("hardwood")) adj -= 12;
    if (flags.mineralHeavy || flags.greaseKitchen) adj -= 18;
  }

  if (STAINLESS_POLISH_CLUSTER.has(slug)) {
    const ssCtx =
      s.includes("stainless") ||
      s === "appliances" ||
      s === "finished stainless" ||
      s === "stainless steel appliances" ||
      s.includes("finished appliances");
    if (
      ssCtx &&
      (pLower === "fingerprints" ||
        pLower === "surface haze" ||
        pLower === "smudge marks" ||
        pLower === "light film" ||
        pLower === "streaking" ||
        pLower === "dullness" ||
        pLower === "product residue")
    )
      adj += 22;
    if (flags.mineralHeavy || pLower === "rust stains" || flags.greaseKitchen || pLower === "burnt residue")
      adj -= 26;
    if (pLower === "baked-on grease" || pLower === "cooked-on grease") adj -= 18;
  }

  if (slug === "odoban-fabric-laundry-spray") {
    const fabricSurf =
      s === "laundry" ||
      s === "fabrics" ||
      s === "fabric" ||
      s === "bedding" ||
      s === "towels" ||
      s === "delicates" ||
      s === "upholstery";
    if (
      fabricSurf &&
      (pLower === "laundry odor" || pLower === "odor retention" || pLower === "pet odor" || pLower === "musty odor")
    )
      adj += pLower === "musty odor" || pLower === "pet odor" ? 20 : 18;
    if (!fabricSurf) adj -= 40;
    if (effectiveIntent === "disinfect" && pLower === "disinfection") adj -= 14;
  }

  if (slug === "febreze-fabric-refresher-antimicrobial") {
    const fabricSurf =
      s === "laundry" ||
      s === "fabrics" ||
      s === "fabric" ||
      s === "bedding" ||
      s === "towels" ||
      s === "delicates" ||
      s === "upholstery";
    if (fabricSurf && (pLower === "musty odor" || pLower === "laundry odor" || pLower === "odor retention"))
      adj += 22;
    if (fabricSurf && pLower === "pet odor") adj += 14;
    if (!fabricSurf) adj -= 44;
    if (pLower === "laundry disinfection") adj -= 28;
    if (effectiveIntent === "disinfect" && pLower === "disinfection") adj -= 20;
  }

  if (slug === "oil-eater-cleaner-degreaser" || slug === "purple-power-industrial-strength-cleaner-degreaser") {
    const outdoorCtx =
      s === "exterior concrete" ||
      s === "outdoor concrete" ||
      s === "concrete" ||
      s.includes("concrete");
    if (outdoorCtx && (flags.greaseKitchen || pLower === "oil stains" || pLower === "greasy film")) adj += 20;
    if (outdoorCtx) adj += 6;
    if (effectiveIntent === "disinfect") adj -= 14;
  }

  if (slug === "concrobium-mold-control") {
    const moldCtx =
      pLower === "mold growth" ||
      pLower === "mildew stains" ||
      pLower === "mildew growth" ||
      pLower === "biofilm" ||
      pLower === "mold staining" ||
      (pLower === "preventive maintenance" && (s.includes("shower") || s.includes("tile")));
    if (moldCtx) adj += 17;
    if (pLower === "mold staining") adj += 5;
    if (pLower === "urine" || pLower === "pet odor" || pLower === "organic stains" || pLower === "musty odor")
      adj -= 28;
    if (flags.mineralHeavy) adj -= 22;
    if (effectiveIntent === "disinfect" && pLower === "disinfection") adj -= 16;
  }

  if (slug === "mold-armor-rapid-clean-remediation") {
    const moldCtx =
      pLower === "mold growth" ||
      pLower === "mildew stains" ||
      pLower === "mildew growth" ||
      pLower === "biofilm" ||
      pLower === "mold staining";
    if (moldCtx) adj += 18;
    if (pLower === "mold staining" || pLower === "mildew growth") adj += 12;
    if (pLower === "preventive maintenance" && (s.includes("shower") || s.includes("tile"))) adj += 8;
    if (pLower === "urine" || pLower === "pet odor" || pLower === "organic stains" || pLower === "musty odor")
      adj -= 30;
    if (flags.mineralHeavy) adj -= 24;
    if (effectiveIntent === "disinfect" && pLower === "disinfection") adj -= 12;
  }

  if (slug === "pledge-multisurface-cleaner" || slug === "pledge-everyday-clean-multisurface") {
    const cabinetCtx =
      s.includes("cabinet") ||
      s.includes("cabinet fronts") ||
      s.includes("finished wood") ||
      s.includes("sealed wood") ||
      s.includes("painted trim") ||
      s === "laminate";
    if (
      (pLower === "light dust" ||
        pLower === "light film" ||
        pLower === "dust buildup" ||
        pLower === "smudge marks") &&
      cabinetCtx
    )
      adj += slug === "pledge-everyday-clean-multisurface" ? 17 : 16;
    if (flags.mineralHeavy || flags.greaseKitchen) adj -= 18;
  }

  if (slug === "granite-gold-daily-cleaner" || slug === "stonetech-daily-cleaner") {
    if (flags.mineralHeavy || flags.greaseKitchen) adj -= 28;
    if (flags.adhesive) adj -= 22;
  }

  const onDelicateStone = DELICATE_STONE.has(s);

  if (slug === "heinz-distilled-white-vinegar-5pct") {
    if (flags.mineralHeavy && !flags.mildFilm) adj -= 18;
    if (flags.mineralHeavy && (problem === "limescale" || problem === "rust stains" || problem === "calcium buildup"))
      adj -= 12;
    if (flags.greaseKitchen) adj -= 10;
    if (effectiveIntent === "disinfect" && !flags.odorOnly) adj -= 8;
    if (flags.stainOx && !flags.odorOnly) adj -= 4;
    if (onDelicateStone) adj -= 25;
    if (flags.mildFilm && !flags.mineralHeavy) adj += 4;
    if (flags.odorOnly) adj += 2;
  }

  if (ACID_DESCALER_SLUGS.has(slug)) {
    if (flags.mineralHeavy) adj += slug === "zep-calcium-lime-rust-remover" ? 14 : 12;
    if (isGlassClassSurface(surface)) adj += 10;
    if (flags.greaseKitchen || flags.adhesive) adj -= 14;
    if (flags.glassVisual && !flags.mineralHeavy) adj -= 8;
    if (onDelicateStone) adj -= 30;
    if (
      slug === "lime-a-way-cleaner" &&
      (s.includes("tile") || s === "porcelain" || s === "bathtubs" || s === "sinks" || s === "toilets")
    )
      adj += 4;
  }

  if (slug === "bar-keepers-friend-cleanser") {
    const rustTarnish =
      problem === "rust stains" ||
      problem === "tarnish" ||
      problem === "oxidation" ||
      problem === "discoloration" ||
      problem === "mineral deposits";
    if (
      isStainlessSteelSurface(surface) &&
      (pLower === "fingerprints" || pLower === "smudge marks" || pLower === "surface haze")
    )
      adj -= 18;
    if (rustTarnish && !onDelicateStone) adj += 10;
    if (flags.mineralHeavy) adj += 4;
    if (isGlassClassSurface(surface)) adj -= 12;
    if (isStainlessSteelSurface(surface)) adj += 10;
    if (onDelicateStone) adj -= 22;
    if (flags.greaseKitchen && !rustTarnish) adj -= 8;
    if (s.includes("laminate")) adj -= 6;
  }

  if (slug === "dawn-platinum-dish-spray") {
    if (flags.greaseKitchen) adj += 12;
    if (flags.mineralHeavy || flags.adhesive) adj -= 16;
    if (effectiveIntent === "disinfect") adj -= 8;
    if (flags.glassVisual && !flags.greaseKitchen) adj -= 4;
  }

  if (slug === "krud-kutter-original-cleaner-degreaser") {
    if (flags.greaseKitchen) adj += 14;
    if (flags.mineralHeavy || flags.adhesive) adj -= 14;
    if (effectiveIntent === "disinfect") adj -= 8;
    if (flags.glassVisual && !flags.greaseKitchen) adj -= 4;
  }

  if (slug === "method-heavy-duty-degreaser") {
    if (flags.greaseKitchen) adj += 13;
    if (flags.mineralHeavy || flags.adhesive) adj -= 15;
    if (effectiveIntent === "disinfect") adj -= 8;
    if (flags.glassVisual && !flags.greaseKitchen) adj -= 4;
  }

  if (slug === "simple-green-all-purpose-cleaner") {
    if (flags.greaseKitchen) adj += 10;
    if (flags.mineralHeavy || flags.adhesive) adj -= 18;
    if (effectiveIntent === "disinfect") adj -= 10;
    if (flags.glassVisual && !flags.greaseKitchen) adj -= 6;
  }

  if (slug === "simple-green-pro-hd") {
    if (flags.greaseKitchen || pLower === "cooked-on grease") adj += 15;
    if (flags.mineralHeavy || flags.adhesive) adj -= 14;
    if (effectiveIntent === "disinfect") adj -= 12;
    if (flags.glassVisual && !flags.greaseKitchen) adj -= 6;
  }

  if (slug === "pine-sol-original-multi-surface-cleaner") {
    if (effectiveIntent === "disinfect") adj += 2;
    if (
      effectiveIntent === "disinfect" &&
      (pLower === "disinfection" || pLower === "bacteria buildup" || pLower === "mold growth" || pLower === "laundry disinfection")
    )
      adj -= 12;
    if (flags.mineralHeavy) adj -= 14;
    if (flags.greaseKitchen && effectiveIntent !== "disinfect") adj -= 10;
    if (onDelicateStone) adj -= 14;
    if (pLower === "odor retention" || pLower === "pet odor") adj += 6;
  }

  if (slug === "microban-24-hour-disinfectant-sanitizing-spray") {
    if (effectiveIntent === "disinfect") adj += 12;
    if (
      pLower === "disinfection" ||
      pLower === "bacteria buildup" ||
      pLower === "mold growth" ||
      pLower === "mildew stains"
    )
      adj += 4;
    if (flags.greaseKitchen || flags.mineralHeavy) adj -= 10;
    if (onDelicateStone) adj -= 12;
  }

  if (slug === "clorox-clean-up-cleaner-bleach") {
    if (effectiveIntent === "disinfect") adj += 9;
    if (flags.greaseKitchen || flags.adhesive) adj -= 10;
    if (onDelicateStone) adj -= 18;
  }

  if (slug === "lysol-laundry-sanitizer" || slug === "clorox-laundry-sanitizer") {
    const laundrySurface =
      s === "laundry" ||
      s === "fabrics" ||
      s === "fabric" ||
      s === "bedding" ||
      s === "towels" ||
      s === "delicates";
    if (!laundrySurface) adj -= 44;
    if (effectiveIntent === "disinfect" && laundrySurface) adj += 14;
    if (pLower === "laundry disinfection") adj += 12;
    if (pLower === "laundry odor") adj += 6;
    if (pLower === "musty odor") adj -= 22;
    if (pLower === "odor retention" && s !== "laundry" && s !== "garbage cans") adj -= 10;
    if (flags.greaseKitchen || flags.mineralHeavy) adj -= 20;
  }

  if (slug === "easy-off-heavy-duty-oven-cleaner" || slug === "zep-oven-and-grill-cleaner") {
    if (OVEN_CLASS_PROBLEMS.has(pLower)) adj += 22;
    if (flags.mineralHeavy || effectiveIntent === "disinfect") adj -= 32;
    if (slug === "zep-oven-and-grill-cleaner" && (pLower === "baked-on grease" || s === "grills")) adj += 4;
  }

  if (slug === "windex-original-glass-cleaner") {
    if (flags.glassVisual && (s.includes("glass") || s === "mirrors" || s === "shower glass")) adj += 14;
    if (
      (s.includes("stainless") || s === "finished stainless" || s.includes("finished appliances")) &&
      (pLower === "fingerprints" || pLower === "smudge marks" || pLower === "surface haze")
    )
      adj -= 14;
    if (flags.mineralHeavy) adj -= 18;
    if (flags.greaseKitchen) adj -= 12;
    if (flags.bathSoap && !flags.glassVisual) adj -= 6;
  }

  if (slug === "sprayway-glass-cleaner") {
    if (flags.glassVisual && (s.includes("glass") || s === "mirrors" || s === "shower glass")) adj += 15;
    if (flags.mineralHeavy) adj -= 18;
    if (flags.greaseKitchen) adj -= 12;
    if (flags.bathSoap && !flags.glassVisual) adj -= 6;
  }

  if (slug === "invisible-glass-premium-glass-cleaner") {
    if (flags.glassVisual && (s.includes("glass") || s === "mirrors" || s === "shower glass")) adj += 16;
    if (flags.mineralHeavy) adj -= 18;
    if (flags.greaseKitchen) adj -= 12;
    if (flags.bathSoap && !flags.glassVisual) adj -= 5;
  }

  if (slug === "goo-gone-original-liquid") {
    if (pLower === "light adhesive residue") adj += 8;
    if (pLower === "sticky residue") adj += 17;
    if (pLower === "adhesive residue") adj += 11;
    if (flags.adhesive && pLower !== "sticky residue" && pLower !== "light adhesive residue") adj += 10;
    if (flags.mineralHeavy || effectiveIntent === "disinfect") adj -= 18;
    if (onDelicateStone) adj -= 14;
    if (s.includes("painted") || s === "laminate") adj -= 6;
  }

  if (slug === "goo-gone-spray-gel") {
    if (pLower === "light adhesive residue") adj += 19;
    if (pLower === "sticky residue") adj += 16;
    if (pLower === "adhesive residue") adj += 9;
    if (flags.mineralHeavy || effectiveIntent === "disinfect") adj -= 18;
    if (onDelicateStone) adj -= 10;
    if (s.includes("plastic") || s.includes("glass") || s.includes("painted") || s === "laminate") adj += 5;
  }

  if (slug === "un-du-adhesive-remover") {
    const lightCtx =
      (pLower === "adhesive residue" ||
        pLower === "sticky residue" ||
        pLower === "light adhesive residue") &&
      (s.includes("plastic") || s === "plastic" || s.includes("painted") || s === "laminate" || s.includes("glass"));
    if (lightCtx) adj += 16;
    if (flags.mineralHeavy || effectiveIntent === "disinfect") adj -= 16;
    if (isStoneFamilySurface(surface)) adj -= 20;
  }

  if (slug === "goof-off-professional-strength-remover") {
    if (flags.adhesive) adj += 18;
    if (flags.mineralHeavy || effectiveIntent === "disinfect") adj -= 22;
    if (onDelicateStone) adj -= 16;
    if (s.includes("painted") || s === "laminate") adj -= 8;
  }

  if (slug === "3m-adhesive-remover") {
    if (flags.adhesive) adj += 15;
    if (flags.mineralHeavy || effectiveIntent === "disinfect") adj -= 20;
    if (onDelicateStone) adj -= 14;
    if (s.includes("painted") || s === "laminate") adj -= 5;
  }

  if (slug === "lysol-disinfectant-spray") {
    if (effectiveIntent === "disinfect") adj += 10;
    if (flags.greaseKitchen || flags.adhesive || flags.mineralHeavy) adj -= 10;
    if (flags.odorOnly && effectiveIntent !== "disinfect") adj += 3;
  }

  if (slug === "clorox-disinfecting-wipes") {
    if (effectiveIntent === "disinfect") adj += 6;
    if (flags.greaseKitchen || flags.adhesive || flags.mineralHeavy) adj -= 8;
  }

  if (slug === "seventh-generation-disinfecting-multi-surface-cleaner") {
    if (effectiveIntent === "disinfect") adj += 5;
    if (flags.greaseKitchen || flags.adhesive || flags.mineralHeavy) adj -= 8;
    if (flags.odorOnly && effectiveIntent === "disinfect") adj += 3;
  }

  if (slug === "clorox-toilet-bowl-cleaner-bleach") {
    const toiletOnly = isToiletOnlySurface(surface);
    if (toiletOnly && (effectiveIntent === "disinfect" || flags.mineralHeavy || problem === "discoloration"))
      adj += 14;
    if (!toiletOnly) adj -= 40;
    if (flags.greaseKitchen || flags.adhesive || s === "countertops") adj -= 12;
    if (toiletOnly && flags.mineralHeavy) adj -= 6;
  }

  if (slug === "lysol-power-toilet-bowl-cleaner") {
    const toiletOnly = isToiletOnlySurface(surface);
    if (toiletOnly && flags.mineralHeavy) adj += 8;
    if (!toiletOnly) adj -= 40;
    if (flags.greaseKitchen || flags.adhesive || s === "countertops") adj -= 12;
  }

  if (slug === "zep-shower-tub-tile-cleaner") {
    if (flags.bathSoap || flags.stainOx) adj += 10;
    if (flags.mineralHeavy && (problem === "hard water stains" || problem === "soap scum")) adj += 6;
    if (problem === "limescale" || problem === "calcium buildup" || problem === "rust stains") adj -= 8;
    if (flags.greaseKitchen && !flags.bathSoap) adj -= 12;
    if (s.includes("kitchen") || s === "countertops") adj -= 4;
  }

  if (slug === "lysol-power-bathroom-cleaner") {
    if (flags.bathSoap || flags.stainOx) adj += 10;
    if (effectiveIntent === "disinfect" && (flags.bathSoap || problem === "bacteria buildup")) adj += 6;
    if (problem === "limescale" || problem === "calcium buildup" || problem === "rust stains") adj -= 10;
    if (flags.greaseKitchen && !flags.bathSoap) adj -= 10;
  }

  if (slug === "scrubbing-bubbles-bathroom-grime-fighter") {
    if (flags.bathSoap || flags.stainOx) adj += 8;
    if (problem === "limescale" || problem === "calcium buildup" || problem === "rust stains") adj -= 12;
    if (flags.greaseKitchen && !flags.bathSoap) adj -= 10;
    if (s.includes("kitchen") || s === "countertops") adj -= 4;
  }

  if (slug === "oxiclean-versatile-stain-remover") {
    if (flags.stainOx && !flags.greaseKitchen) adj += 10;
    if (flags.greaseKitchen || flags.mineralHeavy) adj -= 14;
    if (flags.adhesive) adj -= 10;
    if (problem === "odor retention") adj += 6;
  }

  if (slug === "oxiclean-max-force-spray") {
    if (problem === "tannin stains" || problem === "dye transfer" || problem === "food residue") adj += 12;
    if (flags.stainOx && !flags.greaseKitchen) adj += 8;
    if (flags.greaseKitchen || flags.mineralHeavy) adj -= 12;
    if (flags.adhesive) adj -= 10;
    if (problem === "odor retention") adj -= 4;
  }

  if (BROAD_INDUSTRIAL_DEGREASERS.has(slug)) {
    if (rangeGreaseCtx) {
      if (slug === "simple-green-pro-hd") adj -= 24;
      else adj -= 10;
    }
    if (effectiveIntent === "maintain" && !flags.greaseKitchen) {
      if (slug === "simple-green-pro-hd") adj -= 16;
      else adj -= 7;
    }
    const finishSens =
      s.includes("cabinet") ||
      s.includes("cabinet fronts") ||
      s.includes("finished wood") ||
      s.includes("sealed wood") ||
      s.includes("granite") ||
      s.includes("marble") ||
      s.includes("quartz") ||
      s.includes("sealed stone") ||
      s.includes("shower glass") ||
      s.includes("painted") ||
      s.includes("painted trim") ||
      s === "mirrors" ||
      s === "glass" ||
      s.includes("finished appliances") ||
      s.includes("finished stainless");
    if (finishSens && !flags.greaseKitchen) {
      if (slug === "simple-green-pro-hd") adj -= 12;
      else adj -= 5;
    }
    const ssPolishCtx =
      (pLower === "fingerprints" ||
        pLower === "surface haze" ||
        pLower === "smudge marks" ||
        pLower === "streaking" ||
        pLower === "dullness") &&
      (s.includes("stainless") ||
        s === "finished stainless" ||
        s === "stainless steel appliances" ||
        s.includes("finished appliances"));
    if (ssPolishCtx) {
      if (slug === "simple-green-pro-hd") adj -= 20;
      else adj -= 9;
    }
  }

  if (catalog && catalog.length > 0 && BROAD_CONTAINMENT_SLUGS.has(slug)) {
    const pineNeedsDisinfect =
      slug === "pine-sol-original-multi-surface-cleaner" && effectiveIntent !== "disinfect";
    if (!pineNeedsDisinfect) {
      const hasNonBroadPeer = catalog.some(
        (p) =>
          p.slug !== slug &&
          !BROAD_CONTAINMENT_SLUGS.has(p.slug) &&
          Boolean(p.compatibleProblems?.includes(problem)) &&
          Boolean(p.compatibleSurfaces?.includes(surface)),
      );
      if (hasNonBroadPeer) {
        if (slug === "simple-green-pro-hd") adj -= 12;
        else if (slug === "pine-sol-original-multi-surface-cleaner") adj -= 8;
        else adj -= 8;
      }
    }
  }

  return adj;
}

export function getRecommendedProducts({
  problem,
  surface,
  limit = 3,
  intent: intentOverride,
}: RecommendationInput): PublishedProductLike[] {
  const products = getAllPublishedProducts() as PublishedProductLike[];
  const effectiveIntent = intentOverride ?? inferRecommendationIntent(problem);
  const pNorm = problem.toLowerCase().trim();

  return products
    .map((product) => {
      if (
        product.slug === "heinz-distilled-white-vinegar-5pct" &&
        VINEGAR_HARD_EXCLUDE_PROBLEMS.has(pNorm)
      ) {
        return null;
      }

      if (
        DRAIN_OPENER_SLUGS.has(product.slug) &&
        (surface.toLowerCase().trim() !== "drains" || pNorm !== "clog")
      ) {
        return null;
      }

      if (
        OVEN_CLEANER_SLUGS.has(product.slug) &&
        (!OVEN_CLASS_PROBLEMS.has(pNorm) || !isOvenClassSurface(surface))
      ) {
        return null;
      }

      if (
        KITCHEN_HOOD_DEGREASER_SLUGS.has(product.slug) &&
        isOvenClassSurface(surface) &&
        OVEN_CLASS_PROBLEMS.has(pNorm)
      ) {
        return null;
      }

      const problemMatch = product.compatibleProblems?.includes(problem) ? 1 : 0;
      const surfaceMatch = product.compatibleSurfaces?.includes(surface) ? 1 : 0;

      const base = problemMatch * 5 + surfaceMatch * 3 + getScore(product);
      const adjustment = recommendationAdjustment(product, problem, surface, effectiveIntent, products);
      const rank = base + adjustment + intentAlignmentBoost(product, effectiveIntent);

      return { product, rank, score: getScore(product), problemMatch, surfaceMatch };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .filter((item) => item.problemMatch || item.surfaceMatch)
    .sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      if (b.score !== a.score) return b.score - a.score;
      if (
        ENZYME_PRODUCT_SLUGS.has(a.product.slug) &&
        ENZYME_PRODUCT_SLUGS.has(b.product.slug)
      ) {
        const order = [
          "natures-miracle-stain-and-odor-remover",
          "rocco-roxie-stain-odor-eliminator",
          "biokleen-bac-out-stain-odor-remover",
        ];
        const h = (problem + "|" + surface).split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const rot = h % order.length;
        const cyc = [...order.slice(rot), ...order.slice(0, rot)];
        return cyc.indexOf(a.product.slug) - cyc.indexOf(b.product.slug);
      }
      return a.product.slug.localeCompare(b.product.slug);
    })
    .slice(0, limit)
    .map((item) => item.product);
}
