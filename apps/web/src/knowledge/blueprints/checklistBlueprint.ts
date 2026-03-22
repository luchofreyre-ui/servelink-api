import type { KnowledgePageBlueprint } from "./types";

export const CHECKLIST_PAGE_BLUEPRINT: KnowledgePageBlueprint = {
  type: "checklist",
  label: "Checklist Page",
  description:
    "Used for routine, deep-cleaning, move-out, and schedule-style checklist pages that combine practical task flow with service conversion.",
  sections: [
    { key: "hero", title: "Hero", description: "Top-of-page title and positioning.", required: true },
    { key: "summary", title: "Summary", description: "What the checklist covers.", required: true },
    { key: "key-takeaways", title: "Key Takeaways", description: "Critical planning notes.", required: true },
    { key: "checklist-steps", title: "Checklist Steps", description: "Ordered cleaning checklist.", required: true },
    { key: "common-mistakes", title: "Common Mistakes", description: "Planning and execution errors.", required: true },
    {
      key: "when-to-call-a-professional",
      title: "When to Call a Professional",
      description: "Escalation guidance.",
      required: true,
    },
    { key: "faq", title: "FAQ", description: "Checklist-specific questions.", required: true },
    { key: "related-guides", title: "Related Guides", description: "How-to links supporting checklist tasks.", required: true },
    { key: "related-services", title: "Related Services", description: "Service conversion path.", required: true },
    { key: "printable-download", title: "Printable Download", description: "Future printable asset hook.", required: false },
  ],
  requirements: {
    minimumFaqCount: 3,
    minimumMistakeCount: 3,
    minimumTakeawayCount: 3,
    minimumStepCount: 6,
    requireProfessionalCallout: true,
    requireRelatedServices: true,
    requireRelatedGuides: true,
  },
};
