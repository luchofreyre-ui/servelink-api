import {
  PROBLEM_SLUG_TO_PRODUCT,
  SURFACE_SLUG_TO_PRODUCT,
} from "@/lib/authority/authorityProductTaxonomyBridge";

/**
 * Canonical problem slugs → product-library `compatibleProblems` strings (aligned with
 * `authorityProductTaxonomyBridge`). Aliases extend coverage for shorthand / legacy URLs.
 */
const PRODUCT_PROBLEM_LABEL_ALIASES: Record<string, string> = {
  "hard-water-stains": "hard water stains",
  "hard-water-film": "hard water film",
  "mineral-deposits": "mineral deposits",
  mold: "mold growth",
  mildew: "mildew stains",
  biofilm: "biofilm",
  "sticky-residue": "sticky residue",
  "soap-residue": "soap residue",
  "food-residue": "food residue",
  "oil-stains": "oil stains",
  "protein-residue": "protein residue",
  discoloration: "discoloration",
  "yellow-stains": "yellow stains",
  "orange-stains": "orange stains",
  "brown-stains": "brown stains",
  "black-stains": "black stains",
  streaking: "streaking",
  smearing: "smearing",
  residue: "residue",
  limescale: "limescale",
};

export const PRODUCT_PROBLEM_MAP: Record<string, string> = {
  ...PROBLEM_SLUG_TO_PRODUCT,
  ...PRODUCT_PROBLEM_LABEL_ALIASES,
};

/** Shorthand / marketing surface slugs → product-library `compatibleSurfaces` strings. */
const PRODUCT_SURFACE_LABEL_ALIASES: Record<string, string> = {
  glass: "glass",
  marble: "marble",
  quartz: "quartz",
  granite: "granite",
  countertops: "countertops",
  appliances: "appliances",
  stovetops: "stovetops",
  sinks: "sinks",
  faucets: "faucets",
  mirrors: "mirrors",
  backsplashes: "backsplashes",
  vinyl: "vinyl",
  hardwood: "hardwood",
  wood: "wood",
  "painted-surfaces": "painted surfaces",
  "painted-cabinets": "painted cabinets",
  "kitchen-cabinets": "kitchen cabinets",
  baseboards: "baseboards",
  "door-frames": "door frames",
  "window-tracks": "window tracks",
  toilets: "toilets",
  bathtubs: "bathtubs",
  "garbage-cans": "garbage cans",
};

export const PRODUCT_SURFACE_MAP: Record<string, string> = {
  ...SURFACE_SLUG_TO_PRODUCT,
  ...PRODUCT_SURFACE_LABEL_ALIASES,
};

export function getMappedProblemLabel(problemSlug?: string | null): string | null {
  if (!problemSlug) return null;
  return PRODUCT_PROBLEM_MAP[problemSlug] ?? null;
}

export function getMappedSurfaceLabel(surfaceSlug?: string | null): string | null {
  if (!surfaceSlug) return null;
  return PRODUCT_SURFACE_MAP[surfaceSlug] ?? null;
}
