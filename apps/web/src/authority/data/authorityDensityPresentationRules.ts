import type {
  AuthorityDensityConfidence,
  AuthorityDensityEscalation,
  AuthorityDensitySeverity,
} from "@/authority/types/authorityDensityTypes";
import type {
  AuthorityDensityActionLabel,
  AuthorityDensityConfidenceLabel,
  AuthorityDensityRiskLabel,
} from "@/authority/types/authorityDensityPresentationTypes";
import type { WorkflowStage } from "@/lib/visual-authority/visualAuthorityTypes";

export const AUTHORITY_DENSITY_CONFIDENCE_LABELS = {
  high: "Strong match",
  medium: "Likely match",
  low: "Confirm first",
} as const satisfies Record<AuthorityDensityConfidence, AuthorityDensityConfidenceLabel>;

export const AUTHORITY_DENSITY_WORKFLOW_LABELS = {
  inspect: "Inspect",
  identify: "Name the soil",
  pretest: "Test first",
  treat: "Treat",
  dwell: "Let it work",
  agitate: "Loosen gently",
  rinse: "Rinse/recover",
  dry: "Dry check",
  verify: "Verify",
  stop: "Stop if unchanged",
} as const satisfies Record<WorkflowStage, AuthorityDensityActionLabel>;

const HIGH_RISK_ESCALATIONS = new Set<AuthorityDensityEscalation>([
  "chemical_damage",
  "health_or_biological",
  "moisture_source",
  "commercial_or_turnover",
]);

const TEST_FIRST_ESCALATIONS = new Set<AuthorityDensityEscalation>([
  "surface_risk",
  "workflow_safety",
  "unknown_material",
]);

const STOP_RISK_ESCALATIONS = new Set<AuthorityDensityEscalation>([
  "permanent_finish_change",
  "restoration_boundary",
  "visual_stop",
]);

export function translateAuthorityDensityConfidence(
  confidence: AuthorityDensityConfidence,
): AuthorityDensityConfidenceLabel {
  return AUTHORITY_DENSITY_CONFIDENCE_LABELS[confidence];
}

export function translateAuthorityDensityRisk(args: {
  severity: AuthorityDensitySeverity;
  escalations: readonly AuthorityDensityEscalation[];
}): AuthorityDensityRiskLabel {
  if (args.severity === "critical") return "Stop and assess";

  if (
    args.escalations.includes("permanent_finish_change") ||
    (args.severity === "high" && args.escalations.some((escalation) => STOP_RISK_ESCALATIONS.has(escalation)))
  ) {
    return "Stop and assess";
  }

  if (
    args.severity === "high" ||
    args.escalations.some((escalation) => HIGH_RISK_ESCALATIONS.has(escalation))
  ) {
    return "Use caution";
  }

  if (
    args.severity === "moderate" ||
    args.escalations.some((escalation) => TEST_FIRST_ESCALATIONS.has(escalation)) ||
    args.escalations.some((escalation) => STOP_RISK_ESCALATIONS.has(escalation))
  ) {
    return "Test first";
  }

  return "Routine care";
}

export function translateAuthorityDensityWorkflow(
  stages: readonly WorkflowStage[],
): AuthorityDensityActionLabel[] {
  return [...new Set(stages.map((stage) => AUTHORITY_DENSITY_WORKFLOW_LABELS[stage]))];
}
