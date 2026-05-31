export type AuthorityDensityConfidenceLabel = "Strong match" | "Likely match" | "Confirm first";

export type AuthorityDensityRiskLabel =
  | "Routine care"
  | "Test first"
  | "Use caution"
  | "Stop and assess";

export type AuthorityDensityActionLabel =
  | "Inspect"
  | "Name the soil"
  | "Test first"
  | "Treat"
  | "Let it work"
  | "Loosen gently"
  | "Rinse/recover"
  | "Dry check"
  | "Verify"
  | "Stop if unchanged";

export type AuthorityDensityPresentation = {
  confidenceLabel: AuthorityDensityConfidenceLabel;
  riskLabel: AuthorityDensityRiskLabel;
  actionLabels: AuthorityDensityActionLabel[];
  stopGuidance: string | null;
  helperText: string | null;
};
