/**
 * Re-export hub for problem page data and tone blocks.
 * Canonical source: `@/authority/data/authorityProblemPageData`.
 */
export type { AuthorityToneBlock } from "@/authority/data/authorityProblemPageData";
export {
  AUTHORITY_CORE_PROBLEM_TONES,
  getAllProblemPages,
  getProblemPageBySlug,
  problemSlugExists,
} from "@/authority/data/authorityProblemPageData";
