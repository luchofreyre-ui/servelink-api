import { slugify } from "@/lib/encyclopedia/slugify";

import type { ProductTaxonomyLink } from "./productTypes";

export function buildProductTaxonomyLinks(input: {
  problems: string[];
  surfaces: string[];
}): ProductTaxonomyLink[] {
  const { problems, surfaces } = input;
  const out: ProductTaxonomyLink[] = [];
  const seen = new Set<string>();

  for (const p of problems) {
    const href = `/problems/${slugify(p)}`;
    if (seen.has(href)) continue;
    seen.add(href);
    out.push({ href, label: p, kind: "problem" });
  }

  for (const s of surfaces) {
    const href = `/surfaces/${slugify(s)}`;
    if (seen.has(href)) continue;
    seen.add(href);
    out.push({ href, label: s, kind: "surface" });
  }

  return out;
}
