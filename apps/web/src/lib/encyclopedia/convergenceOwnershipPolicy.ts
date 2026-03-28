import type { EncyclopediaCategory } from "./types";

/**
 * System convergence: who owns encyclopedia-shaped content long-term.
 *
 * - Pipeline markdown index + `/encyclopedia/*` is the default owner for net-new growth.
 * - Legacy authority (`/problems`, `/methods`, `/surfaces`, `/clusters`, guides, compare, combos)
 *   remains for compatibility and transition unless exempted below.
 */
export const PIPELINE_ENCYCLOPEDIA_DEFAULT_OWNER = "pipeline" as const;

export const LEGACY_AUTHORITY_COMPAT_OWNER = "legacy" as const;

/** Categories that are pipeline-first for taxonomy pages (article detail under /encyclopedia/{category}/…). */
export const PIPELINE_FIRST_ENCYCLOPEDIA_CATEGORIES = [
  "problems",
  "methods",
  "surfaces",
  "clusters",
] as const;

export type PipelineFirstConvergenceCategory =
  (typeof PIPELINE_FIRST_ENCYCLOPEDIA_CATEGORIES)[number];

/** Other pipeline categories (chemicals, tools, rooms, …): no legacy authority twin; pipeline-only growth. */
export const PIPELINE_EXCLUSIVE_ENCYCLOPEDIA_CATEGORIES: EncyclopediaCategory[] = [
  "chemicals",
  "tools",
  "rooms",
  "prevention",
  "edge-cases",
  "decisions",
];

/**
 * Legacy surfaces that are explicitly allowed to diverge during transition (extend as needed).
 * Empty by default: all legacy taxonomy detail pages are transition candidates, not exemptions.
 */
export const LEGACY_AUTHORITY_EXEMPT_SLUGS: Partial<
  Record<"problems" | "methods" | "surfaces" | "clusters", readonly string[]>
> = {};

export function isPipelineFirstCategory(
  kind: string,
): kind is PipelineFirstConvergenceCategory {
  return (PIPELINE_FIRST_ENCYCLOPEDIA_CATEGORIES as readonly string[]).includes(
    kind,
  );
}

export function isPipelineExclusiveEncyclopediaCategory(
  category: EncyclopediaCategory,
): boolean {
  return PIPELINE_EXCLUSIVE_ENCYCLOPEDIA_CATEGORIES.includes(category);
}

/**
 * Canonical owner for *new work*: pipeline index + content for encyclopedia-shaped topics.
 */
export function defaultOwnerForNetNewEncyclopediaContent(): typeof PIPELINE_ENCYCLOPEDIA_DEFAULT_OWNER {
  return PIPELINE_ENCYCLOPEDIA_DEFAULT_OWNER;
}

/**
 * Whether new hardcoded pages should be added to legacy authority taxonomy registries.
 * Policy: do not expand legacy problem/method/surface/cluster registries for new topics;
 * add markdown + index entries under `src/content/encyclopedia` instead.
 */
export const LEGACY_TAXONOMY_EXPANSION_FROZEN: Partial<
  Record<PipelineFirstConvergenceCategory, boolean>
> = {
  problems: true,
  methods: true,
  surfaces: true,
  clusters: true,
};

export function isLegacyTaxonomyExpansionFrozen(
  kind: PipelineFirstConvergenceCategory,
): boolean {
  return LEGACY_TAXONOMY_EXPANSION_FROZEN[kind] === true;
}
