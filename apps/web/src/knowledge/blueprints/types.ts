export type KnowledgePageBlueprintType =
  | "problem"
  | "surface"
  | "method"
  | "tool"
  | "guide"
  | "checklist"
  | "comparison"
  | "myth"
  | "surface-problem";

export type BlueprintSectionKey =
  | "hero"
  | "summary"
  | "definition"
  | "key-takeaways"
  | "why-it-forms"
  | "where-it-appears"
  | "identification"
  | "surface-characteristics"
  | "material-risks"
  | "surface-compatibility"
  | "safe-methods"
  | "unsafe-methods"
  | "safe-tools"
  | "unsafe-tools"
  | "best-for"
  | "how-it-works"
  | "why-this-method-works"
  | "dwell-time"
  | "moisture-control"
  | "residue-considerations"
  | "step-by-step"
  | "checklist-steps"
  | "common-mistakes"
  | "myth-explained"
  | "comparison-table"
  | "when-to-call-a-professional"
  | "safety-notes"
  | "maintenance-principles"
  | "faq"
  | "related-problems"
  | "related-surfaces"
  | "related-methods"
  | "related-tools"
  | "related-guides"
  | "related-services"
  | "related-locations"
  | "cluster-links"
  | "printable-download";

export type BlueprintSection = {
  key: BlueprintSectionKey;
  title: string;
  description: string;
  required: boolean;
};

export type BlueprintRequirement = {
  minimumFaqCount?: number;
  minimumMistakeCount?: number;
  minimumTakeawayCount?: number;
  minimumStepCount?: number;
  requireProfessionalCallout?: boolean;
  requireSafetySection?: boolean;
  requireRelatedServices?: boolean;
  requireRelatedGuides?: boolean;
  requireEvidenceExplanation?: boolean;
};

export type KnowledgePageBlueprint = {
  type: KnowledgePageBlueprintType;
  label: string;
  description: string;
  sections: BlueprintSection[];
  requirements: BlueprintRequirement;
};
