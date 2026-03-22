import type { KnowledgePageBlueprint } from "./types";

const sections = [
  { key: "hero" as const, title: "Hero", description: "Top-of-page title and positioning.", required: true },
  { key: "summary" as const, title: "Summary", description: "What is being compared and why it matters.", required: true },
  { key: "comparison-table" as const, title: "Comparison Table", description: "Side-by-side comparison structure.", required: true },
  { key: "why-this-method-works" as const, title: "How the Differences Matter", description: "Explain the practical decision logic.", required: true },
  { key: "common-mistakes" as const, title: "Common Mistakes", description: "Typical misuse of either option.", required: true },
  { key: "safety-notes" as const, title: "Safety Notes", description: "Compatibility or safety issues.", required: true },
  { key: "faq" as const, title: "FAQ", description: "Comparison-specific questions.", required: true },
  { key: "related-methods" as const, title: "Related Methods", description: "Linked methods.", required: true },
  { key: "related-guides" as const, title: "Related Guides", description: "Guide connections.", required: true },
];

export const COMPARISON_PAGE_BLUEPRINT: KnowledgePageBlueprint = {
  type: "comparison",
  label: "Comparison Page",
  description:
    "Used for side-by-side educational comparisons such as vinegar vs bleach, microfiber vs cotton, or acid vs alkaline cleaners.",
  sections,
  requirements: {
    minimumFaqCount: 3,
    minimumMistakeCount: 3,
    requireSafetySection: true,
    requireRelatedGuides: true,
    requireEvidenceExplanation: true,
  },
};
