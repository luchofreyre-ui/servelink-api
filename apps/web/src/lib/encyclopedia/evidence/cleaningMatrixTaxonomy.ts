/**
 * Problem × surface matrix used by the full encyclopedia pipeline and evidence coverage reports.
 * Single source of truth — keep in sync with pipeline expectations.
 */

export const TAXONOMY_PROBLEMS_RAW = [
  "grease buildup",
  "soap residue",
  "hard water stains",
  "limescale",
  "mineral deposits",
  "dust buildup",
  "product residue",
  "soap scum",
  "water spots",
  "yellowing",
  "odor retention",
  "cooked-on residue",
  "grease splatter",
  "cooked-on grease",
  "burnt residue",
  "sticky residue",
  "adhesive residue",
  "wax buildup",
  "oil stains",
  "food residue",
  "protein residue",
  "calcium buildup",
  "hard water film",
  "mineral haze",
  "scale deposits",
  "white film",
  "cloudy film",
  "yellow stains",
  "orange stains",
  "brown stains",
  "black stains",
  "pink slime",
  "rust stains",
  "tannin stains",
  "dye transfer",
  "biofilm",
  "mold growth",
  "mildew stains",
  "odor buildup",
  "bacteria buildup",
  "etching",
  "scratches",
  "scuff marks",
  "oxidation",
  "corrosion",
  "tarnish",
  "heat damage",
  "burn marks",
  "fading",
  "discoloration",
  "streaking",
  "smearing",
  "haze",
  "dullness",
  "uneven finish",
] as const;

export const TAXONOMY_SURFACES_RAW = [
  "stovetops",
  "backsplashes",
  "kitchen cabinets",
  "countertops",
  "tile floors",
  "shower glass",
  "bathtubs",
  "toilets",
  "sinks",
  "faucets",
  "mirrors",
  "appliances",
  "stainless steel",
  "granite",
  "marble",
  "quartz",
  "vinyl",
  "laminate",
  "wood",
  "painted walls",
  "grout",
  "glass cooktops",
  "shower doors",
  "sink basins",
  "painted cabinets",
  "sealed stone",
  "oven interiors",
  "oven doors",
  "range hoods",
  "refrigerator interiors",
  "refrigerator shelves",
  "freezer drawers",
  "microwave interiors",
  "dishwashers",
  "shower grout",
  "tile grout",
  "caulking",
  "shower pans",
  "bathtub surrounds",
  "chrome fixtures",
  "brushed nickel",
  "polished brass",
  "copper fixtures",
  "ceramic tile",
  "porcelain tile",
  "sealed granite",
  "sealed marble",
  "quartz countertops",
  "laminate counters",
  "butcher block",
  "unfinished wood",
  "sealed wood",
  "baseboards",
  "door frames",
  "window tracks",
  "light switches",
  "garbage cans",
  "laundry machines",
  "dryers",
] as const;

export function normalizeTaxonomyPart(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function dedupeTaxonomyStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const n = normalizeTaxonomyPart(v);
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(v.trim());
  }
  return out;
}

export const TAXONOMY_PROBLEMS = dedupeTaxonomyStrings(TAXONOMY_PROBLEMS_RAW);
export const TAXONOMY_SURFACES = dedupeTaxonomyStrings(TAXONOMY_SURFACES_RAW);
