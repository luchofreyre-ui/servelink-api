import { scoreDraftQuality } from "./scoreDraftQuality";
import { validateEditorialDepth } from "./validateEditorialDepth";
import { validateEvidenceStandard } from "./validateEvidenceStandard";
import { validateRelationships } from "./validateRelationships";
import { validateStructure } from "./validateStructure";
import type {
  KnowledgeDraftValidationInput,
  KnowledgeDraftValidationReport,
  ValidationIssue,
} from "./types";

function mergeIssues(...issueGroups: ValidationIssue[][]): ValidationIssue[] {
  return issueGroups.flat();
}

export function validateKnowledgeDraft(
  input: KnowledgeDraftValidationInput,
): KnowledgeDraftValidationReport {
  const structure = validateStructure(input);
  const evidence = validateEvidenceStandard(input);
  const editorialDepth = validateEditorialDepth(input);
  const relationships = validateRelationships(input);

  const score = scoreDraftQuality({
    structure,
    evidence,
    editorialDepth,
    relationships,
  });

  const issues = mergeIssues(
    structure.issues,
    evidence.issues,
    editorialDepth.issues,
    relationships.issues,
  );

  return {
    valid:
      structure.valid &&
      evidence.valid &&
      editorialDepth.valid &&
      relationships.valid &&
      score.rating !== "reject",
    pageType: input.pageType,
    issues,
    structure,
    evidence,
    editorialDepth,
    relationships,
    score,
  };
}
