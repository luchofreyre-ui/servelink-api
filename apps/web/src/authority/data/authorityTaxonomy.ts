import { ANTI_PATTERN_GUIDE_SLUGS } from "@/authority/data/authorityAntiPatternGuideSlugs";

export const AUTHORITY_METHOD_SLUGS = [
  "degreasing",
  "soap-scum-removal",
  "neutral-surface-cleaning",
  "detail-dusting",
  "touchpoint-sanitization",
  "glass-cleaning",
  "hard-water-deposit-removal",
  "dwell-and-lift-cleaning",
] as const;

export type AuthorityMethodSlug = (typeof AUTHORITY_METHOD_SLUGS)[number];

export const AUTHORITY_SURFACE_SLUGS = [
  "shower-glass",
  "tile",
  "grout",
  "stainless-steel",
  "quartz-countertops",
  "granite-countertops",
  "laminate",
  "finished-wood",
  "vinyl-flooring",
  "painted-walls",
] as const;

export type AuthoritySurfaceSlug = (typeof AUTHORITY_SURFACE_SLUGS)[number];

export const AUTHORITY_PROBLEM_SLUGS = [
  "soap-scum",
  "grease-buildup",
  "hard-water-deposits",
  "dust-buildup",
  "fingerprints-and-smudges",
  "stuck-on-residue",
  "light-mildew",
  "streaking-on-glass",
  "general-soil",
  "touchpoint-contamination",
  "adhesive-residue",
  "odor-retention",
  "mold-growth",
  "burnt-residue",
  "cloudy-glass",
  "cooked-on-grease",
  "oxidation",
  "smudge-marks",
  "soap-film",
  "surface-streaking",
  "yellowing",
  "surface-haze",
  "product-residue-buildup",
  "appliance-grime",
  "surface-discoloration",
  "light-film-buildup",
  "surface-dullness",
  "uneven-finish",
  "water-spotting",
  "limescale-buildup",
  "greasy-grime",
  "floor-residue-buildup",
  "scuff-marks",
  "finish-scratches",
  "etching-on-finishes",
  "heat-damage-marks",
  "metal-tarnish",
  "musty-odor",
  "biofilm-buildup",
  "organic-stains",
  "laundry-odor",
  "residue-buildup",
  "film-buildup",
  "grime-buildup",
  "dullness",
  "water-spots",
  "mineral-film",
  "sticky-film",
  "kitchen-grease-film",
  "bathroom-buildup",
  "appliance-buildup",
  "countertop-residue",
  "floor-buildup",
  "mirror-haze",
  "chrome-water-spots",
  "plastic-yellowing",
  "cabinet-grime",
  "glass-cloudiness",
  "exhaust-hood-film",
  "sink-ring-stains",
] as const;

export type AuthorityProblemSlug = (typeof AUTHORITY_PROBLEM_SLUGS)[number];

export const AUTHORITY_GUIDE_SLUGS = [
  "chemical-usage-and-safety",
  "cleaning-every-surface",
  "how-to-remove-stains-safely",
  "when-cleaning-damages-surfaces",
  "why-cleaning-fails",
  "best-cleaners-for-kitchens",
  "best-cleaners-for-bathrooms",
  "best-cleaners-for-floors",
  "best-cleaners-for-appliances",
  ...ANTI_PATTERN_GUIDE_SLUGS,
] as const;

export type AuthorityGuideSlug = (typeof AUTHORITY_GUIDE_SLUGS)[number];
