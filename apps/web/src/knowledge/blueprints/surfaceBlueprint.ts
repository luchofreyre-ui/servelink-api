import type { KnowledgePageBlueprint } from "./types";

export const SURFACE_PAGE_BLUEPRINT: KnowledgePageBlueprint = {
  type: "surface",
  label: "Surface Page",
  description:
    "Used for material/surface encyclopedia pages focused on what the surface is, how it behaves, and how to clean it safely.",
  sections: [
    { key: "hero", title: "Hero", description: "Top-of-page title and positioning.", required: true },
    { key: "summary", title: "Summary", description: "Plain-language description of the surface.", required: true },
    { key: "definition", title: "What This Surface Is", description: "Material overview and use context.", required: true },
    {
      key: "surface-characteristics",
      title: "Surface Characteristics",
      description: "Porosity, finish behavior, and cleaning implications.",
      required: true,
    },
    { key: "material-risks", title: "Material Risks", description: "Chemical and tool sensitivity.", required: true },
    { key: "safe-methods", title: "Safe Cleaning Methods", description: "Approved method guidance.", required: true },
    { key: "unsafe-methods", title: "Methods to Avoid", description: "Unsafe methods and why.", required: true },
    { key: "safe-tools", title: "Safe Tools", description: "Recommended tools.", required: true },
    { key: "unsafe-tools", title: "Tools to Avoid", description: "Tools likely to damage the surface.", required: true },
    { key: "maintenance-principles", title: "Maintenance Principles", description: "Long-term care rules.", required: true },
    { key: "common-mistakes", title: "Common Mistakes", description: "Common user errors.", required: true },
    { key: "safety-notes", title: "Safety Notes", description: "Compatibility warnings.", required: true },
    {
      key: "when-to-call-a-professional",
      title: "When to Call a Professional",
      description: "Escalation guidance.",
      required: true,
    },
    { key: "faq", title: "FAQ", description: "Surface-specific questions and answers.", required: true },
    { key: "related-problems", title: "Related Problems", description: "Common soils and issues on this surface.", required: true },
    { key: "related-methods", title: "Related Methods", description: "Methods that work on this surface.", required: true },
    { key: "related-tools", title: "Related Tools", description: "Useful tools for this surface.", required: true },
    { key: "related-guides", title: "Related Guides", description: "How-to guide connections.", required: true },
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
