export type BestPreference = {
  problemSlug: string;
  surface?: string | null;
  /** Highest editorial priority first; first match in scenario list wins as “best”. */
  preferredOrder: string[];
};

export const PROBLEM_BEST_PRODUCT_PREFERENCES: BestPreference[] = [
  {
    problemSlug: "surface-haze",
    surface: "glass",
    preferredOrder: [
      "invisible-glass-premium-glass-cleaner",
      "windex-original-glass-cleaner",
    ],
  },
  {
    problemSlug: "smudge-marks",
    surface: "glass",
    preferredOrder: [
      "windex-original-glass-cleaner",
      "rubbermaid-microfiber-cleaning-cloths",
    ],
  },
  {
    problemSlug: "smudge-marks",
    surface: "stainless steel",
    preferredOrder: [
      "method-all-purpose-cleaner",
      "rubbermaid-microfiber-cleaning-cloths",
    ],
  },
  {
    problemSlug: "limescale-buildup",
    surface: "glass",
    preferredOrder: ["clr-calcium-lime-rust", "zep-calcium-lime-rust-remover"],
  },
  {
    problemSlug: "limescale-buildup",
    surface: "tile",
    preferredOrder: ["zep-calcium-lime-rust-remover", "clr-calcium-lime-rust"],
  },

  {
    problemSlug: "limescale-buildup",
    preferredOrder: ["clr-calcium-lime-rust", "zep-calcium-lime-rust-remover"],
  },
  {
    problemSlug: "surface-haze",
    preferredOrder: ["invisible-glass-premium-glass-cleaner", "windex-original-glass-cleaner"],
  },
  {
    problemSlug: "smudge-marks",
    preferredOrder: [
      "windex-original-glass-cleaner",
      "method-all-purpose-cleaner",
      "rubbermaid-microfiber-cleaning-cloths",
    ],
  },
  {
    problemSlug: "mold-growth",
    preferredOrder: ["concrobium-mold-control", "scrubbing-bubbles-bathroom-grime-fighter"],
  },
];
