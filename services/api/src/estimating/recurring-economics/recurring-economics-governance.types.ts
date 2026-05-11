/**
 * Recurring economics governance — advisory metadata derived from estimate signals.
 * Does not enforce pricing, bookings, or discounts.
 */

export const RECURRING_ECONOMICS_GOVERNANCE_SCHEMA =
  "recurring_economics_governance_v1" as const;

export type EconomicRiskLevel =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type MaintenanceViability =
  | "stable"
  | "watch"
  | "unstable"
  | "reset_review_needed"
  | "not_applicable";

export type RecurringDiscountRisk = EconomicRiskLevel;

export type ResetReviewRecommendation = "none" | "suggested" | "required";

export type MarginProtectionSignal = "none" | "monitor" | "review" | "protect";

/** Operational recommendation codes — recurring economics lane V1. */
export type RecurringEconomicsRecommendedAction =
  | "no_action"
  | "monitor_recurring_account"
  | "review_recurring_discount"
  | "review_estimated_minutes"
  | "review_reset_requirement"
  | "flag_for_manual_pricing_review"
  | "flag_for_fo_feedback"
  | "collect_more_condition_evidence"
  | "protect_margin_before_discounting"
  | "do_not_autonomously_reduce_price";

export type RecurringEconomicsSourceSignals = {
  appliesRecurringLane: boolean;
  serviceType: string;
  recurringCadenceIntent: string | null;
  hasPriceCollapseDriver: boolean;
  hasSparseIntakeDriver: boolean;
  recurringTransitionClassification: string | null;
  scopeCompletenessClassification: string | null;
  escalationLevel: string | null;
  escalationSeverityScore: number | null;
  lowOrCriticalDomainCount: number;
  hasCadenceRecencyMismatch: boolean;
  hasLegacyRecencyInstability: boolean;
};

export type RecurringEconomicsGovernance = {
  schemaVersion: typeof RECURRING_ECONOMICS_GOVERNANCE_SCHEMA;
  economicRiskLevel: EconomicRiskLevel;
  maintenanceViability: MaintenanceViability;
  recurringDiscountRisk: RecurringDiscountRisk;
  resetReviewRecommendation: ResetReviewRecommendation;
  marginProtectionSignal: MarginProtectionSignal;
  /** Deterministic composite 0–100 — higher = more economic/maintenance pressure. */
  riskScore: number;
  economicReasons: string[];
  maintenanceReasons: string[];
  recommendedActions: RecurringEconomicsRecommendedAction[];
  affectedSignals: string[];
  adminSummary: string[];
  customerSafeSummary: string[];
  sourceSignals: RecurringEconomicsSourceSignals;
};
