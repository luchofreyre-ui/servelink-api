import { CLEANING_EVIDENCE_CATALOG } from "./cleaningEvidenceCatalog";
import type { EvidenceRecord } from "./evidenceTypes";
import { TAXONOMY_PROBLEMS } from "./cleaningMatrixTaxonomy";

/**
 * Canonical buckets (keep catalog rows aligned):
 * - Natural stone: quartz / sealed marble / sealed granite map here (not separate quartz rows).
 * - Stainless steel: appliance and plated fixture care (chrome/brass/nickel alias here).
 * - Painted surfaces: trim, walls, cabinets; broad utility dust/soap on painted film.
 * - General household: bins, plastics, mixed utility where no finer substrate row exists.
 * - Soap residue: product residue aliases here; one chemistry story.
 * - Hard water film: water spots alias here; mineral deposits reserved for heavier scale.
 */
const SURFACE_ALIASES: Record<string, string> = {
  grout: "grout",
  "shower grout": "grout",
  "tile grout": "grout",
  caulking: "grout",

  glass: "glass",
  mirror: "glass",
  "shower door": "glass",
  "shower doors": "glass",
  "shower glass": "glass",

  tile: "tile",
  "ceramic tile": "tile",
  "porcelain tile": "tile",
  "shower pan": "tile",
  "shower pans": "tile",
  "bathtub surround": "tile",
  "bathtub surrounds": "tile",

  "stainless steel": "stainless steel",
  appliances: "stainless steel",
  sinks: "stainless steel",
  faucets: "stainless steel",
  "sink basins": "stainless steel",
  "chrome fixtures": "stainless steel",
  "brushed nickel": "stainless steel",
  "polished brass": "stainless steel",
  "copper fixtures": "stainless steel",
  dishwashers: "stainless steel",
  "microwave interiors": "stainless steel",
  "refrigerator interiors": "stainless steel",
  "refrigerator shelves": "stainless steel",
  "freezer drawers": "stainless steel",
  "laundry machines": "stainless steel",
  dryers: "stainless steel",
  "range hoods": "stainless steel",
  stovetops: "stainless steel",
  "oven interiors": "stainless steel",
  "oven doors": "stainless steel",

  "natural stone": "natural stone",
  "sealed stone": "natural stone",
  "sealed granite": "natural stone",
  "sealed marble": "natural stone",
  granite: "natural stone",
  marble: "natural stone",
  quartz: "natural stone",
  "quartz countertops": "natural stone",

  laminate: "laminate",
  "laminate counters": "laminate",

  "painted surfaces": "painted surfaces",
  "painted walls": "painted surfaces",
  "painted cabinets": "painted surfaces",
  baseboards: "painted surfaces",
  "door frames": "painted surfaces",
  "window tracks": "painted surfaces",
  "light switches": "painted surfaces",

  hardwood: "hardwood",
  wood: "hardwood",
  "unfinished wood": "hardwood",
  "sealed wood": "hardwood",
  "butcher block": "hardwood",

  "general household surfaces": "general household surfaces",
  "garbage cans": "general household surfaces",
  backsplashes: "tile",
  "tile floors": "tile",
  bathtubs: "tile",
  "kitchen cabinets": "painted surfaces",
  "glass cooktops": "tile",
  "glass shower doors": "glass",
  "hardwood floors": "hardwood",
  "shower tile": "tile",
};

