import type { KnowledgePageBlueprint } from "./types";

export const TOOL_PAGE_BLUEPRINT: KnowledgePageBlueprint = {
  type: "tool",
  label: "Tool Page",
  description:
    "Used for tool pages explaining where a tool is helpful, how it should be used, and where it should be avoided.",
  sections: [
    { key: "hero", title: "Hero", description: "Top-of-page title and positioning.", required: true },
    { key: "summary", title: "Summary", description: "Plain-language overview.", required: true },
    { key: "definition", title: "What This Tool Is", description: "Tool description and role.", required: true },
    { key: "best-for", title: "Best For", description: "Ideal soils and surfaces.", required: true },
    { key: "safe-tools", title: "How to Use It Well", description: "Usage guidance.", required: true },
    { key: "unsafe-tools", title: "Where It Should Not Be Used", description: "Misuse prevention.", required: true },
    { key: "common-mistakes", title: "Common Mistakes", description: "Typical tool errors.", required: true },
    { key: "safety-notes", title: "Safety Notes", description: "Safety and handling cautions.", required: true },
    { key: "faq", title: "FAQ", description: "Tool-specific Q&A.", required: true },
    { key: "related-problems", title: "Related Problems", description: "Problems this tool helps address.", required: true },
    { key: "related-surfaces", title: "Related Surfaces", description: "Surfaces this tool pairs with.", required: true },
    { key: "related-methods", title: "Related Methods", description: "Method pairings.", required: true },
    { key: "related-guides", title: "Related Guides", description: "Guide connections.", required: true },
  ],
  requirements: {
    minimumFaqCount: 3,
    minimumMistakeCount: 3,
    requireSafetySection: true,
    requireRelatedGuides: true,
    requireEvidenceExplanation: true,
  },
};
