/**
 * Deterministic escalation governance derived from estimate confidence breakdown.
 * Recommendations only — does not enforce booking, pricing, or customer flows.
 */

export type EstimateEscalationLevel =
  | "none"
  | "monitor"
  | "review"
  | "intervention_required"
  | "hard_block";

/** Operational recommendation codes — internal governance taxonomy V1. */
export type EstimateEscalationRecommendedAction =
  | "no_action"
  | "monitor_in_admin"
  | "admin_review_required"
  | "request_more_intake"
  | "request_customer_photos_later"
  | "flag_for_fo_attention"
  | "recommend_manual_price_review"
  | "recommend_recurring_reset_review"
  | "block_auto_acceptance"
  | "block_autonomous_discounting";

export type EstimateEscalationGovernanceContext = {
  /** Estimator flags when evaluation runs inside EstimatorService (optional for pure breakdown-only tests). */
  estimatorFlags?: readonly string[];
  /** Uncapped risk percent (0–100) from estimator risk accumulator. */
  riskPercentUncapped?: number;
  /** Estimator presentation mode. */
  estimatorMode?: "STANDARD" | "CAPPED" | "STAGED";
};

export type EstimateEscalationConfidenceInputsEcho = {
  overallConfidence: number;
  confidenceClassification: string;
  domainScores: Record<string, number>;
  domainClassifications: Record<string, string>;
  /** Union of uncertainty driver codes surfaced across domains (deterministic order applied downstream). */
  distinctUncertaintyDriverCount: number;
};

export type EstimateEscalationGovernance = {
  schemaVersion: "estimate_escalation_governance_v1";
  sourceConfidenceSchemaVersion: string;
  escalationLevel: EstimateEscalationLevel;
  /** Stable rule/outcome codes for audits (sorted). */
  escalationReasons: string[];
  recommendedActions: EstimateEscalationRecommendedAction[];
  /** Governance-only blocking guidance — not enforced against customers in V1. */
  blockingReasons: string[];
  /** Domain keys tied to elevated escalation drivers (sorted). */
  affectedDomains: string[];
  /** Normalized 0–100 composite — higher means more escalation pressure. */
  severityScore: number;
  /** Safe language for future customer-facing surfaces; internal-only for V1. */
  customerSafeSummary: string[];
  /** Operator-facing lines (sorted where aggregated from codes). */
  adminSummary: string[];
  confidenceInputs: EstimateEscalationConfidenceInputsEcho;
  /** Correlates governance with estimator signals — additive audit trail. */
  auditSignals: string[];
};
