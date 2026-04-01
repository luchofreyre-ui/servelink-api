import { getGuidePageBySlug } from "@/authority/data/authorityGuidePageData";
import { entryClusterGuideForProblem } from "@/authority/navigation/authorityNavigation";

const ENTRY_CLUSTER_SLUGS = [
  "best-cleaners-for-kitchens",
  "best-cleaners-for-bathrooms",
  "best-cleaners-for-floors",
  "best-cleaners-for-appliances",
] as const;

/** High-intent anti-pattern guides rotated into cross-links (stable subset of the full list). */
const ANTI_PATTERN_CROSS_LINK_SLUGS = [
  "why-you-shouldnt-mix-cleaners",
  "why-bleach-isnt-a-universal-cleaner",
  "why-vinegar-doesnt-remove-grease",
  "why-all-purpose-cleaners-arent-universal",
  "why-microfiber-matters",
  "why-hard-water-keeps-coming-back",
  "why-disinfectants-dont-clean-surfaces",
  "why-cleaning-without-rinsing-fails",
] as const;

export type TopicalCrossLink = { href: string; title: string };

function stableIndex(seed: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return modulo ? h % modulo : 0;
}

export function pickEntryClusterCrossLinks(seed: string, problemSlug?: string | null): TopicalCrossLink[] {
  const primary = problemSlug ? entryClusterGuideForProblem(problemSlug) : null;
  const rest = ENTRY_CLUSTER_SLUGS.filter((s) => s !== primary);
  const start = stableIndex(seed, rest.length);
  const rotated = [...rest.slice(start), ...rest.slice(0, start)];
  const slugs = primary ? [primary, rotated[0]!] : [rotated[0]!, rotated[1]!];
  const out: TopicalCrossLink[] = [];
  for (const slug of slugs) {
    const g = getGuidePageBySlug(slug);
    if (g) out.push({ href: `/guides/${slug}`, title: g.title });
  }
  return out.slice(0, 2);
}

export function pickAntiPatternCrossLinks(seed: string): TopicalCrossLink[] {
  const n = ANTI_PATTERN_CROSS_LINK_SLUGS.length;
  const i = stableIndex(seed, n);
  const slugs = [ANTI_PATTERN_CROSS_LINK_SLUGS[i]!, ANTI_PATTERN_CROSS_LINK_SLUGS[(i + 3) % n]!];
  return slugs
    .map((slug) => {
      const g = getGuidePageBySlug(slug);
      return g ? { href: `/guides/${slug}`, title: g.title } : null;
    })
    .filter(Boolean) as TopicalCrossLink[];
}