// ==============================
// SATURATION ALIAS EXPANSION (canonical targets only)
// ==============================
const PROBLEM_ALIASES_CORE: Record<string, string> = {
  // ---------- HARD WATER / MINERALS ----------
  "hard water stains": "hard water film",
  "hard water buildup": "hard water film",
  "hard water residue": "hard water film",
  "white film": "hard water film",
  "cloudy film": "hard water film",
  "mineral haze": "hard water film",
  "water spots": "hard water film",
  "water spotting": "hard water film",
  "drip marks": "hard water film",
  "drying marks": "hard water film",
  "splash marks": "hard water film",

  "mineral deposits": "mineral deposits",
  "calcium buildup": "mineral deposits",
  "calcium residue": "mineral deposits",
  limescale: "mineral deposits",
  "scale deposits": "mineral deposits",
  "scale buildup": "mineral deposits",
  "chalky residue": "mineral deposits",
  "mineral crust": "mineral deposits",

  // ---------- SOAP ----------
  "soap scum": "soap residue",
  "soap residue": "soap residue",
  "product residue": "soap residue",

  // ---------- COMMON HISTORICAL LABELS (normalize into taxonomy) ----------
  "black residue": "discoloration",
  stains: "discoloration",
  grease: "grease buildup",
  // NOTE: do NOT hard-map "mold" here. Use preferred terms only if approved.

  // ---------- GREASE ----------
  "grease splatter": "grease buildup",
  "cooked-on grease": "grease buildup",
  "cooked-on residue": "grease buildup",
  "grease buildup": "grease buildup",
  "grease film": "grease buildup",
  "greasy film": "grease buildup",
  "oily film": "grease buildup",
  "cooking residue": "grease buildup",
  "kitchen film": "grease buildup",

  // ---------- MOLD / MILDEW ----------
  "mold growth": "mold growth",
  mildew: "mildew stains",
  "mildew stains": "mildew stains",

  // ---------- BIOFILM ----------
  biofilm: "biofilm",
  "pink slime": "biofilm",
  "pink residue": "biofilm",
  "slime buildup": "biofilm",
  "orange slime": "biofilm",
  "sink slime": "biofilm",
  "drain slime": "biofilm",
  "bacterial film": "biofilm",
  "organic slime": "biofilm",
  "slimy residue": "biofilm",
  "bio residue": "biofilm",

  // ---------- RUST ----------
  rust: "rust stains",
  "rust stains": "rust stains",

  // ---------- DISCOLORATION ----------
  discoloration: "discoloration",
  yellowing: "discoloration",
  "yellow stains": "discoloration",
  "orange stains": "discoloration",
  "brown stains": "discoloration",
  "black stains": "discoloration",
  "dye transfer": "discoloration",
  "heat discoloration": "discoloration",
  "rainbow discoloration": "discoloration",
  "dark spots": "discoloration",
  "light spots": "discoloration",
  "blotchy staining": "discoloration",
  "uneven color": "discoloration",
  fading: "discoloration",
  "heat marks": "discoloration",
  "burn marks": "discoloration",
  "heat tint": "discoloration",
  "rainbow effect": "discoloration",
  "oxidation staining": "discoloration",
  "chemical staining": "discoloration",
  "cleaner damage": "discoloration",
  "surface staining": "discoloration",
  "embedded staining": "discoloration",

  // ---------- STICKY / RESIDUE LAYER ----------
  "sticky residue": "sticky residue",
  "adhesive residue": "sticky residue",
  "wax buildup": "sticky residue",
  "sticky film": "sticky residue",
  "tacky buildup": "sticky residue",
  "product buildup": "sticky residue",
  "cleaner buildup": "sticky residue",
  "layered residue": "sticky residue",

  // ---------- SCUFFS ----------
  "scuff marks": "scuff marks",
  scratches: "scuff marks",

  // ---------- STREAKING ----------
  streaking: "streaking",
  smearing: "streaking",
  haze: "streaking",
  dullness: "streaking",
  "wipe streaks": "streaking",
  "mop streaks": "streaking",
  "cleaning streaks": "streaking",
  "residue streaks": "streaking",
  "film streaks": "streaking",
  "post clean streaks": "streaking",
  "smudge marks": "streaking",
  "wipe marks": "streaking",

  // ---------- UNEVEN FINISH / SHEEN ----------
  "uneven shine": "uneven finish",
  "patchy finish": "uneven finish",
  "blotchy finish": "uneven finish",
  "inconsistent finish": "uneven finish",
  "uneven sheen": "uneven finish",
  "dull patches": "uneven finish",
  "shiny patches": "uneven finish",
  "patchy sheen": "uneven finish",
  "finish inconsistency": "uneven finish",
  "uneven appearance": "uneven finish",
  "streaky finish": "uneven finish",
  "smudged finish": "uneven finish",
  "cloudy finish": "uneven finish",
  "mottled finish": "uneven finish",
  "patchy residue look": "uneven finish",

  // ---------- ODOR / DUST ----------
  "odor retention": "odor retention",
  "odor buildup": "odor retention",
  "dust buildup": "dust buildup",
};

