import type { ConfidenceClassification, EstimateConfidenceBreakdown } from "./estimate-confidence-breakdown.types";

export function classifyOverallConfidence(score: number): ConfidenceClassification {
  if (score >= 0.75) return "high";
  if (score >= 0.65) return "medium";
  if (score >= 0.35) return "low";
  return "critical";
}

export function classifyDomainScore(score: number): ConfidenceClassification {
  if (score >= 0.8) return "high";
  if (score >= 0.6) return "medium";
  if (score >= 0.4) return "low";
  return "critical";
}

/** Stable internal codes → human-readable clauses for admin/support tooling (not customer-visible yet). */
const UNCERTAINTY_DRIVER_COPY: Record<string, string> = {
  dust_level_ambiguous: "Dust and settled-soil signals were left ambiguous.",
  overall_labor_condition_missing: "Whole-home labor condition was not captured.",
  condition_cross_signal_conflict: "Overall condition narrative conflicts with kitchen or bathroom severity.",
  condition_narrative_mismatch: "Reset-level narrative does not match light kitchen/bathroom selections.",
  clutter_band_unknown: "Clutter intensity is unknown.",
  clutter_access_vs_band_conflict: "Access pathways suggest heavier clutter than the clutter band implies.",
  occupancy_vs_clutter_band_conflict: "Occupancy suggests clutter while clutter reads minimal or light.",
  kitchen_condition_unknown: "Kitchen details were incomplete.",
  kitchen_intensity_missing: "Kitchen intensity answers were not captured.",
  stovetop_unknown_under_heavy_kitchen: "Heavy grease kitchen without a definite stovetop type.",
  bathroom_condition_unknown: "Bathroom workload signals were left unsure.",
  glass_showers_ambiguous: "Glass shower workload is not pinned.",
  pet_presence_unknown: "Pet impact uncertainty is elevated.",
  pet_shedding_missing: "Shedding intensity was not specified while pets are present.",
  pet_impact_vs_presence_conflict: "Pet impact conflicts with pet-presence answers.",
  pet_accidents_ambiguous: "Pet accident / litter risk was left unsure.",
  recency_unknown_dual_channel: "Last professional clean timing is unclear.",
  structured_recency_stale_or_unknown: "Structured recency indicates a long or unknown gap since pro maintenance.",
  recency_cross_channel_conflict: "Legacy and structured recency answers disagree.",
  cadence_vs_recency_mismatch:
    "Recurring maintenance confidence is reduced due to cadence vs long recency gap.",
  legacy_recency_unstable_for_recurring:
    "Returning-customer path shows stale or unsure legacy professional-clean timing.",
  recurring_price_collapse_vs_prior: "Large drop versus a prior estimate weakens transition stability confidence.",
  first_time_unknown: "First-time-with-platform status is unsure.",
  occupancy_vs_access_conflict: "Occupancy vs access/clutter selections disagree.",
  structured_intake_gaps: "Structured questionnaire coverage is incomplete.",
};

export function explainUncertaintyDriver(driverCode: string): string {
  return UNCERTAINTY_DRIVER_COPY[driverCode] ?? `Uncertainty factor recorded (${driverCode}).`;
}

export function explainBreakdownTopIssues(
  b: EstimateConfidenceBreakdown,
  limit = 5,
): string[] {
  const pairs: Array<{ domain: string; score: number; reasoning: string[] }> = [
    { domain: "condition", score: b.conditionConfidence.score, reasoning: b.conditionConfidence.reasoning },
    { domain: "clutter", score: b.clutterConfidence.score, reasoning: b.clutterConfidence.reasoning },
    { domain: "kitchen", score: b.kitchenConfidence.score, reasoning: b.kitchenConfidence.reasoning },
    { domain: "bathroom", score: b.bathroomConfidence.score, reasoning: b.bathroomConfidence.reasoning },
    { domain: "pet", score: b.petConfidence.score, reasoning: b.petConfidence.reasoning },
    { domain: "recency", score: b.recencyConfidence.score, reasoning: b.recencyConfidence.reasoning },
    {
      domain: "recurring_transition",
      score: b.recurringTransitionConfidence.score,
      reasoning: b.recurringTransitionConfidence.reasoning,
    },
    {
      domain: "customer_consistency",
      score: b.customerConsistencyConfidence.score,
      reasoning: b.customerConsistencyConfidence.reasoning,
    },
    {
      domain: "scope_completeness",
      score: b.scopeCompletenessConfidence.score,
      reasoning: b.scopeCompletenessConfidence.reasoning,
    },
  ];

  const sorted = [...pairs].sort((a, b) => a.score - b.score);
  const out: string[] = [];
  for (const row of sorted) {
    for (const line of row.reasoning) {
      if (out.length >= limit) return out;
      out.push(`${row.domain}: ${line}`);
    }
  }
  return out;
}

/** Internal copy helpers for admin/explainability surfaces (no customer exposure here). */
export function summarizeBreakdownForAdmin(b: EstimateConfidenceBreakdown): {
  headline: string;
  weakestDomains: string[];
  topUncertaintyDrivers: string[];
} {
  const domains: Array<{ key: string; score: number }> = [
    { key: "condition", score: b.conditionConfidence.score },
    { key: "clutter", score: b.clutterConfidence.score },
    { key: "kitchen", score: b.kitchenConfidence.score },
    { key: "bathroom", score: b.bathroomConfidence.score },
    { key: "pet", score: b.petConfidence.score },
    { key: "recency", score: b.recencyConfidence.score },
    { key: "recurring_transition", score: b.recurringTransitionConfidence.score },
    { key: "customer_consistency", score: b.customerConsistencyConfidence.score },
    { key: "scope_completeness", score: b.scopeCompletenessConfidence.score },
  ];

  const sorted = [...domains].sort((a, b) => a.score - b.score);
  const weakestDomains = sorted.slice(0, 3).map((d) => d.key);

  const drivers = [
    ...b.conditionConfidence.uncertaintyDrivers,
    ...b.clutterConfidence.uncertaintyDrivers,
    ...b.kitchenConfidence.uncertaintyDrivers,
    ...b.bathroomConfidence.uncertaintyDrivers,
    ...b.petConfidence.uncertaintyDrivers,
    ...b.recencyConfidence.uncertaintyDrivers,
    ...b.recurringTransitionConfidence.uncertaintyDrivers,
    ...b.customerConsistencyConfidence.uncertaintyDrivers,
    ...b.scopeCompletenessConfidence.uncertaintyDrivers,
  ];
  const uniq = [...new Set(drivers)];
  const topUncertaintyDrivers = uniq.slice(0, 8);

  const headline =
    b.confidenceClassification === "high"
      ? "Estimate confidence is strong across structured intake domains."
      : b.confidenceClassification === "medium"
        ? "Estimate confidence is acceptable; review flagged domains before promising narrow windows."
        : b.confidenceClassification === "low"
          ? "Estimate confidence is weak — expand intake or schedule ops review."
          : "Estimate confidence is critical — do not treat midpoint minutes as reliable until intake improves.";

  return { headline, weakestDomains, topUncertaintyDrivers };
}
