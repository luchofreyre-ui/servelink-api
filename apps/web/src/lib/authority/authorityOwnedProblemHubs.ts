/**
 * Problem slugs that always render the authority execution-first hub at `/problems/<slug>`,
 * even when pipeline encyclopedia markdown exists for the same slug.
 *
 * Keep aligned with `buildExecutableEncyclopediaRedirects` (no Next redirect away from these paths).
 */
export const AUTHORITY_OWNED_PROBLEM_SLUGS: readonly string[] = [
  "dust-buildup",
  "grease-buildup",
  "limescale-buildup",
  "product-residue-buildup",
  "surface-haze",
];

const slugSet = new Set<string>(AUTHORITY_OWNED_PROBLEM_SLUGS);

export function isAuthorityOwnedProblemHub(slug: string): boolean {
  return slugSet.has(slug);
}
