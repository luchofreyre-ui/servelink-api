import type {
  DraftQualityScore,
  DraftQualityScoreBreakdown,
  EditorialDepthValidationResult,
  EvidenceValidationResult,
  RelationshipValidationResult,
  StructureValidationResult,
  ValidationIssue,
  ValidationSeverity,
} from "./types";

function countIssuesBySeverity(issues: ValidationIssue[], severity: ValidationSeverity): number {
  return issues.filter((issue) => issue.severity === severity).length;
}

function scoreCategory(
  issues: ValidationIssue[],
  possible: number,
  errorPenalty: number,
  warningPenalty: number,
): { earned: number; possible: number } {
  const errorCount = countIssuesBySeverity(issues, "error");
  const warningCount = countIssuesBySeverity(issues, "warning");

  const earned = Math.max(
    0,
    possible - errorCount * errorPenalty - warningCount * warningPenalty,
  );

  return {
    earned,
    possible,
  };
}

export function scoreDraftQuality(params: {
  structure: StructureValidationResult;
  evidence: EvidenceValidationResult;
  editorialDepth: EditorialDepthValidationResult;
  relationships: RelationshipValidationResult;
}): DraftQualityScore {
  const breakdown: DraftQualityScoreBreakdown = {
    structure: scoreCategory(params.structure.issues, 25, 8, 3),
    evidence: scoreCategory(params.evidence.issues, 35, 8, 2),
    editorialDepth: scoreCategory(params.editorialDepth.issues, 25, 8, 3),
    relationships: scoreCategory(params.relationships.issues, 15, 8, 3),
  };

  const total =
    breakdown.structure.earned +
    breakdown.evidence.earned +
    breakdown.editorialDepth.earned +
    breakdown.relationships.earned;

  let rating: DraftQualityScore["rating"] = "reject";

  if (total >= 80) {
    rating = "publish-ready";
  } else if (total >= 60) {
    rating = "revise";
  }

  return {
    total,
    breakdown,
    rating,
  };
}
