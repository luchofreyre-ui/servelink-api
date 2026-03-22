import type { KnowledgePageBlueprint } from "./types";

export const SURFACE_PROBLEM_PAGE_BLUEPRINT: KnowledgePageBlueprint = {
  type: "surface-problem",
  label: "Surface × Problem Page",
  description:
    "Used for highly targeted pages like soap scum on glass or hard water stains on chrome, combining a specific soil with a specific surface.",
  sections: [
    { key: "hero", title: "Hero", description: "Top-of-page title and positioning.", required: true },
    { key: "summary", title: "Summary", description: "Specific problem on specific surface.", required: true },
    { key: "definition", title: "What Is Happening Here", description: "Explain the soil-surface interaction.", required: true },
    { key: "surface-compatibility", title: "Why This Surface Reacts This Way", description: "Explain material-specific behavior.", required: true },
    { key: "why-this-method-works", title: "Best Removal Logic", description: "Why the recommended method fits this exact combination.", required: true },
    { key: "safe-methods", title: "Safe Methods", description: "Best-fit methods.", required: true },
    { key: "unsafe-methods", title: "Methods to Avoid", description: "Unsafe or damaging approaches.", required: true },
    { key: "safe-tools", title: "Recommended Tools", description: "Best-fit tools.", required: true },
    { key: "step-by-step", title: "Step-by-Step Process", description: "Specific procedural flow.", required: true },
    { key: "common-mistakes", title: "Common Mistakes", description: "Typical soil-surface misuse errors.", required: true },
    { key: "safety-notes", title: "Safety Notes", description: "Compatibility and finish warnings.", required: true },
    { key: "when-to-call-a-professional", title: "When to Call a Professional", description: "Escalation threshold.", required: true },
    { key: "faq", title: "FAQ", description: "Combination-specific Q&A.", required: true },
    { key: "related-problems", title: "Related Problems", description: "Problem links.", required: true },
    { key: "related-surfaces", title: "Related Surfaces", description: "Surface links.", required: true },
    { key: "related-methods", title: "Related Methods", description: "Method links.", required: true },
    { key: "related-tools", title: "Related Tools", description: "Tool links.", required: true },
    { key: "related-guides", title: "Related Guides", description: "Guide links.", required: true },
    { key: "related-services", title: "Related Services", description: "Service conversion path.", required: true },
  ],
  requirements: {
    minimumFaqCount: 3,
    minimumMistakeCount: 3,
    minimumStepCount: 4,
    requireProfessionalCallout: true,
    requireSafetySection: true,
    requireRelatedServices: true,
    requireRelatedGuides: true,
    requireEvidenceExplanation: true,
  },
};