const PROBLEM_ALIASES_ROUND2: Record<string, string> = {
  // ==============================
  // SATURATION DROP — ROUND 2
  // ==============================

  // hardwood / grout discoloration
  "yellowed wood": "discoloration",
  "yellowed finish": "discoloration",
  "wood darkening": "discoloration",
  "water darkening": "discoloration",
  "moisture darkening": "discoloration",
  "traffic darkening": "discoloration",
  "gray staining": "discoloration",
  "black staining": "discoloration",
  "brown discoloration": "discoloration",
  "orange discoloration": "discoloration",
  "patchy discoloration": "discoloration",
  "uneven discoloration": "discoloration",
  "embedded discoloration": "discoloration",
  "aged discoloration": "discoloration",
  "soil darkening": "discoloration",
  "black spots": "discoloration",
  "orange staining": "discoloration",
  "gray discoloration": "discoloration",
  "oxidation darkening": "discoloration",
  "aged yellowing": "discoloration",
  "soil staining": "discoloration",

  // painted / stone streaking
  "wipe streaks": "streaking",
  "drip streaks": "streaking",
  "run marks": "streaking",
  "lap marks": "streaking",
  "flash marks": "streaking",
  "smear marks": "streaking",
  "drag marks": "streaking",
  "patchy wipe marks": "streaking",
  "damp wipe marks": "streaking",
  "shadow streaks": "streaking",
  "shiny streaks": "streaking",
  "dull streaks": "streaking",
  "residue lines": "streaking",
  "cleaning lines": "streaking",
  "post-clean lines": "streaking",
  "roller-like marks": "streaking",
  "cleaning marks": "streaking",

  // painted sticky residue (omit "product residue" here — aliases soap residue above)
  "tacky residue": "sticky residue",
  "sticky film": "sticky residue",
  "adhesive film": "sticky residue",
  "label residue": "sticky residue",
  "tape residue": "sticky residue",
  "glue residue": "sticky residue",
  "sugar film": "sticky residue",
  "product film": "sticky residue",
  "oily tackiness": "sticky residue",
  "dirty sticky film": "sticky residue",
  "sugar residue": "sticky residue",

  // stainless bridge (targets match catalog problem strings)
  "burned residue": "burnt residue",
  "burned-on residue": "burnt residue",
  "burned-on food": "burnt residue",
  "cooked-on residue": "burnt residue",
  "baked-on residue": "burnt residue",
  "carbonized residue": "burnt residue",
  "burnt residue": "burnt residue",

  "oily stains": "oil stains",
  "cooking oil stains": "oil stains",
  "grease stains": "oil stains",
  "oil stains": "oil stains",

  "food buildup": "food residue",
  "stuck-on food": "food residue",
  "dried food residue": "food residue",
  "food residue": "food residue",

  "protein stains": "protein residue",
  "egg residue": "protein residue",
  "protein residue": "protein residue",

  "tea stains": "tannin stains",
  "coffee stains": "tannin stains",
  "tannin stains": "tannin stains",

  "mold spots": "mold growth",
  mold: "mold growth",
  "mildew spots": "mildew stains",
  "bacterial buildup": "bacteria buildup",

  "surface etching": "etching",
  "oxidation marks": "oxidation",
  "corrosion spots": "corrosion",
  "heat damage marks": "heat damage",
};

