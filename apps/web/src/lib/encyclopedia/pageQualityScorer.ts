// pageQualityScorer.ts

import type { PageQualityScore } from "./pageQualityTypes";
import type { GeneratedPage } from "./pageTypes";
import type { PageEvidenceBundle } from "./evidenceTypes";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function scoreTitleStrength(title: string): number {
  let score = 40;

  if (title.length >= 35) score += 20;
  if (title.length <= 90) score += 10;
  if (/what causes|how to remove|how to prevent|how to fix|how to clean/i.test(title)) {
    score += 20;
  }
  if (/ on | from /i.test(title)) {
    score += 10;
  }

  return clamp(score);
}

function scoreSpecificity(page: GeneratedPage): number {
  let score = 30;

  if (page.meta.problem.split(" ").length >= 2) score += 25;
  if (page.meta.surface.split(" ").length >= 1) score += 15;
  if (page.meta.needsChemicalExplanation) score += 15;
  if (page.meta.needsMaterialSpecifics) score += 15;

  return clamp(score);
}

function scoreDepthCoverage(page: GeneratedPage): number {
  let score = 0;

  const count = page.sections.length;
  score += Math.min(60, count * 10);

  if (page.content?.advancedNotes) score += 20;
  if (page.meta.riskLevel === "high") score += 10;
  if (page.meta.riskLevel === "medium") score += 5;

  return clamp(score);
}

function scoreInternalLinkCoverage(page: GeneratedPage): number {
  const linkCount = page.internalLinks?.length ?? 0;

  if (linkCount >= 6) return 100;
  if (linkCount >= 4) return 80;
  if (linkCount >= 2) return 60;
  if (linkCount >= 1) return 40;

  return 10;
}

function scoreEvidenceCoverage(bundle: PageEvidenceBundle): number {
  const count = bundle.evidence.length;

  if (count >= 5) return 100;
  if (count === 4) return 85;
  if (count === 3) return 70;
  if (count === 2) return 55;
  if (count === 1) return 35;

  return 0;
}

export function scorePageQuality(
  page: GeneratedPage,
  evidence: PageEvidenceBundle
): PageQualityScore {
  const titleStrength = scoreTitleStrength(page.title);
  const specificity = scoreSpecificity(page);
  const evidenceCoverage = scoreEvidenceCoverage(evidence);
  const depthCoverage = scoreDepthCoverage(page);
  const internalLinkCoverage = scoreInternalLinkCoverage(page);

  const overall = clamp(
    Math.round(
      titleStrength * 0.2 +
        specificity * 0.2 +
        evidenceCoverage * 0.25 +
        depthCoverage * 0.2 +
        internalLinkCoverage * 0.15
    )
  );

  const notes: string[] = [];

  if (evidenceCoverage < 55) notes.push("Low evidence coverage");
  if (internalLinkCoverage < 40) notes.push("Weak internal link coverage");
  if (depthCoverage < 70) notes.push("Content depth can improve");
  if (titleStrength < 70) notes.push("Title strength can improve");

  return {
    overall,
    titleStrength,
    specificity,
    evidenceCoverage,
    depthCoverage,
    internalLinkCoverage,
    notes,
  };
}
