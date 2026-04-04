export type ComparePreference = {
  problemSlug: string;
  surface?: string | null;
  preferredPairs: [string, string][];
};

/**
 * Editorial “decision tension” pairs per problem hub. When both SKUs appear in the
 * scenario triple, this pair wins over generic (0,1)/(0,2)/(1,2) mechanical order.
 */
export const PROBLEM_COMPARE_PREFERENCES: ComparePreference[] = [
  {
    problemSlug: "dust-buildup",
    preferredPairs: [["bona-hard-surface-floor-cleaner", "zep-neutral-ph-floor-cleaner"]],
  },
  {
    problemSlug: "surface-haze",
    preferredPairs: [["invisible-glass-premium-glass-cleaner", "windex-original-glass-cleaner"]],
  },
  {
    problemSlug: "product-residue-buildup",
    preferredPairs: [["dawn-platinum-dish-spray", "simple-green-all-purpose-cleaner"]],
  },
  {
    problemSlug: "mold-growth",
    preferredPairs: [["concrobium-mold-control", "scrubbing-bubbles-bathroom-grime-fighter"]],
  },
  {
    problemSlug: "light-mildew",
    preferredPairs: [["method-daily-shower-spray", "heinz-distilled-white-vinegar-5pct"]],
  },
  {
    problemSlug: "cloudy-glass",
    preferredPairs: [["bar-keepers-friend-cleanser", "clr-calcium-lime-rust"]],
  },
  {
    problemSlug: "smudge-marks",
    preferredPairs: [["windex-original-glass-cleaner", "method-all-purpose-cleaner"]],
  },
  {
    problemSlug: "odor-retention",
    preferredPairs: [["zero-odor-eliminator-spray", "natures-miracle-stain-and-odor-remover"]],
  },
  {
    problemSlug: "limescale-buildup",
    preferredPairs: [["clr-calcium-lime-rust", "zep-calcium-lime-rust-remover"]],
  },
];
