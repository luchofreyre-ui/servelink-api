// publishPolicyTypes.ts

export type PublishFailureReason =
  | "quality-too-low"
  | "evidence-too-thin"
  | "internal-links-too-thin"
  | "missing-rationale"
  | "missing-evidence"
  | "missing-sections"
  | "high-risk-needs-stronger-evidence"
  | "force-fail-override";

export type PublishPolicyEvaluation = {
  passed: boolean;
  reasons: PublishFailureReason[];
  overridden?: boolean;
  thresholds: {
    minOverallQuality: number;
    minEvidenceCoverage: number;
    minInternalLinkCoverage: number;
    minSectionCount: number;
    highRiskMinEvidenceCoverage: number;
  };
};
