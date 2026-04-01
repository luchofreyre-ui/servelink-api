import type { AuthorityComparisonType } from "../types/authorityPageTypes";
import { buildAuthorityProductComparisonSeeds } from "./authorityProductComparisonSeeds";

export interface AuthorityComparisonSeed {
  type: AuthorityComparisonType;
  leftSlug: string;
  rightSlug: string;
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

export const AUTHORITY_COMPARISON_SEEDS: AuthorityComparisonSeed[] = [
  ...STATIC_COMPARISON_SEEDS,
  ...buildAuthorityProductComparisonSeeds(),
];
