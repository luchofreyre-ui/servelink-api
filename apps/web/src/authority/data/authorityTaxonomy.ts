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
] as const;

export type AuthorityProblemSlug = (typeof AUTHORITY_PROBLEM_SLUGS)[number];

export const AUTHORITY_GUIDE_SLUGS = [
  "chemical-usage-and-safety",
  "cleaning-every-surface",
  "how-to-remove-stains-safely",
  "when-cleaning-damages-surfaces",
  "why-cleaning-fails",
] as const;

export type AuthorityGuideSlug = (typeof AUTHORITY_GUIDE_SLUGS)[number];
