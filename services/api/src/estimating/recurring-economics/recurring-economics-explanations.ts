/**
 * Human-readable lines for recurring economics governance codes (admin-first).
 */

import type { RecurringEconomicsRecommendedAction } from "./recurring-economics-governance.types";

const ACTION_COPY: Record<RecurringEconomicsRecommendedAction, string> = {
  no_action: "No recurring economics action indicated.",
  monitor_recurring_account: "Monitor recurring account stability on future visits.",
  review_recurring_discount: "Review recurring discount vs labor signals before changing price.",
  review_estimated_minutes: "Review estimated minutes vs priced minutes alignment.",
  review_reset_requirement: "Review whether a maintenance reset visit is appropriate.",
  flag_for_manual_pricing_review: "Flag for manual pricing review (advisory).",
  flag_for_fo_feedback: "Consider FO feedback on scope or site readiness.",
  collect_more_condition_evidence: "Collect more condition evidence on intake.",
  protect_margin_before_discounting: "Protect margin before further discounting.",
  do_not_autonomously_reduce_price: "Avoid autonomous price reductions while signals are elevated.",
};

export function explainRecurringEconomicsRecommendedAction(
  code: RecurringEconomicsRecommendedAction,
): string {
  return ACTION_COPY[code] ?? code;
}

export function recurringEconomicsReasonLabel(code: string): string {
  const map: Record<string, string> = {
    recurring_lane_not_applicable: "Not evaluated as a recurring maintenance lane.",
    escalation_hard_block: "Escalation governance at hard block (advisory).",
    escalation_intervention: "Escalation governance requests intervention (advisory).",
    recurring_price_collapse_signal: "Large decrease vs prior estimate suggested.",
    sparse_structured_intake: "Structured intake coverage gaps.",
    recurring_transition_weak: "Recurring transition confidence is weak.",
    recurring_transition_critical: "Recurring transition confidence is critical.",
    scope_completeness_weak: "Scope completeness confidence is weak.",
    cadence_recency_mismatch: "Cadence vs last-clean timing mismatch.",
    legacy_recency_instability: "Legacy recency horizon unstable for recurring.",
    pet_signal_ambiguity: "Pet-related signals are ambiguous.",
    clutter_signal_uncertainty: "Clutter/access signals are uncertain.",
    condition_signal_uncertainty: "Condition signals are uncertain or conflicting.",
    escalation_recurring_reset: "Escalation recommends recurring reset review.",
    elevated_uncapped_risk: "Elevated uncapped scope risk on estimate.",
    manual_price_review_escalation: "Escalation recommends manual price review.",
    block_autonomous_discounting_escalation:
      "Escalation recommends blocking autonomous discounting.",
    maintenance_lane_stable: "Maintenance signals appear stable.",
    maintenance_lane_watch: "Maintenance viability warrants watching.",
    maintenance_lane_unstable: "Maintenance viability looks unstable.",
    maintenance_reset_alignment: "Maintenance profile aligns with reset review.",
  };
  return map[code] ?? code.replace(/_/g, " ");
}
