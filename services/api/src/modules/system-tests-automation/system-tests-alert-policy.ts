/**
 * Deterministic regression alert rules (Phase 5A).
 * Thresholds are centralized here; tune via env where noted.
 */

export const SYSTEM_TEST_ALERT_POLICY = {
  minNewFailureGroups: 1,
  minFailedDelta: 2,
  /** Pass rate drop as fraction (e.g. 0.05 = five percentage points). */
  minPassRateDrop: 0.05,
  minHighPriorityRerunGroups: 1,
  highRerunScoreThreshold: 40,
} as const;

export type RegressionSignalInput = {
  newFailureGroupCount: number;
  failedDelta: number;
  passRateDelta: number;
  highPriorityFailureCount: number;
  stableFileSharpRegression: boolean;
};

export type RegressionPolicyResult = {
  shouldAlert: boolean;
  reasons: string[];
};

export function evaluateRegressionAlertPolicy(input: RegressionSignalInput): RegressionPolicyResult {
  const reasons: string[] = [];

  if (input.newFailureGroupCount >= SYSTEM_TEST_ALERT_POLICY.minNewFailureGroups) {
    reasons.push(
      `New failure groups >= ${SYSTEM_TEST_ALERT_POLICY.minNewFailureGroups} (actual ${input.newFailureGroupCount}).`,
    );
  }
  if (input.failedDelta >= SYSTEM_TEST_ALERT_POLICY.minFailedDelta) {
    reasons.push(
      `Failed count delta >= ${SYSTEM_TEST_ALERT_POLICY.minFailedDelta} (actual ${input.failedDelta}).`,
    );
  }
  if (input.passRateDelta <= -SYSTEM_TEST_ALERT_POLICY.minPassRateDrop) {
    reasons.push(
      `Pass rate dropped by at least ${(SYSTEM_TEST_ALERT_POLICY.minPassRateDrop * 100).toFixed(1)} pts (actual delta ${(input.passRateDelta * 100).toFixed(2)} pts).`,
    );
  }
  if (input.highPriorityFailureCount >= SYSTEM_TEST_ALERT_POLICY.minHighPriorityRerunGroups) {
    reasons.push(
      `High-priority rerun groups >= ${SYSTEM_TEST_ALERT_POLICY.minHighPriorityRerunGroups} (score ≥ ${SYSTEM_TEST_ALERT_POLICY.highRerunScoreThreshold}; actual ${input.highPriorityFailureCount}).`,
    );
  }
  if (input.stableFileSharpRegression) {
    reasons.push("Historically quiet file regressed sharply (≥2 new failures or jump of ≥2 vs base).");
  }

  return {
    shouldAlert: reasons.length > 0,
    reasons,
  };
}
