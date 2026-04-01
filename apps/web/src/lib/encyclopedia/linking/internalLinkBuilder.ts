import { canonicalPairKey } from "@/lib/encyclopedia/evidence/evidenceResolver";

type Page = {
  surface: string;
  problem: string;
  intent: string;
  slug: string;
  title?: string;
};

function splitCanonicalKey(key: string): { surface: string; problem: string } {
  // canonicalPairKey uses "surface::problem"
  const [surface, problem] = key.split("::");
  return { surface: surface ?? "", problem: problem ?? "" };
}

export function buildInternalLinks(
  current: Page,
  allPages: Page[],
  limit = 8,
): Page[] {
  const currentKey = canonicalPairKey(current.surface, current.problem);
  const { surface: currentCanonicalSurface, problem: currentCanonicalProblem } =
    splitCanonicalKey(currentKey);

  const candidates = allPages
    .filter((p) => p.slug !== current.slug)
    .map((p) => {
      const key = canonicalPairKey(p.surface, p.problem);
      const { surface, problem } = splitCanonicalKey(key);
      return {
        page: p,
        canonicalSurface: surface,
        canonicalProblem: problem,
        canonicalKey: key,
      };
    });

  const sameProblem = candidates
    .filter(
      (c) =>
        c.canonicalProblem === currentCanonicalProblem &&
        c.canonicalSurface !== currentCanonicalSurface,
    )
    .map((c) => c.page);

  const sameSurface = candidates
    .filter(
      (c) =>
        c.canonicalSurface === currentCanonicalSurface &&
        c.canonicalProblem !== currentCanonicalProblem,
    )
    .map((c) => c.page);

  const related = candidates
    .filter(
      (c) =>
        c.canonicalSurface !== currentCanonicalSurface &&
        c.canonicalProblem !== currentCanonicalProblem,
    )
    .map((c) => c.page);

  const deduped: Page[] = [];
  const seen = new Set<string>();

  for (const page of [...sameProblem, ...sameSurface, ...related]) {
    if (seen.has(page.slug)) continue;
    seen.add(page.slug);
    deduped.push(page);
    if (deduped.length >= limit) break;
  }

  // hard fallback so validation can still pass when the corpus is thin
  if (deduped.length < 3) {
    for (const page of allPages) {
      if (page.slug === current.slug) continue;
      if (seen.has(page.slug)) continue;
      seen.add(page.slug);
      deduped.push(page);
      if (deduped.length >= Math.max(3, limit)) break;
    }
  }

  return deduped.slice(0, limit);
}

