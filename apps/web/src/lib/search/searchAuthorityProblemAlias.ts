const CURATED_AUTHORITY_PROBLEM_QUERY_ALIASES: Record<string, string> = {
  // dust-buildup
  "dust buildup": "dust-buildup",
  "dust on floors": "dust-buildup",
  "dust on floor": "dust-buildup",
  "floor dust": "dust-buildup",
  "dusty floors": "dust-buildup",
  "dusty floor": "dust-buildup",
  "dust accumulation": "dust-buildup",
  "built up dust": "dust-buildup",

  // surface-haze
  "surface haze": "surface-haze",
  "glass haze": "surface-haze",
  "hazy glass": "surface-haze",
  "film on glass": "surface-haze",
  "haze on glass": "surface-haze",
  "cloudy mirrors": "surface-haze",
  "mirror haze": "surface-haze",
  "shower glass haze": "surface-haze",

  // product-residue-buildup
  "product residue": "product-residue-buildup",
  "product residue buildup": "product-residue-buildup",
  "cleaner residue": "product-residue-buildup",
  "cleaning product residue": "product-residue-buildup",
  "residue from cleaner": "product-residue-buildup",
  "product buildup": "product-residue-buildup",
  "cleaning residue": "product-residue-buildup",
  "residue on surface from cleaner": "product-residue-buildup",

  // grease-buildup
  "grease buildup": "grease-buildup",
  "kitchen grease": "grease-buildup",
  "greasy residue": "grease-buildup",
  "cooked on grease": "grease-buildup",
  "built up grease": "grease-buildup",
  "grease on stovetop": "grease-buildup",
  "stovetop grease": "grease-buildup",
  "cabinet grease": "grease-buildup",
  "grease film": "grease-buildup",
  "sticky grease": "grease-buildup",

  // hard-water-deposits
  "hard water deposits": "hard-water-deposits",
  "hard water spots": "hard-water-deposits",
  "mineral deposits": "hard-water-deposits",
  "water spots": "hard-water-deposits",
  limescale: "hard-water-deposits",
  "hard water buildup": "hard-water-deposits",
  "mineral buildup": "hard-water-deposits",
  "white mineral spots": "hard-water-deposits",
  "calcium buildup": "hard-water-deposits",
  "hard water film": "hard-water-deposits",

  // mold-growth
  "mold growth": "mold-growth",
  "mold buildup": "mold-growth",
  "black mold": "mold-growth",
  "mold on shower caulk": "mold-growth",
  "mold on grout": "mold-growth",
  "bathroom mold": "mold-growth",

  // light-mildew
  "light mildew": "light-mildew",
  "mildew on shower walls": "light-mildew",
  "mildew spots": "light-mildew",
  "surface mildew": "light-mildew",

  // streaking-on-glass
  "streaking on glass": "streaking-on-glass",
  "glass streaks": "streaking-on-glass",
  "streaky glass": "streaking-on-glass",
  "mirror streaks": "streaking-on-glass",
  "window streaks": "streaking-on-glass",

  // cloudy-glass
  "cloudy glass": "cloudy-glass",
  "glass looks cloudy": "cloudy-glass",
  "etched looking glass": "cloudy-glass",

  // smudge-marks
  "smudge marks": "smudge-marks",
  "fingerprints on glass": "smudge-marks",
  "fingerprints and smudges": "smudge-marks",
  "smudges on stainless": "smudge-marks",

  // odor-retention
  "odor retention": "odor-retention",
  "bad smell keeps coming back": "odor-retention",
  "lingering odor": "odor-retention",
  "stuck smell": "odor-retention",

  // limescale-buildup
  "limescale buildup": "limescale-buildup",
  "limescale on faucet": "limescale-buildup",
  "scale buildup": "limescale-buildup",
  "white scale": "limescale-buildup",
};

function normalizeAuthorityProblemQueryAlias(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

const STACKABLE_AUTHORITY_PROBLEM_SLUGS = new Set([
  "dust-buildup",
  "surface-haze",
  "product-residue-buildup",
  "grease-buildup",
  "hard-water-deposits",
  "mold-growth",
  "light-mildew",
  "streaking-on-glass",
  "cloudy-glass",
  "smudge-marks",
  "odor-retention",
  "limescale-buildup",
]);

export function tryResolveAuthorityProblemSlugForQuery(query: string): string | null {
  const normalized = normalizeAuthorityProblemQueryAlias(query);

  const aliasSlug = CURATED_AUTHORITY_PROBLEM_QUERY_ALIASES[normalized];
  if (aliasSlug && STACKABLE_AUTHORITY_PROBLEM_SLUGS.has(aliasSlug)) {
    return aliasSlug;
  }

  const hyphenSlug = normalized.replace(/\s+/g, "-");
  if (STACKABLE_AUTHORITY_PROBLEM_SLUGS.has(hyphenSlug)) {
    return hyphenSlug;
  }

  const singleTokenSlug = query.trim().toLowerCase();
  if (STACKABLE_AUTHORITY_PROBLEM_SLUGS.has(singleTokenSlug)) {
    return singleTokenSlug;
  }

  return null;
}
