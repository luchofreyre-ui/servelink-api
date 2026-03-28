/**
 * Guardrails: where new encyclopedia content must land so it does not expand the legacy system.
 *
 * Use in reviews/CI/docs — not enforced at runtime. Pair with `validate:encyclopedia-index`
 * and `LEGACY_TAXONOMY_EXPANSION_FROZEN` in `convergenceOwnershipPolicy.ts`.
 */
export const PIPELINE_ENCYCLOPEDIA_CONTENT_ROOT = "src/content/encyclopedia";

export const PIPELINE_ENCYCLOPEDIA_INDEX_FILE =
  "src/content/encyclopedia/_index/master-index.json";

/** Human-readable rules for contributors and automation. */
export const ENCYCLOPEDIA_GROWTH_RULES = [
  "Add new encyclopedia articles as markdown under src/content/encyclopedia/{category}/ and register them in master-index.json.",
  "Do not add new problem/method/surface detail pages to authority/data/*PageData.ts or authority taxonomy slugs for net-new topics.",
  "Use /encyclopedia/{category}/{slug} as the forward-looking public URL; legacy /problems, /methods, /surfaces remain until redirect phase.",
  "Guides (/guides), comparisons (/compare), and method/surface combos remain legacy-owned until a pipeline equivalent exists.",
] as const;
