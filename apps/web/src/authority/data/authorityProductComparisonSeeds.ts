import { buildAuthorityProductComparisonSeedsFromLattice } from "./authorityProductComparisonLattice";

/**
 * Product comparison routes: lattice-scored, bridge-gated, capped.
 * See `authorityProductComparisonAdjacency.ts` + `authorityProductComparisonLattice.ts`.
 */
export function buildAuthorityProductComparisonSeeds(): {
  type: "product_comparison";
  leftSlug: string;
  rightSlug: string;
}[] {
  return buildAuthorityProductComparisonSeedsFromLattice();
}
