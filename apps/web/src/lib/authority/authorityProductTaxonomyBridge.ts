/**
 * Maps authority graph slugs to exact strings used in the product recommendation engine
 * (products.seed compatibleProblems / compatibleSurfaces).
 */

import { AUTHORITY_PROBLEM_SLUGS, AUTHORITY_SURFACE_SLUGS } from "@/authority/data/authorityTaxonomy";

/**
 * Authority problem slug → exact product-library `compatibleProblems` string.
 * Consulted before `PROBLEM_SLUG_TO_PRODUCT` for explicit / variant wording.
 */
const AUTHORITY_PROBLEM_TO_PRODUCT_PROBLEM: Record<string, string> = {
  "streaking-on-glass": "streaking",
  /** Normalized slug when trailing `-on-*` is stripped in playbook fallbacks */
  streaking: "streaking",
  "fingerprints-and-smudges": "smudge marks",
  "soap-scum": "soap scum",
  "hard-water-deposits": "hard water stains",
  "cloudy-glass": "cloudy film",
  "glass-cloudiness": "cloudy film",
  "cooked-on-grease": "cooked-on grease",
  "light-mildew": "mildew stains",
  "water-spotting": "hard water film",
  "water-spots": "hard water film",
  "limescale-buildup": "limescale",
  "mold-growth": "mold growth",
  "biofilm-buildup": "biofilm",
};

const PROBLEM_SLUG_TO_PRODUCT: Record<string, string> = {
  "soap-scum": "soap scum",
  "grease-buildup": "grease buildup",
  "hard-water-deposits": "hard water stains",
  "dust-buildup": "dust buildup",
  "fingerprints-and-smudges": "fingerprints",
  "stuck-on-residue": "sticky residue",
  "light-mildew": "mildew stains",
  "streaking-on-glass": "streaking",
  "general-soil": "dust buildup",
  "touchpoint-contamination": "bacteria buildup",
  "adhesive-residue": "adhesive residue",
  "odor-retention": "odor retention",
  "mold-growth": "mold growth",
  "burnt-residue": "burnt residue",
  "cloudy-glass": "cloudy film",
  "cooked-on-grease": "cooked-on grease",
  "oxidation": "oxidation",
  "smudge-marks": "smudge marks",
  "soap-film": "white film",
  "surface-streaking": "streaking",
  "yellowing": "yellowing",
  "surface-haze": "surface haze",
  "product-residue-buildup": "product residue",
  "appliance-grime": "kitchen grease film",
  "surface-discoloration": "discoloration",
  "light-film-buildup": "light film",
  "surface-dullness": "dullness",
  "uneven-finish": "uneven finish",
  "water-spotting": "hard water film",
  "limescale-buildup": "limescale",
  "greasy-grime": "greasy film",
  "floor-residue-buildup": "floor residue",
  "scuff-marks": "scuff marks",
  "finish-scratches": "scratches",
  "etching-on-finishes": "etching",
  "heat-damage-marks": "heat damage",
  "metal-tarnish": "tarnish",
  "musty-odor": "musty odor",
  "biofilm-buildup": "biofilm",
  "organic-stains": "organic stains",
  "laundry-odor": "laundry odor",
  "residue-buildup": "product residue",
  "film-buildup": "light film",
  "grime-buildup": "greasy film",
  dullness: "dullness",
  "water-spots": "hard water film",
  "mineral-film": "hard water stains",
  "sticky-film": "sticky residue",
  "kitchen-grease-film": "kitchen grease film",
  "bathroom-buildup": "soap scum",
  "appliance-buildup": "kitchen grease film",
  "countertop-residue": "product residue",
  "floor-buildup": "floor residue",
  "mirror-haze": "surface haze",
  "chrome-water-spots": "hard water film",
  "plastic-yellowing": "yellowing",
  "cabinet-grime": "kitchen grease film",
  "glass-cloudiness": "cloudy film",
  "exhaust-hood-film": "kitchen grease film",
  "sink-ring-stains": "hard water stains",
};

const SURFACE_SLUG_TO_PRODUCT: Record<string, string> = {
  "shower-glass": "shower glass",
  tile: "tile",
  grout: "grout",
  "stainless-steel": "stainless steel",
  "quartz-countertops": "quartz",
  "granite-countertops": "granite",
  laminate: "laminate",
  "finished-wood": "sealed wood",
  "vinyl-flooring": "vinyl",
  "painted-walls": "painted surfaces",
};

export function productProblemStringForAuthorityProblemSlug(slug: string): string | null {
  return PROBLEM_SLUG_TO_PRODUCT[slug] ?? null;
}

export function productSurfaceStringForAuthoritySurfaceSlug(slug: string): string | null {
  return SURFACE_SLUG_TO_PRODUCT[slug] ?? null;
}

export function isKnownAuthorityProblemSlug(slug: string): boolean {
  return (AUTHORITY_PROBLEM_SLUGS as readonly string[]).includes(slug);
}

export function isKnownAuthoritySurfaceSlug(slug: string): boolean {
  return (AUTHORITY_SURFACE_SLUGS as readonly string[]).includes(slug);
}

/** Reverse map: product-library problem strings → authority `/problems/{slug}` slugs. */
export function authorityProblemSlugsForProductProblems(productProblems: string[]): string[] {
  const set = new Set<string>();
  for (const [authSlug, pStr] of Object.entries(AUTHORITY_PROBLEM_TO_PRODUCT_PROBLEM)) {
    if (productProblems.includes(pStr)) set.add(authSlug);
  }
  for (const [authSlug, pStr] of Object.entries(PROBLEM_SLUG_TO_PRODUCT)) {
    if (productProblems.includes(pStr)) set.add(authSlug);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Map product-library surface strings to authority `/surfaces/{slug}` slugs (inverse of SURFACE_SLUG_TO_PRODUCT). */
export function authoritySurfaceSlugsForProductSurfaces(productSurfaces: string[]): string[] {
  const set = new Set<string>();
  for (const ps of productSurfaces) {
    for (const [authSlug, pStr] of Object.entries(SURFACE_SLUG_TO_PRODUCT)) {
      if (pStr === ps) set.add(authSlug);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
