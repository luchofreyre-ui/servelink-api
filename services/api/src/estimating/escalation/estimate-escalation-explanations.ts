import type { EstimateEscalationRecommendedAction } from "./estimate-escalation-governance.types";

const ACTION_ADMIN_SUMMARY: Record<EstimateEscalationRecommendedAction, string> = {
  no_action: "No governance action required.",
  monitor_in_admin: "Monitor this estimate in admin dashboards.",
  admin_review_required: "Schedule an ops/admin review before treating timing as firm.",
  request_more_intake: "Collect additional structured intake before relying on midpoint labor.",
  request_customer_photos_later: "Plan to request photos after booking if scope remains ambiguous.",
  flag_for_fo_attention: "Flag for franchise-owner attention due to elevated workload uncertainty.",
  recommend_manual_price_review: "Manual price review recommended beyond automated midpoint.",
  recommend_recurring_reset_review: "Review recurring cadence vs last-clean baseline for stability.",
  block_auto_acceptance: "Do not auto-accept marginal dispatch matches without human review.",
  block_autonomous_discounting: "Do not apply autonomous discounting against this estimate baseline.",
};

const LEVEL_CUSTOMER_SAFE: Record<string, string> = {
  none: "This estimate meets routine confidence checks.",
  monitor: "We will keep light operational visibility on this estimate.",
  review: "Additional operational review is recommended before committing to narrow scheduling promises.",
  intervention_required: "Hands-on operational review is required before high-confidence commitments.",
  hard_block:
    "Operational safeguards recommend pausing autonomous downstream automation until intake improves.",
};

/** Maps recommendation codes to cautious customer-safe lines (for future product surfacing). */
export function customerSafeLinesForRecommendedActions(
  actions: EstimateEscalationRecommendedAction[],
): string[] {
  const lines = new Set<string>();
  for (const a of actions) {
    if (a === "no_action") continue;
    switch (a) {
      case "monitor_in_admin":
        lines.add("Our team may quietly verify details behind the scenes.");
        break;
      case "admin_review_required":
        lines.add("A specialist may confirm scope before final scheduling.");
        break;
      case "request_more_intake":
        lines.add("A few additional home details could sharpen timing estimates.");
        break;
      case "request_customer_photos_later":
        lines.add("Photos later could help confirm scope if questions remain.");
        break;
      case "flag_for_fo_attention":
        lines.add("Local operators may review workload signals for this home.");
        break;
      case "recommend_manual_price_review":
        lines.add("Pricing may be verified manually against the quoted baseline.");
        break;
      case "recommend_recurring_reset_review":
        lines.add("Recurring maintenance timing may be reviewed against your last professional clean.");
        break;
      case "block_auto_acceptance":
        lines.add("Automated acceptance paths may be restricted until review completes.");
        break;
      case "block_autonomous_discounting":
        lines.add("Automated discounting may be restricted for this quote.");
        break;
      default:
        break;
    }
  }
  return [...lines].sort((x, y) => x.localeCompare(y));
}

export function adminSummaryLinesForActions(
  actions: EstimateEscalationRecommendedAction[],
): string[] {
  const xs = actions.map((a) => ACTION_ADMIN_SUMMARY[a]);
  return [...new Set(xs)].sort((a, b) => a.localeCompare(b));
}

export function customerSafeHeadlineForLevel(level: string): string {
  return LEVEL_CUSTOMER_SAFE[level] ?? LEVEL_CUSTOMER_SAFE.monitor;
}
