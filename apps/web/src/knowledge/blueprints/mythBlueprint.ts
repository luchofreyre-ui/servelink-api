import type { KnowledgePageBlueprint } from "./types";

export const MYTH_PAGE_BLUEPRINT: KnowledgePageBlueprint = {
  type: "myth",
  label: "Myth Page",
  description:
    "Used for myth-debunking pages that correct common cleaning misconceptions with evidence-based reasoning.",
  sections: [
    { key: "hero", title: "Hero", description: "Top-of-page title and positioning.", required: true },
    { key: "summary", title: "Summary", description: "State the myth and why it matters.", required: true },
    { key: "myth-explained", title: "The Myth", description: "Describe the misconception clearly.", required: true },
    { key: "why-this-method-works", title: "What Actually Works", description: "Evidence-based correction.", required: true },
    { key: "surface-compatibility", title: "Where the Myth Causes Problems", description: "Affected surfaces or contexts.", required: true },
    { key: "common-mistakes", title: "Common Mistakes", description: "Bad outcomes caused by the myth.", required: true },
    { key: "safety-notes", title: "Safety Notes", description: "Safety or damage implications.", required: true },
    { key: "faq", title: "FAQ", description: "Myth-specific questions.", required: true },
    { key: "related-guides", title: "Related Guides", description: "How-to links.", required: true },
    { key: "related-methods", title: "Related Methods", description: "Method links.", required: true },
  ],
  requirements: {
    minimumFaqCount: 3,
    minimumMistakeCount: 3,
    requireSafetySection: true,
    requireRelatedGuides: true,
    requireEvidenceExplanation: true,
  },
};
