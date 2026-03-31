// evidenceEnrichment.ts

import { EVIDENCE_LIBRARY } from "./evidenceLibrary";
import { classifyMaterial } from "./materialClassifier";
import type { ReviewablePage } from "./renderTypes";
import type { EvidenceItem } from "./evidenceTypes";
import type { EvidenceEnrichmentResult } from "./evidenceEnrichmentTypes";

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function scoreCandidate(page: ReviewablePage, item: EvidenceItem): number {
  const problem = normalize(page.problem);
  const surface = normalize(page.surface);
  const material = classifyMaterial(surface);

  let score = 0;

  if (item.appliesToProblems?.some((p) => problem.includes(normalize(p)))) {
    score += 4;
  }

  if (item.appliesToSurfaces?.some((s) => surface.includes(normalize(s)))) {
    score += 3;
  }

  if (item.appliesToMaterials?.some((m) => material === normalize(m))) {
    score += 3;
  }

  if (page.riskLevel === "high" && item.sourceType === "material-safety") {
    score += 2;
  }

  return score;
}

export function getSuggestedEvidenceForWeakPage(
  page: ReviewablePage,
  limit = 4
): EvidenceEnrichmentResult {
  const existingIds = new Set((page.evidence ?? []).map((item) => item.id));

  const suggestedEvidence = EVIDENCE_LIBRARY.filter(
    (item) => !existingIds.has(item.id)
  )
    .map((item) => ({
      item,
      score: scoreCandidate(page, item),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.item);

  return {
    slug: page.slug,
    title: page.title,
    currentEvidenceCount: page.evidence?.length ?? 0,
    suggestedEvidence,
  };
}
