/**
 * Recurring estimate confidence decomposition (infrastructure).
 * Additive metadata — does not replace aggregate estimator confidence.
 */

export type ConfidenceClassification = "high" | "medium" | "low" | "critical";

export type ConfidenceDomainSignals = {
  /** Domain-specific confidence score in [0, 1]; higher = more trust in signals for this slice. */
  score: number;
  classification: ConfidenceClassification;
  reasoning: string[];
  evidenceSignals: string[];
  uncertaintyDrivers: string[];
};

export type EstimateConfidenceBreakdown = {
  schemaVersion: "estimate_confidence_breakdown_v1";
  overallConfidence: number;
  confidenceClassification: ConfidenceClassification;
  conditionConfidence: ConfidenceDomainSignals;
  clutterConfidence: ConfidenceDomainSignals;
  kitchenConfidence: ConfidenceDomainSignals;
  bathroomConfidence: ConfidenceDomainSignals;
  petConfidence: ConfidenceDomainSignals;
  recencyConfidence: ConfidenceDomainSignals;
  recurringTransitionConfidence: ConfidenceDomainSignals;
  customerConsistencyConfidence: ConfidenceDomainSignals;
  scopeCompletenessConfidence: ConfidenceDomainSignals;
};

export type EstimateConfidenceComparisonHints = {
  /** Prior quote or last snapshot price (same currency as current estimate). Optional — omit when unknown. */
  priorEstimatedPriceCents?: number;
  currentEstimatedPriceCents?: number;
};
