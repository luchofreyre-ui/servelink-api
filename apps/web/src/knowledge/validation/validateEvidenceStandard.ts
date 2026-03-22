import { KNOWLEDGE_EVIDENCE_STANDARD } from "./evidenceStandard";
import type {
  EvidenceFieldAssessment,
  EvidenceStrength,
  EvidenceValidationResult,
  KnowledgeDraftValidationInput,
  ValidationIssue,
} from "./types";

function getStrength(count: number): EvidenceStrength {
  if (count <= 0) return "missing";
  if (count === 1) return "weak";
  if (count <= 3) return "adequate";
  return "strong";
}

function getEvidenceCounts(input: KnowledgeDraftValidationInput): Record<string, number> {
  const e = input.evidence;
  return {
    "soil-types": e.soilTypes.length,
    "surface-types": e.surfaceTypes.length,
    "chemistry-class": e.chemistryClasses.length,
    "tool-types": e.toolTypes.length,
    "towel-types": e.towelTypes.length,
    "dwell-time-guidance": e.dwellTimeGuidance.length,
    "moisture-control-guidance": e.moistureControlGuidance.length,
    "avoid-on-surfaces": e.avoidOnSurfaces.length,
    "safety-notes": e.safetyNotes.length,
    "professional-escalation-threshold": e.professionalEscalationThresholds.length,
    "why-this-works": e.whyThisWorks.length,
    "residue-considerations": e.residueConsiderations.length,
  };
}

export function validateEvidenceStandard(input: KnowledgeDraftValidationInput): EvidenceValidationResult {
  const issues: ValidationIssue[] = [];
  const counts = getEvidenceCounts(input);

  const fieldAssessments: EvidenceFieldAssessment[] = KNOWLEDGE_EVIDENCE_STANDARD.map((field) => {
    const count = counts[field.key] ?? 0;
    const strength = getStrength(count);

    if (field.required && strength === "missing") {
      issues.push({
        code: "MISSING_EVIDENCE_FIELD",
        severity: "error",
        message: "Evidence field \"" + field.label + "\" is missing.",
        evidenceFieldKey: field.key,
      });
    } else if (field.required && strength === "weak") {
      issues.push({
        code: "WEAK_EVIDENCE_FIELD",
        severity: "warning",
        message: "Evidence field \"" + field.label + "\" is present but weak.",
        evidenceFieldKey: field.key,
      });
    }

    return { key: field.key, strength, count };
  });

  return {
    valid: issues.every((i) => i.severity !== "error"),
    issues,
    fieldAssessments,
  };
}
