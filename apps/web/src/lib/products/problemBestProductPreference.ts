export type BestPreference = {
  problemSlug: string;
  surface?: string | null;
  /** Highest editorial priority first; first match in scenario list wins as “best”. */
  preferredOrder: string[];
};

export const PROBLEM_BEST_PRODUCT_PREFERENCES: BestPreference[] = [
  {
    problemSlug: "limescale-buildup",
    preferredOrder: ["clr-calcium-lime-rust", "zep-calcium-lime-rust-remover"],
  },
  {
    problemSlug: "surface-haze",
    preferredOrder: ["invisible-glass-premium-glass-cleaner", "windex-original-glass-cleaner"],
  },
  {
    problemSlug: "mold-growth",
    preferredOrder: ["concrobium-mold-control", "scrubbing-bubbles-bathroom-grime-fighter"],
  },
];
