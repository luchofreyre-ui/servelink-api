import type { AuthorityComparisonType } from "../types/authorityPageTypes";
import { buildAuthorityProductComparisonSeeds } from "./authorityProductComparisonSeeds";

export interface AuthorityComparisonSeed {
  type: AuthorityComparisonType;
  leftSlug: string;
  rightSlug: string;
}

/** Canonical “best vs heavy” pairs for execution-first hubs; merged before lattice so coverage survives scoring/caps. */
const CORE_EXECUTION_FIRST_PRODUCT_COMPARISONS: AuthorityComparisonSeed[] = [
  { type: "product_comparison", leftSlug: "bona-hard-surface-floor-cleaner", rightSlug: "zep-neutral-ph-floor-cleaner" },
  { type: "product_comparison", leftSlug: "windex-original-glass-cleaner", rightSlug: "invisible-glass-premium-glass-cleaner" },
  { type: "product_comparison", leftSlug: "dawn-platinum-dish-spray", rightSlug: "simple-green-all-purpose-cleaner" },
  { type: "product_comparison", leftSlug: "concrobium-mold-control", rightSlug: "scrubbing-bubbles-bathroom-grime-fighter" },
  { type: "product_comparison", leftSlug: "heinz-distilled-white-vinegar-5pct", rightSlug: "method-daily-shower-spray" },
  { type: "product_comparison", leftSlug: "bar-keepers-friend-cleanser", rightSlug: "clr-calcium-lime-rust" },
  { type: "product_comparison", leftSlug: "method-all-purpose-cleaner", rightSlug: "windex-original-glass-cleaner" },
  { type: "product_comparison", leftSlug: "natures-miracle-stain-and-odor-remover", rightSlug: "zero-odor-eliminator-spray" },
  { type: "product_comparison", leftSlug: "clr-calcium-lime-rust", rightSlug: "zep-calcium-lime-rust-remover" },
];

function sortSlugPair(a: string, b: string): [string, string] {
  return a.localeCompare(b) <= 0 ? [a, b] : [b, a];
}

function comparisonSeedDedupeKey(seed: AuthorityComparisonSeed): string {
  const [l, r] = sortSlugPair(seed.leftSlug, seed.rightSlug);
  return `${seed.type}:${l}-vs-${r}`;
}

function dedupeComparisonSeeds(seeds: AuthorityComparisonSeed[]): AuthorityComparisonSeed[] {
  const seen = new Set<string>();
  const out: AuthorityComparisonSeed[] = [];
  for (const s of seeds) {
    const k = comparisonSeedDedupeKey(s);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

const STATIC_COMPARISON_SEEDS: AuthorityComparisonSeed[] = [
  { type: "method_comparison", leftSlug: "degreasing", rightSlug: "neutral-surface-cleaning" },
  {
    type: "method_comparison",
    leftSlug: "hard-water-deposit-removal",
    rightSlug: "neutral-surface-cleaning",
  },
  { type: "method_comparison", leftSlug: "touchpoint-sanitization", rightSlug: "neutral-surface-cleaning" },

  { type: "surface_comparison", leftSlug: "tile", rightSlug: "shower-glass" },
  { type: "surface_comparison", leftSlug: "stainless-steel", rightSlug: "granite-countertops" },
  { type: "surface_comparison", leftSlug: "painted-walls", rightSlug: "tile" },

  { type: "problem_comparison", leftSlug: "soap-scum", rightSlug: "hard-water-deposits" },
  { type: "problem_comparison", leftSlug: "grease-buildup", rightSlug: "stuck-on-residue" },
  { type: "problem_comparison", leftSlug: "dust-buildup", rightSlug: "general-soil" },
];

export const AUTHORITY_COMPARISON_SEEDS: AuthorityComparisonSeed[] = dedupeComparisonSeeds([
  ...STATIC_COMPARISON_SEEDS,
  ...CORE_EXECUTION_FIRST_PRODUCT_COMPARISONS,
  ...buildAuthorityProductComparisonSeeds(),
]);
