import { getKnowledgePageBlueprint } from "../blueprints";
import type { KnowledgeDraftValidationInput, StructureValidationResult, ValidationIssue } from "./types";

function isBlank(value: string | undefined): boolean {
  return !value || value.trim().length === 0;
}

export function validateStructure(
  input: KnowledgeDraftValidationInput,
): StructureValidationResult {
  const blueprint = getKnowledgePageBlueprint(input.pageType);
  const issues: ValidationIssue[] = [];

  for (const requiredSection of blueprint.sections.filter((section) => section.required)) {
    const matchingSection = input.sections.find((section) => section.key === requiredSection.key);

    if (!matchingSection) {
      issues.push({
        code: "MISSING_REQUIRED_SECTION",
        severity: "error",
        message: `Required section "${requiredSection.title}" is missing.`,
        sectionKey: requiredSection.key,
      });
      continue;
    }

    const bodyBlank = isBlank(matchingSection.body);
    const itemsBlank = !matchingSection.items || matchingSection.items.length === 0;

    if (bodyBlank && itemsBlank) {
      issues.push({
        code: "EMPTY_REQUIRED_SECTION",
        severity: "error",
        message: `Required section "${requiredSection.title}" is present but empty.`,
        sectionKey: requiredSection.key,
      });
    }
  }

  for (const section of input.sections) {
    const isBlueprintSection = blueprint.sections.some((blueprintSection) => blueprintSection.key === section.key);

    if (!isBlueprintSection) {
      issues.push({
        code: "BLUEPRINT_MISMATCH",
        severity: "warning",
        message: `Section "${section.key}" does not belong to the "${input.pageType}" blueprint.`,
        sectionKey: section.key,
      });
    }
  }

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}
