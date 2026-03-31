// failureReasonLabels.ts

import type { PublishFailureReason } from "./publishPolicyTypes";

export const FAILURE_REASON_LABELS: Record<PublishFailureReason, string> = {
  "quality-too-low": "Quality too low",
  "evidence-too-thin": "Evidence too thin",
  "internal-links-too-thin": "Internal links too thin",
  "missing-rationale": "Missing rationale",
  "missing-evidence": "Missing evidence",
  "missing-sections": "Missing sections",
  "high-risk-needs-stronger-evidence": "High-risk page needs stronger evidence",
  "force-fail-override": "Editorial force-fail override",
};
