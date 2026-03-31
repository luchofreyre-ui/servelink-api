export type TaxonomyCleanupResult = {
  normalizedSurfaceLabel: string;
  normalizedSurfaceSlug: string;
  flags: string[];
};

const SURFACE_LABEL_MAP: Array<{ match: RegExp; label: string; slug: string }> = [
  {
    match: /cleaning-glass-surfaces?|glass-surfaces?|shower-glass/,
    label: "Glass Surfaces",
    slug: "glass-surfaces",
  },
  {
    match: /cleaning-finished-wood|finished-wood/,
    label: "Finished Wood",
    slug: "finished-wood",
  },
  { match: /cleaning-grout|grout/, label: "Grout", slug: "grout" },
  {
    match: /cleaning-stainless-steel|stainless-steel|stainless/,
    label: "Stainless Steel",
    slug: "stainless-steel",
  },
  {
    match: /cleaning-tile-floors?|tile-floors?|tile/,
    label: "Tile Floors",
    slug: "tile-floors",
  },
  { match: /countertops?|countertop/, label: "Countertops", slug: "countertops" },
  { match: /floors?|floor/, label: "Floors", slug: "floors" },
];

function titleCase(input: string): string {
  return input
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function cleanupSurfaceTaxonomy(rawSlugOrTitle: string): TaxonomyCleanupResult {
  const input = rawSlugOrTitle.toLowerCase();
  const flags: string[] = [];

  for (const rule of SURFACE_LABEL_MAP) {
    if (rule.match.test(input)) {
      if (input.includes("cleaning-")) {
        flags.push("removed_cleaning_prefix");
      }

      return {
        normalizedSurfaceLabel: rule.label,
        normalizedSurfaceSlug: rule.slug,
        flags,
      };
    }
  }

  if (input.includes("cleaning-")) {
    flags.push("removed_cleaning_prefix");
  }

  const cleaned = input.replace(/(^|-)cleaning-/g, "$1");
  return {
    normalizedSurfaceLabel: titleCase(cleaned.replace(/-/g, " ")),
    normalizedSurfaceSlug: slugify(cleaned.replace(/-/g, " ")),
    flags,
  };
}
