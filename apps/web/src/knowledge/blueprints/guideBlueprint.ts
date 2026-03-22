import type { KnowledgePageBlueprint } from "./types";

const sections = [
  { key: "hero" as const, title: "Hero", description: "Top-of-page title and positioning.", required: true },
  { key: "summary" as const, title: "Summary", description: "Overview of the task.", required: true },
  { key: "key-takeaways" as const, title: "Key Takeaways", description: "Condensed high-value advice.", required: true },
  { key: "surface-compatibility" as const, title: "Surface Compatibility", description: "What this process is safe for.", required: true },
  { key: "why-this-method-works" as const, title: "Why This Method Works", description: "Explain the mechanism, not just the steps.", required: true },
  { key: "safe-tools" as const, title: "Tools and Supplies", description: "What is used and why.", required: true },
  { key: "dwell-time" as const, title: "Dwell Time Guidance", description: "Timing considerations.", required: true },
  { key: "moisture-control" as const, title: "Moisture Control", description: "Drying and residue prevention.", required: true },
  { key: "step-by-step" as const, title: "Step-by-Step Process", description: "Ordered cleaning sequence.", required: true },
  { key: "common-mistakes" as const, title: "Common Mistakes", description: "Typical process failures.", required: true },
  { key: "safety-notes" as const, title: "Safety Notes", description: "Surface and chemistry cautions.", required: true },
  { key: "when-to-call-a-professional" as const, title: "When to Call a Professional", description: "Escalation threshold.", required: true },
  { key: "faq" as const, title: "FAQ", description: "Guide-specific questions.", required: true },
  { key: "related-problems" as const, title: "Related Problems", description: "Problem links.", required: true },
  { key: "related-surfaces" as const, title: "Related Surfaces", description: "Surface links.", required: true },
  { key: "related-methods" as const, title: "Related Methods", description: "Method links.", required: true },
  { key: "related-tools" as const, title: "Related Tools", description: "Tool links.", required: true },
  { key: "related-services" as const, title: "Related Services", description: "Service conversion path.", required: true },
  { key: "related-locations" as const, title: "Related Locations", description: "Relevant local paths.", required: false },
  { key: "cluster-links" as const, title: "Related Guides In This Topic", description: "Sibling authority links.", required: true },
];

export const GUIDE_PAGE_BLUEPRINT: KnowledgePageBlueprint = {
  type: "guide",
  label: "Guide Page",
  description:
    "Used for step-by-step how-to cleaning guides tied to real surfaces, soils, methods, and service conversion paths.",
  sections,
  requirements: {
    minimumFaqCount: 3,
    minimumMistakeCount: 3,
    minimumTakeawayCount: 3,
    minimumStepCount: 4,
    requireProfessionalCallout: true,
    requireSafetySection: true,
    requireRelatedServices: true,
    requireRelatedGuides: true,
    requireEvidenceExplanation: true,
  },
};
