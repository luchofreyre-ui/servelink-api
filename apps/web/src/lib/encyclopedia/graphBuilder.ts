// graphBuilder.ts

import type { GeneratedPage } from "./pageTypes";
import type { AuthorityGraph, PageEdge, PageNode } from "./graphTypes";

export function buildGraph(pages: GeneratedPage[]): AuthorityGraph {
  const nodes: PageNode[] = pages.map((p) => ({
    slug: p.slug,
    problem: p.meta.problem,
    surface: p.meta.surface,
    intent: p.meta.intent,
  }));

  const edges: PageEdge[] = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];

      if (a.problem === b.problem && a.slug !== b.slug) {
        edges.push({ from: a.slug, to: b.slug, type: "same-problem" });
      }

      if (a.surface === b.surface && a.slug !== b.slug) {
        edges.push({ from: a.slug, to: b.slug, type: "same-surface" });
      }

      if (isRelatedProblem(a.problem, b.problem)) {
        edges.push({ from: a.slug, to: b.slug, type: "related-problem" });
      }
    }
  }

  return { nodes, edges };
}

// simple related problem logic (expand later)
function isRelatedProblem(a: string, b: string): boolean {
  const pairs = [
    ["hard water stains", "limescale"],
    ["residue buildup", "haze"],
    ["soap scum", "limescale"],
  ];

  return pairs.some(
    ([x, y]) =>
      (a.includes(x) && b.includes(y)) ||
      (a.includes(y) && b.includes(x))
  );
}
