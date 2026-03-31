// autoFailRules.ts

import { evaluatePublishPolicyWithOverride } from "./publishPolicyWithOverride";
import type { AutoFailDecision } from "./autoFailTypes";
import type { ReviewablePage } from "./renderTypes";

const HARD_FAIL_REASONS = new Set([
  "missing-rationale",
  "missing-evidence",
  "missing-sections",
]);

export function getAutoFailDecision(page: ReviewablePage): AutoFailDecision {
  const evaluation = evaluatePublishPolicyWithOverride(page);

  if (evaluation.passed) {
    return {
      shouldAutoFail: false,
      reviewStatus: "draft",
      reasons: [],
      reviewNotes: "",
    };
  }

  const hardFail = evaluation.reasons.some((reason) => HARD_FAIL_REASONS.has(reason));

  const reviewStatus = hardFail ? "rejected" : "draft";

  const reviewNotes = [
    "Auto policy block:",
    ...evaluation.reasons.map((reason) => `- ${reason}`),
  ].join("\n");

  return {
    shouldAutoFail: true,
    reviewStatus,
    reasons: evaluation.reasons,
    reviewNotes,
  };
}
