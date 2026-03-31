// generateCandidates.ts

import { buildPageContent } from "./contentBuilder";
import { buildGraph } from "./graphBuilder";
import { buildIntent } from "./intentBuilder";
import { buildInternalLinks } from "./linkBuilder";
import { buildPage } from "./pageBuilder";
import { expandProblem } from "./problemExpansion";
import { shouldGenerate } from "./problemScoring";
import { PROBLEM_SURFACE_MAP } from "./problemSurfaceMap";
import { normalizeSurface } from "./surfaceRules";
import type { GeneratedPage } from "./pageTypes";
import { validatePage } from "./pageValidator";

const INTENTS = [
  "what-causes",
  "how-remove",
  "how-prevent",
  "how-fix",
  "how-clean",
] as const;

type Intent = (typeof INTENTS)[number];

export function generatePages(): GeneratedPage[] {
  const pages: GeneratedPage[] = [];

  for (const baseProblem of Object.keys(PROBLEM_SURFACE_MAP)) {
    if (!shouldGenerate(baseProblem)) continue;

    const expandedProblems = expandProblem(baseProblem);
    const surfaces = PROBLEM_SURFACE_MAP[baseProblem];

    for (const problemVariant of expandedProblems) {
      for (const surface of surfaces) {
        const normalizedSurface = normalizeSurface(surface);

        for (const intent of INTENTS) {
          const title = buildIntent(
            intent as Intent,
            problemVariant,
            normalizedSurface
          );

          const page = buildPage(
            title,
            problemVariant,
            normalizedSurface,
            intent
          );

          if (validatePage(page)) {
            const content = buildPageContent(page);
            pages.push({
              ...page,
              content,
            });
          }
        }
      }
    }
  }

  const deduped = dedupePages(pages);
  const graph = buildGraph(deduped);
  const links = buildInternalLinks(graph);

  const linkMap = new Map(links.map((l) => [l.slug, l.related]));

  return deduped.map((p) => ({
    ...p,
    internalLinks: linkMap.get(p.slug) || [],
  }));
}

function dedupePages(pages: GeneratedPage[]): GeneratedPage[] {
  const seen = new Set<string>();
  const result: GeneratedPage[] = [];

  for (const page of pages) {
    if (seen.has(page.slug)) continue;
    seen.add(page.slug);
    result.push(page);
  }

  return result;
}