const PROBLEM_ALIASES_ROUND3: Record<string, string> = {
  // ==============================
  // SATURATION DROP — ROUND 3
  // ==============================

  // stainless steel + protein residue
  "protein stains": "protein residue",
  "egg stains": "protein residue",
  "egg residue": "protein residue",
  "milk residue": "protein residue",
  "dairy residue": "protein residue",
  "meat residue": "protein residue",
  "meat proteins": "protein residue",
  "cooked protein": "protein residue",
  "protein film": "protein residue",
  "baked protein": "protein residue",

  // stainless steel + tannin stains
  "tea stains": "tannin stains",
  "coffee stains": "tannin stains",
  "tea residue": "tannin stains",
  "coffee residue": "tannin stains",
  "brown beverage stains": "tannin stains",
  "drink stains": "tannin stains",
  "tannin residue": "tannin stains",
  "wine-like stains": "tannin stains",

  // stainless steel + mildew stains / bacteria buildup
  "mildew spots": "mildew stains",
  "mildew buildup": "mildew stains",
  "black mildew": "mildew stains",
  "mildew residue": "mildew stains",

  "bacterial buildup": "bacteria buildup",
  "bacterial film": "bacteria buildup",
  "bacteria residue": "bacteria buildup",
  "microbial buildup": "bacteria buildup",
  "germ buildup": "bacteria buildup",

  // stainless steel + oxidation / corrosion / tarnish / heat damage
  "oxidation marks": "oxidation",
  "oxidation staining": "oxidation",
  "oxidized spots": "oxidation",
  "oxidized film": "oxidation",

  "corrosion spots": "corrosion",
  "corroded areas": "corrosion",
  pitting: "corrosion",
  "pitted spots": "corrosion",

  "tarnished finish": "tarnish",
  "tarnish marks": "tarnish",
  "dull tarnish": "tarnish",
  "metal tarnish": "tarnish",

  "heat marks": "heat damage",
  "heat damage marks": "heat damage",
  "burn discoloration": "heat damage",
  "thermal damage": "heat damage",
  "overheated finish": "heat damage",

  // glass / laminate discoloration
  "cloudy discoloration": "discoloration",
  "yellow discoloration": "discoloration",
  "brown discoloration": "discoloration",
  "gray discoloration": "discoloration",
  "patchy discoloration": "discoloration",
  "uneven discoloration": "discoloration",
  "sun discoloration": "discoloration",
  "aged discoloration": "discoloration",
};

