import { getKnowledgePageBlueprint } from "../blueprints";
import type {
  KnowledgeDraftValidationInput,
  RelationshipValidationResult,
  ValidationIssue,
} from "./types";

export function validateRelationships(
  input: KnowledgeDraftValidationInput,
): RelationshipValidationResult {
  const blueprint = getKnowledgePageBlueprint(input.pageType);
  const issues: ValidationIssue[] = [];

  const hasAnyEntityLinks =
    input.relationships.soilSlugs.length > 0 ||
    input.relationships.surfaceSlugs.length > 0 ||
    input.relationships.methodSlugs.length > 0 ||
    input.relationships.toolSlugs.length > 0;

  if (!hasAnyEntityLinks) {
    issues.push({
      code: "MISSING_RELATIONSHIP_LINKS",
      severity: "warning",
      message: "Draft has no linked soils, surfaces, methods, or tools.",
    });
  }

  if (
    blueprint.requirements.requireRelatedServices &&
    input.relationships.serviceSlugs.length === 0
  ) {
    issues.push({
      code: "MISSING_RELATED_SERVICES",
      severity: "error",
      message: "Blueprint requires related services, but none were provided.",
      sectionKey: "related-services",
    });
  }

  if (
    blueprint.requirements.requireRelatedGuides &&
    input.relationships.articleSlugs.length === 0
  ) {
    issues.push({
      code: "MISSING_RELATED_GUIDES",
      severity: "error",
      message: "Blueprint requires related guides, but none were provided.",
      sectionKey: "related-guides",
    });
  }

  if (
    blueprint.requirements.requireProfessionalCallout &&
    !input.sections.some((section) => section.key === "when-to-call-a-professional")
  ) {
    issues.push({
      code: "MISSING_PROFESSIONAL_CALLOUT",
      severity: "error",
      message: 'Blueprint requires a "when to call a professional" section.',
      sectionKey: "when-to-call-a-professional",
    });
  }

  if (
    blueprint.requirements.requireSafetySection &&
    !input.sections.some((section) => section.key === "safety-notes")
  ) {
    issues.push({
      code: "MISSING_SAFETY_SECTION",
      severity: "error",
      message: 'Blueprint requires a "safety notes" section.',
      sectionKey: "safety-notes",
    });
  }

  if (
    blueprint.requirements.requireEvidenceExplanation &&
    input.evidence.whyThisWorks.length === 0
  ) {
    issues.push({
      code: "MISSING_EVIDENCE_EXPLANATION",
      severity: "error",
      message: 'Blueprint requires a "why this works" explanation.',
      evidenceFieldKey: "why-this-works",
    });
  }

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}
