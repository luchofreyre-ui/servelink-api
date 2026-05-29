export type VisualPurpose =
  | "identification"
  | "severity"
  | "progression"
  | "misidentification"
  | "workflow";

export type VisualAssetStatus =
  | "planned"
  | "briefed"
  | "generated"
  | "approved"
  | "live";

export type VisualSource =
  | "not-yet-generated"
  | "owned"
  | "ai-generated"
  | "external"
  | "fallback";

export type VisualAuthorityKind =
  | "problem"
  | "surface"
  | "misidentification";

export type SeverityBand =
  | "not-applicable"
  | "mild"
  | "moderate"
  | "severe"
  | "failed"
  | "permanent-risk";

export type ProgressionStage =
  | "not-applicable"
  | "early"
  | "established"
  | "recurring"
  | "damaged"
  | "irreversible-risk";

export type WorkflowStage =
  | "inspect"
  | "identify"
  | "pretest"
  | "treat"
  | "dwell"
  | "agitate"
  | "rinse"
  | "dry"
  | "verify"
  | "stop";

export type VisualDiagnosticProfile = {
  slug: string;
  title: string;
  authorityKind: VisualAuthorityKind;
  visualPurpose: VisualPurpose[];
  assetStatus: VisualAssetStatus;
  source: VisualSource;
  assetId: string;
  src: string | null;
  alt: string;
  diagnosticClaim: string;
  visibleMarkers: string[];
  expertRead: string;
  severityBand: SeverityBand;
  progressionStage: ProgressionStage;
  misidentifiedAs: string[];
  distinguishFrom: string[];
  wrongActionRisk: string;
  workflowStage: WorkflowStage[];
  nextAction: string;
  stopCondition: string;
  approvalNotes: string;
};

export type VisualDiagnosticValidationError = {
  slug: string;
  field: keyof VisualDiagnosticProfile | "profile";
  message: string;
};

export type VisualDiagnosticValidationResult = {
  valid: boolean;
  errors: VisualDiagnosticValidationError[];
};
