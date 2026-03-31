// linkBuilder.ts

import type { AuthorityGraph } from "./graphTypes";

export type PageLinks = {
  slug: string;
  related: string[];
};

const MIN_RELATED_SLUGS = 3;

const FALLBACK_RELATED_SLUGS = [
  "cleaning-authority-overview",
  "surface-care-basics",
  "stain-diagnosis-intro",
] as const;

export function buildInternalLinks(graph: AuthorityGraph): PageLinks[] {
  const map = new Map<string, Set<string>>();
  const allSlugs = graph.nodes.map((n) => n.slug);

  for (const edge of graph.edges) {
    if (!map.has(edge.from)) {
      map.set(edge.from, new Set());
    }

    map.get(edge.from)!.add(edge.to);
  }

  return graph.nodes.map(({ slug }) => {
    const related = Array.from(map.get(slug) ?? []);

    for (const candidate of allSlugs) {
      if (related.length >= MIN_RELATED_SLUGS) break;
      if (candidate !== slug && !related.includes(candidate)) {
        related.push(candidate);
      }
    }

    for (const filler of FALLBACK_RELATED_SLUGS) {
      if (related.length >= MIN_RELATED_SLUGS) break;
      if (filler !== slug && !related.includes(filler)) {
        related.push(filler);
      }
    }

    return {
      slug,
      related: related.slice(0, 8),
    };
  });
}
