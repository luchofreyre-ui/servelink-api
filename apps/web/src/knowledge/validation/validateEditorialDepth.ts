import { getKnowledgePageBlueprint } from "../blueprints";
import type { BlueprintSectionKey } from "../blueprints";
import type {
  EditorialDepthMetrics,
  EditorialDepthValidationResult,
  KnowledgeDraftValidationInput,
  ValidationIssue,
} from "./types";

function findSectionItems(input: KnowledgeDraftValidationInput, key: BlueprintSectionKey): string[] {
  const section = input.sections.find((item) => item.key === key);
  return section?.items?.filter((item) => item.trim().length > 0) ?? [];
}

function countNonEmptySections(input: KnowledgeDraftValidationInput): number {
  return input.sections.filter((s) => {
    const hasBody = s.body.trim().length > 0;
    const hasItems = (s.items?.length ?? 0) > 0;
    return hasBody || hasItems;
  }).length;
}

export function validateEditorialDepth(input: KnowledgeDraftValidationInput): EditorialDepthValidationResult {
  const blueprint = getKnowledgePageBlueprint(input.pageType);
  const issues: ValidationIssue[] = [];

  const faqCount = findSectionItems(input, "faq").length;
  const mistakeCount = findSectionItems(input, "common-mistakes").length;
  const takeawayCount = findSectionItems(input, "key-takeaways").length;
  const stepCount =
    findSectionItems(input, "step-by-step").length + findSectionItems(input, "checklist-steps").length;

  const req = blueprint.requirements;

  if (typeof req.minimumFaqCount === "number" && faqCount < req.minimumFaqCount) {
    issues.push({
      code: "MISSING_FAQ_COUNT",
      severity: "error",
      message: `FAQ count is ${faqCount}; requires at least ${req.minimumFaqCount}.`,
      sectionKey: "faq",
    });
  }

  if (typeof req.minimumMistakeCount === "number" && mistakeCount < req.minimumMistakeCount) {
    issues.push({
      code: "MISSING_MISTAKE_COUNT",
      severity: "error",
      message: `Common mistakes count is ${mistakeCount}; requires at least ${req.minimumMistakeCount}.`,
      sectionKey: "common-mistakes",
    });
  }

  if (typeof req.minimumTakeawayCount === "number" && takeawayCount < req.minimumTakeawayCount) {
    issues.push({
      code: "MISSING_TAKEAWAY_COUNT",
      severity: "error",
      message: `Key takeaway count is ${takeawayCount}; requires at least ${req.minimumTakeawayCount}.`,
      sectionKey: "key-takeaways",
    });
  }

  if (typeof req.minimumStepCount === "number" && stepCount < req.minimumStepCount) {
    issues.push({
      code: "MISSING_STEP_COUNT",
      severity: "error",
      message: `Step count is ${stepCount}; requires at least ${req.minimumStepCount}.`,
      sectionKey: blueprint.type === "checklist" ? "checklist-steps" : "step-by-step",
    });
  }

  const metrics: EditorialDepthMetrics = {
    faqCount,
    mistakeCount,
    takeawayCount,
    stepCount,
    totalNonEmptySections: countNonEmptySections(input),
  };

  if (metrics.totalNonEmptySections < 6) {
    issues.push({
      code: "WEAK_EDITORIAL_DEPTH",
      severity: "warning",
      message: `Only ${metrics.totalNonEmptySections} sections contain meaningful content.`,
    });
  }

  return {
    valid: issues.every((i) => i.severity !== "error"),
    issues,
    metrics,
  };
}
