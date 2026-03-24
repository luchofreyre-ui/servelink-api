import { AUTHORITY_SNAPSHOT } from "./authority.snapshot";

/**
 * FO / marketing app route prefixes — aligned with `apps/web` App Router:
 * - `src/app/(public)/problems/[problemSlug]/page.tsx`
 * - `src/app/(public)/surfaces/[surfaceSlug]/page.tsx`
 * - `src/app/(public)/methods/[methodSlug]/page.tsx`
 */
export const FO_AUTHORITY_KNOWLEDGE_ROUTE_BASE = {
  problem: "/problems",
  surface: "/surfaces",
  method: "/methods",
} as const;

export type FoKnowledgeLinkKind = "problem" | "surface" | "method";

/**
 * Compact link payload for franchise-owner surfaces (web resolves `pathname` against public origin).
 */
export type FoKnowledgeLinkItem = {
  kind: FoKnowledgeLinkKind;
  /** Route segment after the section prefix (matches web authority slugs). */
  slug: string;
  /** App-relative path, e.g. `/problems/grease-buildup`. */
  pathname: string;
  /** Short label for anchor text. */
  title: string;
  /** Authority tags from the request that resolved to this same resource (deduped, sorted). */
  sourceTags: string[];
};

const snapshotProblemSet = new Set(AUTHORITY_SNAPSHOT.problems);
const snapshotSurfaceSet = new Set(AUTHORITY_SNAPSHOT.surfaces);
const snapshotMethodSet = new Set(AUTHORITY_SNAPSHOT.methods);

/**
 * API resolver tags that use a different public problem slug on web
 * (`apps/web/src/authority/data/authorityTaxonomy.ts`).
 */
const PROBLEM_WEB_SLUG_BY_API_TAG: Record<string, string> = {
  limescale: "hard-water-deposits",
  smudging: "fingerprints-and-smudges",
};

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function mergeInto(
  map: Map<string, FoKnowledgeLinkItem>,
  kind: FoKnowledgeLinkKind,
  slug: string,
  sourceTag: string,
) {
  const base =
    kind === "problem"
      ? FO_AUTHORITY_KNOWLEDGE_ROUTE_BASE.problem
      : kind === "surface"
        ? FO_AUTHORITY_KNOWLEDGE_ROUTE_BASE.surface
        : FO_AUTHORITY_KNOWLEDGE_ROUTE_BASE.method;
  const pathname = `${base}/${slug}`;
  const key = `${kind}:${pathname}`;
  const existing = map.get(key);
  if (existing) {
    if (!existing.sourceTags.includes(sourceTag)) {
      existing.sourceTags.push(sourceTag);
      existing.sourceTags.sort((a, b) => a.localeCompare(b));
    }
    return;
  }
  map.set(key, {
    kind,
    slug,
    pathname,
    title: titleFromSlug(slug),
    sourceTags: [sourceTag],
  });
}

/**
 * Maps authority tags from the bundled graph to FO-usable knowledge paths.
 * Tags not present in {@link AUTHORITY_SNAPSHOT} are ignored (deterministic).
 * Multiple tags that resolve to the same `pathname` are merged with combined `sourceTags`.
 */
export function mapAuthorityTagsToFoKnowledgeLinks(input: {
  surfaces?: string[];
  problems?: string[];
  methods?: string[];
}): FoKnowledgeLinkItem[] {
  const byPath = new Map<string, FoKnowledgeLinkItem>();

  for (const tag of input.problems ?? []) {
    if (!snapshotProblemSet.has(tag)) continue;
    const slug = PROBLEM_WEB_SLUG_BY_API_TAG[tag] ?? tag;
    mergeInto(byPath, "problem", slug, tag);
  }

  for (const tag of input.surfaces ?? []) {
    if (!snapshotSurfaceSet.has(tag)) continue;
    mergeInto(byPath, "surface", tag, tag);
  }

  for (const tag of input.methods ?? []) {
    if (!snapshotMethodSet.has(tag)) continue;
    mergeInto(byPath, "method", tag, tag);
  }

  const kindRank: Record<FoKnowledgeLinkKind, number> = {
    problem: 0,
    method: 1,
    surface: 2,
  };

  return [...byPath.values()].sort((a, b) => {
    const kr = kindRank[a.kind] - kindRank[b.kind];
    if (kr !== 0) return kr;
    if (a.pathname !== b.pathname) {
      return a.pathname.localeCompare(b.pathname);
    }
    return a.slug.localeCompare(b.slug);
  });
}
