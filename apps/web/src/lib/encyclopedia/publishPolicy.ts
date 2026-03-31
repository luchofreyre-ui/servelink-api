// publishPolicy.ts

import type { PublishPolicyEvaluation, PublishFailureReason } from "./publishPolicyTypes";
import type { ReviewablePage } from "./renderTypes";

export const PUBLISH_POLICY_THRESHOLDS = {
  minOverallQuality: 70,
  minEvidenceCoverage: 55,
  minInternalLinkCoverage: 40,
  minSectionCount: 6,
  highRiskMinEvidenceCoverage: 70,
} as const;

export function evaluatePublishPolicy(
  page: ReviewablePage
): PublishPolicyEvaluation {
  const reasons: PublishFailureReason[] = [];

  const quality = page.qualityScore;
  const sectionCount = page.sections.length;
  const hasRationale =
    Boolean(page.rationale?.chemicalReason) &&
    Boolean(page.rationale?.toolReason);
  const evidenceCount = page.evidence?.length ?? 0;

  if (!quality || quality.overall < PUBLISH_POLICY_THRESHOLDS.minOverallQuality) {
    reasons.push("quality-too-low");
  }

  if (!quality || quality.evidenceCoverage < PUBLISH_POLICY_THRESHOLDS.minEvidenceCoverage) {
    reasons.push("evidence-too-thin");
  }

  if (
    !quality ||
    quality.internalLinkCoverage < PUBLISH_POLICY_THRESHOLDS.minInternalLinkCoverage
  ) {
    reasons.push("internal-links-too-thin");
  }

  if (!hasRationale) {
    reasons.push("missing-rationale");
  }

  if (evidenceCount === 0) {
    reasons.push("missing-evidence");
  }

  if (sectionCount < PUBLISH_POLICY_THRESHOLDS.minSectionCount) {
    reasons.push("missing-sections");
  }

  if (
    page.riskLevel === "high" &&
    (!quality ||
      quality.evidenceCoverage <
        PUBLISH_POLICY_THRESHOLDS.highRiskMinEvidenceCoverage)
  ) {
    reasons.push("high-risk-needs-stronger-evidence");
  }

  return {
    passed: reasons.length === 0,
    reasons,
    thresholds: PUBLISH_POLICY_THRESHOLDS,
  };
}