const PROBLEM_ALIASES_ROUND4: Record<string, string> = {
  // ==============================
  // SATURATION DROP — ROUND 4
  // ==============================

  // stainless steel + protein residue
  "protein stains": "protein residue",
  "egg stains": "protein residue",
  "egg residue": "protein residue",
  "milk residue": "protein residue",
  "dairy residue": "protein residue",
  "meat residue": "protein residue",
  "cooked protein": "protein residue",
  "protein film": "protein residue",
  "baked protein": "protein residue",

  // stainless steel + tannin stains
  "tea stains": "tannin stains",
  "coffee stains": "tannin stains",
  "tea residue": "tannin stains",
  "coffee residue": "tannin stains",
  "beverage stains": "tannin stains",
  "drink stains": "tannin stains",
  "tannin residue": "tannin stains",

  // stainless steel + mildew stains / bacteria buildup
  "mildew spots": "mildew stains",
  "mildew buildup": "mildew stains",
  "black mildew": "mildew stains",
  "mildew residue": "mildew stains",

  "bacterial buildup": "bacteria buildup",
  "bacterial film": "bacteria buildup",
  "bacteria residue": "bacteria buildup",
  "microbial buildup": "bacteria buildup",
  "germ buildup": "bacteria buildup",

  // stainless steel + oxidation / corrosion / tarnish / heat damage
  "oxidation marks": "oxidation",
  "oxidation staining": "oxidation",
  "oxidized spots": "oxidation",
  "oxidized film": "oxidation",

  "corrosion spots": "corrosion",
  "corroded areas": "corrosion",
  pitting: "corrosion",
  "pitted spots": "corrosion",

  "tarnished finish": "tarnish",
  "tarnish marks": "tarnish",
  "dull tarnish": "tarnish",
  "metal tarnish": "tarnish",

  "heat marks": "heat damage",
  "heat damage marks": "heat damage",
  "burn discoloration": "heat damage",
  "thermal damage": "heat damage",
  "overheated finish": "heat damage",

  // glass / laminate discoloration
  "cloudy discoloration": "discoloration",
  "yellow discoloration": "discoloration",
  "brown discoloration": "discoloration",
  "gray discoloration": "discoloration",
  "patchy discoloration": "discoloration",
  "uneven discoloration": "discoloration",
  "sun discoloration": "discoloration",
  "aged discoloration": "discoloration",

  // tile + burnt residue
  "burned tile residue": "burnt residue",
  "baked-on tile residue": "burnt residue",
  "cooked-on tile residue": "burnt residue",
  "scorched residue": "burnt residue",
  "charred residue": "burnt residue",
  "carbonized residue": "burnt residue",

  // tile + biofilm
  "pink slime": "biofilm",
  "orange slime": "biofilm",
  "slimy film": "biofilm",
  "slippery film": "biofilm",
  "bio residue": "biofilm",
  "drain slime": "biofilm",
  "shower slime": "biofilm",

  // hardwood + mineral deposits
  "white mineral residue": "mineral deposits",
  "hard water minerals": "mineral deposits",
  "chalky mineral film": "mineral deposits",
  "mineral crust": "mineral deposits",
  "calcium deposits": "mineral deposits",

  // grout + streaking
  "grout streaks": "streaking",
  "streaky grout": "streaking",
  "wipe streaks on grout": "streaking",
  "grout residue lines": "streaking",
  "uneven grout wipe marks": "streaking",
};

export const PROBLEM_ALIASES: Record<string, string> = {
  ...PROBLEM_ALIASES_CORE,
  ...PROBLEM_ALIASES_ROUND2,
  ...PROBLEM_ALIASES_ROUND3,
  ...PROBLEM_ALIASES_ROUND4,
};

