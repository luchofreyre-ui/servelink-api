// publishPipeline.ts

import { evaluatePublishPolicyWithOverride } from "./publishPolicyWithOverride";
import type { ReviewablePage } from "./renderTypes";

export type PublishablePage = {
  slug: string;
  title: string;
  meta: {
    problem: string;
    surface: string;
    intent: string;
    riskLevel: "low" | "medium" | "high";
    qualityScore?: number;
    editorialOverrideMode?: string;
  };
  body: {
    sections: {
      key: string;
      title: string;
      content: string;
    }[];
    advancedNotes?: string;
    evidence?: {
      id: string;
      sourceType: string;
      title: string;
      summary: string;
      tags: string[];
    }[];
    rationale?: {
      chemicalReason: string;
      toolReason: string;
      safetyReason?: string;
    };
  };
  relatedSlugs: string[];
  publishedAt: string;
};

export function getPublishablePages(
  pages: ReviewablePage[]
): PublishablePage[] {
  return pages
    .filter((page) => page.reviewStatus === "approved")
    .filter((page) => evaluatePublishPolicyWithOverride(page).passed)
    .map((page) => ({
      slug: page.slug,
      title: page.title,
      meta: {
        problem: page.problem,
        surface: page.surface,
        intent: page.intent,
        riskLevel: page.riskLevel,
        qualityScore: page.qualityScore?.overall,
        editorialOverrideMode: page.editorialOverrideMode,
      },
      body: {
        sections: page.sections.map((section) => ({
          key: section.key,
          title: section.title,
          content: section.content,
        })),
        advancedNotes: page.advancedNotes,
        evidence: page.evidence?.map((item) => ({
          id: item.id,
          sourceType: item.sourceType,
          title: item.title,
          summary: item.summary,
          tags: item.tags,
        })),
        rationale: page.rationale,
      },
      relatedSlugs: page.internalLinks,
      publishedAt: page.approvedAt ?? new Date().toISOString(),
    }));
}
