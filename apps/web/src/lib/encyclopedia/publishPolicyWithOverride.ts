// publishPolicyWithOverride.ts

import { evaluatePublishPolicy } from "./publishPolicy";
import type { PublishFailureReason, PublishPolicyEvaluation } from "./publishPolicyTypes";
import type { ReviewablePage } from "./renderTypes";

const FORCE_FAIL_OVERRIDE: PublishFailureReason = "force-fail-override";

/**
 * Reads `page.editorialOverrideMode` (force-pass / force-fail). Otherwise delegates to
 * `evaluatePublishPolicy`. Always returns `PublishPolicyEvaluation` so callers stay type-safe.
 */
export function evaluatePublishPolicyWithOverride(
  page: ReviewablePage
): PublishPolicyEvaluation {
  const override = page.editorialOverrideMode;

  if (override === "force-pass") {
    const base = evaluatePublishPolicy(page);
    return {
      ...base,
      passed: true,
      reasons: [],
      overridden: true,
    };
  }

  if (override === "force-fail") {
    const base = evaluatePublishPolicy(page);
    return {
      ...base,
      passed: false,
      reasons: [FORCE_FAIL_OVERRIDE],
      overridden: true,
    };
  }

  const base = evaluatePublishPolicy(page);
  return { ...base, overridden: false };
}
