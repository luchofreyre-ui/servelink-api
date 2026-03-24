import type { AuthorityComparisonType } from "../types/authorityPageTypes";
import { formatAuthorityComparisonTitle } from "./authorityLabeling";
import { AUTHORITY_COMPARISON_SEEDS, type AuthorityComparisonSeed } from "./authorityComparisonRegistry";

function sortPair(a: string, b: string): [string, string] {
  return a.localeCompare(b) <= 0 ? [a, b] : [b, a];
}

export function normalizeComparisonSlug(leftSlug: string, rightSlug: string): string {
  const [left, right] = sortPair(leftSlug, rightSlug);
  return `${left}-vs-${right}`;
}

export function getAllComparisonSeeds(): AuthorityComparisonSeed[] {
  return AUTHORITY_COMPARISON_SEEDS.map((seed) => {
    const [leftSlug, rightSlug] = sortPair(seed.leftSlug, seed.rightSlug);
    return { ...seed, leftSlug, rightSlug };
  });
}

export function getComparisonSeedsByType(type: AuthorityComparisonType): AuthorityComparisonSeed[] {
  return getAllComparisonSeeds().filter((seed) => seed.type === type);
}

export function getComparisonSeedBySlug(
  type: AuthorityComparisonType,
  comparisonSlug: string,
): AuthorityComparisonSeed | null {
  return (
    getComparisonSeedsByType(type).find(
      (seed) => normalizeComparisonSlug(seed.leftSlug, seed.rightSlug) === comparisonSlug,
    ) ?? null
  );
}

export function getComparisonSlugsForEntity(
  type: AuthorityComparisonType,
  entitySlug: string,
): string[] {
  return getComparisonSeedsByType(type)
    .filter((seed) => seed.leftSlug === entitySlug || seed.rightSlug === entitySlug)
    .map((seed) => normalizeComparisonSlug(seed.leftSlug, seed.rightSlug));
}

/** Readable link label from normalized comparison slug (shared labeling layer). */
export function formatComparisonLinkLabel(
  _type: AuthorityComparisonType,
  comparisonSlug: string,
): string {
  return formatAuthorityComparisonTitle(comparisonSlug);
}
