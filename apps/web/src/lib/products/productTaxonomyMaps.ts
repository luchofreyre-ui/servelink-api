export const PRODUCT_PROBLEM_MAP: Record<string, string> = {
  "grease-buildup": "grease buildup",
  "soap-scum": "soap scum",
  "hard-water-stains": "hard water stains",
  "hard-water-film": "hard water film",
  "mineral-deposits": "mineral deposits",
  "water-spots": "water spots",
  "mold": "mold",
  "mildew": "mildew",
  "biofilm": "biofilm",
  "sticky-residue": "sticky residue",
  "soap-residue": "soap residue",
  "food-residue": "food residue",
  "burnt-residue": "burnt residue",
  "oil-stains": "oil stains",
  "protein-residue": "protein residue",
  "discoloration": "discoloration",
  "yellowing": "yellowing",
  "yellow-stains": "yellow stains",
  "orange-stains": "orange stains",
  "brown-stains": "brown stains",
  "black-stains": "black stains",
  "dust-buildup": "dust buildup",
  "odor-retention": "odor retention",
  "streaking": "streaking",
  "smearing": "smearing",
  "residue": "residue",
  "limescale": "limescale",
};

export const PRODUCT_SURFACE_MAP: Record<string, string> = {
  "stainless-steel": "stainless steel",
  "glass": "glass",
  "shower-glass": "shower glass",
  "tile": "tile",
  "grout": "grout",
  "granite": "granite",
  "marble": "marble",
  "quartz": "quartz",
  "countertops": "countertops",
  "appliances": "appliances",
  "stovetops": "stovetops",
  "sinks": "sinks",
  "faucets": "faucets",
  "mirrors": "mirrors",
  "backsplashes": "backsplashes",
  "vinyl": "vinyl",
  "laminate": "laminate",
  "hardwood": "hardwood",
  "wood": "wood",
  "painted-surfaces": "painted surfaces",
  "painted-cabinets": "painted cabinets",
  "kitchen-cabinets": "kitchen cabinets",
  "baseboards": "baseboards",
  "door-frames": "door frames",
  "window-tracks": "window tracks",
  "toilets": "toilets",
  "bathtubs": "bathtubs",
  "garbage-cans": "garbage cans",
};

export function getMappedProblemLabel(problemSlug?: string | null): string | null {
  if (!problemSlug) return null;
  return PRODUCT_PROBLEM_MAP[problemSlug] ?? null;
}

export function getMappedSurfaceLabel(surfaceSlug?: string | null): string | null {
  if (!surfaceSlug) return null;
  return PRODUCT_SURFACE_MAP[surfaceSlug] ?? null;
}
