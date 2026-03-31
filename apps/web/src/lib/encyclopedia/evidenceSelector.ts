// evidenceSelector.ts

import { EVIDENCE_LIBRARY } from "./evidenceLibrary";
import { classifyMaterial } from "./materialClassifier";
import type { EvidenceItem, PageEvidenceBundle } from "./evidenceTypes";
import type { GeneratedPage } from "./pageTypes";

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function matches(item: EvidenceItem, page: GeneratedPage): boolean {
  const problem = normalize(page.meta.problem);
  const surface = normalize(page.meta.surface);
  const material = classifyMaterial(surface);

  const problemMatch =
    item.appliesToProblems?.some((p) => problem.includes(normalize(p))) ?? false;

  const surfaceMatch =
    item.appliesToSurfaces?.some((s) => surface.includes(normalize(s))) ?? false;

  const materialMatch =
    item.appliesToMaterials?.some((m) => material === normalize(m)) ?? false;

  return problemMatch || surfaceMatch || materialMatch;
}

function scoreEvidence(item: EvidenceItem, page: GeneratedPage): number {
  const problem = normalize(page.meta.problem);
  const surface = normalize(page.meta.surface);
  const material = classifyMaterial(surface);

  let score = 0;

  if (item.appliesToProblems?.some((p) => problem.includes(normalize(p)))) {
    score += 3;
  }

  if (item.appliesToSurfaces?.some((s) => surface.includes(normalize(s)))) {
    score += 2;
  }

  if (item.appliesToMaterials?.some((m) => material === normalize(m))) {
    score += 2;
  }

  return score;
}

export function selectEvidenceForPage(
  page: GeneratedPage,
  limit = 5
): PageEvidenceBundle {
  const evidence = EVIDENCE_LIBRARY.filter((item) => matches(item, page))
    .sort((a, b) => scoreEvidence(b, page) - scoreEvidence(a, page))
    .slice(0, limit);

  return {
    title: page.title,
    slug: page.slug,
    evidence,
  };
}
