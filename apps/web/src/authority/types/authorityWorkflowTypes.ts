export type AuthorityWorkflowFamily =
  | "bathroom_maintenance"
  | "floor_care"
  | "kitchen_grease"
  | "chemical_control"
  | "oxidizing_correction"
  | "controlled_lift"
  | "mineral_removal"
  | "glass_clarity"
  | "routine_maintenance";

export type AuthorityWorkflowToolRole = {
  role: string;
  logic: string;
};

export type AuthorityWorkflowChemicalLogic = {
  chemistryClass: string;
  soilFit: string;
  dwellLogic: string;
  residueRecovery: string;
};

export type AuthorityWorkflowSequencePhase = {
  phase: string;
  reason: string;
  dependsOn?: string;
};

export type AuthorityWorkflowFailureSignal = {
  signal: string;
  likelyCause: string;
  diagnosticResponse: string;
};

export type AuthorityWorkflowEscalationTrigger = {
  trigger: string;
  reason: string;
};

export type AuthorityWorkflowSafetyRule = {
  rule: string;
  reason: string;
};

export type AuthorityWorkflowCadenceRule = {
  cadence: string;
  reason: string;
};

export type AuthorityWorkflowDecisionProfile = {
  slug: string;
  title: string;
  summary: string;
  workflowFamily: AuthorityWorkflowFamily;
  intent: string;
  bestForProblemSlugs: string[];
  compatibleSurfaceSlugs: string[];
  supportingMethodSlugs: string[];
  requiredToolRoles: AuthorityWorkflowToolRole[];
  chemicalLogic: AuthorityWorkflowChemicalLogic;
  sequenceLogic: AuthorityWorkflowSequencePhase[];
  failureAnalysis: AuthorityWorkflowFailureSignal[];
  escalationLogic: AuthorityWorkflowEscalationTrigger[];
  safetyLogic: AuthorityWorkflowSafetyRule[];
  cadenceLogic: AuthorityWorkflowCadenceRule[];
  relatedGuides: string[];
  antiPatternSlugs: string[];
};
