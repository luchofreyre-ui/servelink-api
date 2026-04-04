/**
 * Problem slugs that always render the authority execution-first hub at `/problems/<slug>`,
 * even when pipeline encyclopedia markdown exists for the same slug.
 *
 * Keep aligned with `buildExecutableEncyclopediaRedirects` (no Next redirect away from these paths).
 */
export const AUTHORITY_OWNED_PROBLEM_SLUGS = new Set<string>([
  "dust-buildup",
  "grease-buildup",
  "limescale-buildup",
  "product-residue-buildup",
  "surface-haze",
]);

export function isAuthorityOwnedProblemHub(slug: string): boolean {
  return AUTHORITY_OWNED_PROBLEM_SLUGS.has(slug);
}
