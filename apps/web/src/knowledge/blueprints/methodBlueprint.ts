import type { KnowledgePageBlueprint } from "./types";

export const METHOD_PAGE_BLUEPRINT: KnowledgePageBlueprint = {
  type: "method",
  label: "Method Page",
  description:
    "Used for chemistry and technique pages focused on how a method works, where it is useful, and where it is unsafe.",
  sections: [
    { key: "hero", title: "Hero", description: "Top-of-page title and positioning.", required: true },
    { key: "summary", title: "Summary", description: "Plain-language explanation.", required: true },
    { key: "definition", title: "What This Method Is", description: "Defines the method clearly.", required: true },
    { key: "how-it-works", title: "How It Works", description: "Mechanism of action.", required: true },
    { key: "why-this-method-works", title: "Why This Method Works", description: "Problem-method reasoning.", required: true },
    { key: "best-for", title: "Best For", description: "Best-fit problem types and contexts.", required: true },
    { key: "surface-compatibility", title: "Surface Compatibility", description: "Where it is safe and unsafe.", required: true },
    { key: "safe-tools", title: "Recommended Tools", description: "Tool pairings.", required: true },
    { key: "dwell-time", title: "Dwell Time Guidance", description: "Timing guidance.", required: true },
    { key: "moisture-control", title: "Moisture Control", description: "Drying, rinsing, or extraction guidance.", required: true },
    { key: "residue-considerations", title: "Residue Considerations", description: "What remains if removal is incomplete.", required: true },
    { key: "common-mistakes", title: "Common Mistakes", description: "Misuse patterns.", required: true },
    { key: "safety-notes", title: "Safety Notes", description: "Safety and compatibility warnings.", required: true },
    { key: "when-to-call-a-professional", title: "When to Call a Professional", description: "Escalation guidance.", required: true },
    { key: "faq", title: "FAQ", description: "Method-specific Q&A.", required: true },
    { key: "related-problems", title: "Related Problems", description: "Problems this method helps solve.", required: true },
    { key: "related-surfaces", title: "Related Surfaces", description: "Compatible and incompatible surfaces.", required: true },
    { key: "related-tools", title: "Related Tools", description: "Tool pairings.", required: true },
    { key: "related-guides", title: "Related Guides", description: "Guide connections.", required: true },
    { key: "related-services", title: "Related Services", description: "Service conversion path.", required: true },
  ],
  requirements: {
    minimumFaqCount: 3,
    minimumMistakeCount: 3,
    requireProfessionalCallout: true,
    requireSafetySection: true,
    requireRelatedServices: true,
    requireRelatedGuides: true,
    requireEvidenceExplanation: true,
  },
};
