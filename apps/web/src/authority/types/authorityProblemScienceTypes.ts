import type { AuthorityProblemSlug } from "@/authority/data/authorityTaxonomy";

export type AuthorityProblemScienceConfidence = "low" | "medium" | "high";

export type AuthorityProblemSeverity =
  | "trace"
  | "light"
  | "moderate"
  | "heavy"
  | "recurring"
  | "likely_damage_or_embedded";

export type AuthorityProblemEscalationType =
  | "surface_risk"
  | "health_or_biological"
  | "moisture_source"
  | "chemical_damage"
  | "permanent_finish_change"
  | "commercial_or_turnover"
  | "unknown_material";

export type AuthorityProblemRemediationMode =
  | "routine_cleaning"
  | "targeted_removal"
  | "source_control"
  | "restoration_or_replacement"
  | "professional_assessment";

export type AuthorityProblemSeverityStep = {
  severity: AuthorityProblemSeverity;
  label: string;
  diagnosticSignal: string;
  rootCauseMeaning: string;
  remediationImplication: string;
};

export type AuthorityProblemMisidentificationTrap = {
  mistakenFor: string;
  whyConfusing: string;
  distinguishingEvidence: string;
};

export type AuthorityProblemDiagnosticCheck = {
  check: string;
  supports: string;
  reducesConfidenceWhen: string;
};

export type AuthorityProblemRemediationStep = {
  mode: AuthorityProblemRemediationMode;
  action: string;
  scienceReason: string;
  stopCondition: string;
};

export type AuthorityProblemPreventionLever = {
  lever: string;
  whyItPreventsRecurrence: string;
};

export type AuthorityProblemScienceProfile = {
  problemSlug: AuthorityProblemSlug;
  observablePattern: string[];
  rootMechanism: string;
  causeDrivers: string[];
  severityLadder: AuthorityProblemSeverityStep[];
  misidentificationTraps: AuthorityProblemMisidentificationTrap[];
  diagnosticChecks: AuthorityProblemDiagnosticCheck[];
  remediationLadder: AuthorityProblemRemediationStep[];
  preventionLevers: AuthorityProblemPreventionLever[];
  expertNotes: string[];
  confidence: AuthorityProblemScienceConfidence;
  escalationType: AuthorityProblemEscalationType[];
  remediationMode: AuthorityProblemRemediationMode[];
};
