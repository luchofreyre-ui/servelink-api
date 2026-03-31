// renderAdapter.ts

import type { GeneratedPage } from "./pageTypes";
import type { RenderablePage, RenderableSection } from "./renderTypes";

const SECTION_TITLE_MAP: Record<string, string> = {
  whatIs: "What this problem is",
  whyItHappens: "Why this happens",
  whereItAppears: "Where it appears",
  canThisBeFixed: "Can this be fixed",
  chemistry: "Chemistry",
  commonMistakes: "Common mistakes",
  professionalMethod: "Professional method",
  howToFix: "How to fix",
  whatToAvoid: "What to avoid",
  whatToExpect: "What to expect",
  whenToStop: "When to stop",
  toolsRequired: "Tools required",
  recommendedProducts: "Recommended products",
  visualDiagnostics: "Visual diagnostics",
  relatedTopics: "Related topics",
  advancedNotes: "Advanced notes",
};

export function toRenderablePage(page: GeneratedPage): RenderablePage {
  const contentSections = page.content?.sections ?? [];

  const sections: RenderableSection[] = contentSections.map((section) => ({
    key: section.key,
    title: SECTION_TITLE_MAP[section.key] ?? section.key,
    content: section.content,
  }));

  return {
    title: page.title,
    slug: page.slug,
    problem: page.meta.problem,
    surface: page.meta.surface,
    intent: page.meta.intent,
    riskLevel: page.meta.riskLevel,
    sections,
    internalLinks: page.internalLinks ?? [],
    advancedNotes: page.content?.advancedNotes,
    evidence: page.content?.evidence,
    rationale: page.content?.rationale,
    qualityScore: page.content?.qualityScore,
  };
}
