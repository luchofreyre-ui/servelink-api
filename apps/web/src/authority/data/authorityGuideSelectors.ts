import type { AuthorityProblemCategory } from "../types/authorityPageTypes";
import { getAllProblemPages } from "./authorityProblemPageData";

/** Deterministic: all problem slugs whose `category` matches. */
export function getProblemSlugsByCategory(category: AuthorityProblemCategory): string[] {
  return getAllProblemPages()
    .filter((p) => p.category === category)
    .map((p) => p.slug)
    .sort((a, b) => a.localeCompare(b));
}