function normalizeKey(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

const APPROVED_TAXONOMY_PROBLEMS = new Set(TAXONOMY_PROBLEMS.map(normalizeKey));

/** Same normalization as catalog keys / matrix cells (trim, lower, collapse spaces). */
export function normalizeSurface(surface: string): string {
  return normalizeKey(surface ?? "");
}

/** Same normalization as catalog keys / matrix cells (trim, lower, collapse spaces). */
export function normalizeProblem(problem: string): string {
  return normalizeKey(problem ?? "");
}

// masonry / mineral surfaces
// Canonicalize masonry-like substrates into a single family row.
// (You can expand masonry evidence later by problem.)
SURFACE_ALIASES.brick = "masonry";
SURFACE_ALIASES.masonry = "masonry";
SURFACE_ALIASES.concrete = "masonry";
SURFACE_ALIASES.stone = "masonry";
SURFACE_ALIASES["natural stone"] = "masonry";
SURFACE_ALIASES["brick wall"] = "masonry";

function aliasSurface(surface: string): string {
  const normalized = normalizeKey(surface);
  return SURFACE_ALIASES[normalized] ?? normalized;
}

function aliasProblem(problem: string): string {
  const normalized = normalizeKey(problem);

  // mold normalization (approved-set only)
  if (normalized === "mold" || normalized === "mould") {
    const preferred = ["biological growth", "biofilm", "discoloration"];
    for (const term of preferred) {
      const t = normalizeKey(term);
      if (APPROVED_TAXONOMY_PROBLEMS.has(t)) {
        return t;
      }
    }
    return normalized;
  }

  // stain normalization (collapse into approved term)
  if (normalized === "stain" || normalized === "stains" || normalized === "staining") {
    if (APPROVED_TAXONOMY_PROBLEMS.has("discoloration")) {
      return "discoloration";
    }
  }

  // generic residue normalization (avoid catch-all drift)
  if (normalized === "residue") {
    if (APPROVED_TAXONOMY_PROBLEMS.has("sticky residue")) {
      return "sticky residue";
    }
  }

  return PROBLEM_ALIASES[normalized] ?? normalized;
}

/**
 * normalize → alias → normalize (catalog key shape).
 * Use for comparing live pages to matrix cells or to each other.
 */
export function canonicalPairKey(surface: string, problem: string): string {
  const s = normalizeKey(aliasSurface(surface));
  const p = normalizeKey(aliasProblem(problem));
  return `${s}::${p}`;
}

export function canonicalizeLivePagePair(
  surface: string,
  problem: string,
): {
  normalizedSurface: string;
  normalizedProblem: string;
  canonicalSurface: string;
  canonicalProblem: string;
  canonicalKey: string;
} {
  const normalizedSurface = normalizeSurface(surface);
  const normalizedProblem = normalizeProblem(problem);
  const canonicalSurface = normalizeKey(aliasSurface(normalizedSurface));
  const canonicalProblem = normalizeKey(aliasProblem(normalizedProblem));
  const canonicalKey = `${canonicalSurface}::${canonicalProblem}`;

  return {
    normalizedSurface,
    normalizedProblem,
    canonicalSurface,
    canonicalProblem,
    canonicalKey,
  };
}

function buildRecordIndex(): Map<string, EvidenceRecord> {
  const index = new Map<string, EvidenceRecord>();

  for (const record of CLEANING_EVIDENCE_CATALOG) {
    const key = `${normalizeKey(record.surface)}::${normalizeKey(record.problem)}`;
    index.set(key, record);
  }

  return index;
}

const RECORD_INDEX = buildRecordIndex();

export function resolveEvidence(
  surface: string,
  problem: string,
): EvidenceRecord | null {
  const directKey = `${normalizeKey(surface)}::${normalizeKey(problem)}`;
  const direct = RECORD_INDEX.get(directKey);
  if (direct) return direct;

  const aliasedSurface = aliasSurface(surface);
  const aliasedProblem = aliasProblem(problem);
  const aliasedKey = `${normalizeKey(aliasedSurface)}::${normalizeKey(aliasedProblem)}`;
  const aliased = RECORD_INDEX.get(aliasedKey);
  if (aliased) return aliased;

  const problemOnlyKey = `${normalizeKey(surface)}::${normalizeKey(aliasedProblem)}`;
  const problemOnly = RECORD_INDEX.get(problemOnlyKey);
  if (problemOnly) return problemOnly;

  const surfaceOnlyKey = `${normalizeKey(aliasedSurface)}::${normalizeKey(problem)}`;
  const surfaceOnly = RECORD_INDEX.get(surfaceOnlyKey);
  if (surfaceOnly) return surfaceOnly;

  return null;
}

export function explainEvidenceResolution(surface: string, problem: string): {
  requestedSurface: string;
  requestedProblem: string;
  normalizedSurface: string;
  normalizedProblem: string;
  matchedSurface: string;
  matchedProblem: string;
  found: boolean;
} {
  const normalizedSurface = normalizeKey(surface);
  const normalizedProblem = normalizeKey(problem);
  const matchedSurface = aliasSurface(surface);
  const matchedProblem = aliasProblem(problem);
  const found = resolveEvidence(surface, problem) !== null;

  return {
    requestedSurface: surface,
    requestedProblem: problem,
    normalizedSurface,
    normalizedProblem,
    matchedSurface,
    matchedProblem,
    found,
  };
}
