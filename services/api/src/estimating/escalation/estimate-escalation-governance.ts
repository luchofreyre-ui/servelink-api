import type {
  ConfidenceClassification,
  EstimateConfidenceBreakdown,
} from "../confidence/estimate-confidence-breakdown.types";
import type {
  EstimateEscalationGovernance,
  EstimateEscalationGovernanceContext,
  EstimateEscalationLevel,
  EstimateEscalationRecommendedAction,
} from "./estimate-escalation-governance.types";
import {
  adminSummaryLinesForActions,
  customerSafeHeadlineForLevel,
  customerSafeLinesForRecommendedActions,
} from "./estimate-escalation-explanations";

function uniqSorted(xs: string[]): string[] {
  return [...new Set(xs)].sort((a, b) => a.localeCompare(b));
}

function collectDomainEntries(b: EstimateConfidenceBreakdown): Array<{
  key: string;
  classification: ConfidenceClassification;
  score: number;
  drivers: string[];
}> {
  return [
    { key: "condition", ...pick(b.conditionConfidence) },
    { key: "clutter", ...pick(b.clutterConfidence) },
    { key: "kitchen", ...pick(b.kitchenConfidence) },
    { key: "bathroom", ...pick(b.bathroomConfidence) },
    { key: "pet", ...pick(b.petConfidence) },
    { key: "recency", ...pick(b.recencyConfidence) },
    { key: "recurring_transition", ...pick(b.recurringTransitionConfidence) },
    { key: "customer_consistency", ...pick(b.customerConsistencyConfidence) },
    { key: "scope_completeness", ...pick(b.scopeCompletenessConfidence) },
  ];
}

function pick(d: EstimateConfidenceBreakdown["conditionConfidence"]) {
  return {
    classification: d.classification,
    score: d.score,
    drivers: d.uncertaintyDrivers,
  };
}

function computeSeverity(params: {
  overallCls: ConfidenceClassification;
  criticalCount: number;
  lowCount: number;
  scopeCls: ConfidenceClassification;
  recurringCls: ConfidenceClassification;
  hasPriceCollapse: boolean;
  recurringInstability: boolean;
  sparseIntake: boolean;
  driverCount: number;
  ctx?: EstimateEscalationGovernanceContext;
}): number {
  let s = 0;
  switch (params.overallCls) {
    case "high":
      s += 10;
      break;
    case "medium":
      s += 28;
      break;
    case "low":
      s += 52;
      break;
    case "critical":
      s += 76;
      break;
    default:
      s += 35;
  }

  s += params.criticalCount * 15;
  s += Math.max(0, params.lowCount - 1) * 9;

  if (params.scopeCls === "critical") s += 18;
  else if (params.scopeCls === "low") s += 10;

  if (params.recurringCls === "critical") s += 14;
  else if (params.recurringCls === "low") s += 8;

  if (params.hasPriceCollapse) s += 16;
  if (params.recurringInstability) s += 12;
  if (params.sparseIntake) s += 10;

  s += Math.min(18, Math.floor(params.driverCount * 1.6));

  const risk = params.ctx?.riskPercentUncapped ?? 0;
  if (risk >= 35) s += 10;
  else if (risk >= 26) s += 6;

  if (params.ctx?.estimatorMode === "STAGED") s += 8;
  if (params.ctx?.estimatorFlags?.includes("LOW_CONFIDENCE")) s += 4;

  return Math.round(Math.min(100, Math.max(0, s)));
}

function mergeActions(xs: EstimateEscalationRecommendedAction[]): EstimateEscalationRecommendedAction[] {
  const order: EstimateEscalationRecommendedAction[] = [
    "no_action",
    "monitor_in_admin",
    "admin_review_required",
    "request_more_intake",
    "request_customer_photos_later",
    "flag_for_fo_attention",
    "recommend_manual_price_review",
    "recommend_recurring_reset_review",
    "block_auto_acceptance",
    "block_autonomous_discounting",
  ];
  const rank = new Map(order.map((a, i) => [a, i]));
  return [...new Set(xs)].sort((a, b) => (rank.get(a)! ?? 99) - (rank.get(b)! ?? 99));
}

/**
 * Pure governance evaluation — recommendations only, no side effects.
 */
export function evaluateEstimateEscalationGovernance(
  confidenceBreakdown: EstimateConfidenceBreakdown,
  context?: EstimateEscalationGovernanceContext,
): EstimateEscalationGovernance {
  const entries = collectDomainEntries(confidenceBreakdown);
  const allDrivers = uniqSorted(entries.flatMap((e) => e.drivers));

  const criticalDomainKeys = entries.filter((e) => e.classification === "critical").map((e) => e.key);
  const lowDomainKeys = entries.filter((e) => e.classification === "low").map((e) => e.key);

  const overallCls = confidenceBreakdown.confidenceClassification;
  const scope = confidenceBreakdown.scopeCompletenessConfidence;
  const recurring = confidenceBreakdown.recurringTransitionConfidence;

  const hasPriceCollapse = allDrivers.includes("recurring_price_collapse_vs_prior");
  const recurringInstability =
    allDrivers.includes("cadence_vs_recency_mismatch") ||
    allDrivers.includes("legacy_recency_unstable_for_recurring");
  const sparseIntake = allDrivers.includes("structured_intake_gaps");

  const petAmbiguity =
    allDrivers.includes("pet_presence_unknown") ||
    allDrivers.includes("pet_impact_vs_presence_conflict") ||
    allDrivers.includes("pet_shedding_missing") ||
    allDrivers.includes("pet_accidents_ambiguous");

  const recencyAmbiguity =
    allDrivers.includes("recency_unknown_dual_channel") ||
    allDrivers.includes("structured_recency_stale_or_unknown") ||
    allDrivers.includes("recency_cross_channel_conflict");

  const conflictingSignals =
    allDrivers.includes("condition_cross_signal_conflict") ||
    allDrivers.includes("clutter_access_vs_band_conflict") ||
    allDrivers.includes("occupancy_vs_clutter_band_conflict");

  let level: EstimateEscalationLevel = "none";
  const escalationReasons: string[] = [];

  const hardBlock =
    overallCls === "critical" &&
    scope.classification === "critical" &&
    scope.score <= 0.42;

  const interventionPriceWeak =
    hasPriceCollapse &&
    (overallCls === "low" ||
      overallCls === "critical" ||
      criticalDomainKeys.length >= 1);

  const overallCriticalIntervention = overallCls === "critical" && !hardBlock;

  if (hardBlock) {
    level = "hard_block";
    escalationReasons.push("hard_block_critical_overall_and_scope_completeness");
  } else if (overallCriticalIntervention || criticalDomainKeys.length >= 2 || interventionPriceWeak) {
    level = "intervention_required";
    if (overallCriticalIntervention) escalationReasons.push("overall_confidence_critical");
    if (criticalDomainKeys.length >= 2) escalationReasons.push("multiple_domains_critical");
    if (interventionPriceWeak) escalationReasons.push("price_collapse_with_weak_trust_signals");
  } else if (
    overallCls === "low" ||
    criticalDomainKeys.length >= 1 ||
    lowDomainKeys.length >= 3 ||
    (lowDomainKeys.length >= 2 &&
      (overallCls === "high" || overallCls === "medium")) ||
    recurringInstability ||
    hasPriceCollapse
  ) {
    level = "review";
    if (overallCls === "low") escalationReasons.push("overall_confidence_low");
    if (criticalDomainKeys.length === 1) escalationReasons.push("single_domain_critical");
    if (lowDomainKeys.length >= 3) escalationReasons.push("multiple_domains_low");
    if (lowDomainKeys.length >= 2 && (overallCls === "high" || overallCls === "medium")) {
      escalationReasons.push("compound_low_domain_pressure");
    }
    if (recurringInstability) escalationReasons.push("recurring_transition_instability");
    if (hasPriceCollapse) escalationReasons.push("material_price_drop_vs_prior_estimate");
  } else if (
    overallCls === "medium" ||
    (overallCls === "high" && lowDomainKeys.length === 1 && criticalDomainKeys.length === 0)
  ) {
    level = "monitor";
    escalationReasons.push("elevated_visibility_medium_overall_or_isolated_low_domain");
  } else if (
    overallCls === "high" &&
    criticalDomainKeys.length === 0 &&
    lowDomainKeys.length === 0 &&
    !hasPriceCollapse &&
    !recurringInstability
  ) {
    level = "none";
    escalationReasons.push("routine_confidence_profile");
  } else {
    level = "none";
    escalationReasons.push("routine_confidence_profile");
  }

  const affectedDomains = uniqSorted([
    ...criticalDomainKeys,
    ...lowDomainKeys,
    ...(hasPriceCollapse ? ["recurring_transition"] : []),
    ...(recurringInstability ? ["recurring_transition", "recency"] : []),
    ...(sparseIntake ? ["scope_completeness"] : []),
    ...(petAmbiguity ? ["pet"] : []),
    ...(recencyAmbiguity ? ["recency"] : []),
  ]);

  let recommendedActions: EstimateEscalationRecommendedAction[] = [];

  switch (level) {
    case "none":
      recommendedActions = ["no_action"];
      break;
    case "monitor":
      recommendedActions = ["monitor_in_admin"];
      break;
    case "review":
      recommendedActions = ["admin_review_required", "monitor_in_admin"];
      break;
    case "intervention_required":
      recommendedActions = [
        "admin_review_required",
        "recommend_manual_price_review",
        "block_auto_acceptance",
        "monitor_in_admin",
      ];
      break;
    case "hard_block":
      recommendedActions = [
        "admin_review_required",
        "request_more_intake",
        "recommend_manual_price_review",
        "block_auto_acceptance",
        "block_autonomous_discounting",
        "monitor_in_admin",
      ];
      break;
    default:
      recommendedActions = ["no_action"];
  }

  if (sparseIntake) recommendedActions.push("request_more_intake");
  if (petAmbiguity) recommendedActions.push("flag_for_fo_attention");
  if (recencyAmbiguity || recurringInstability) {
    recommendedActions.push("recommend_recurring_reset_review");
  }
  if (sparseIntake || conflictingSignals) {
    recommendedActions.push("request_customer_photos_later");
  }
  if (hasPriceCollapse) recommendedActions.push("recommend_manual_price_review");

  recommendedActions = mergeActions(recommendedActions);

  let blockingReasons: string[] = [];
  if (level === "hard_block") {
    blockingReasons = [
      "governance_v1_hard_block_manual_confirmation_expected",
      "governance_v1_restrict_autonomous_discounting",
    ];
  } else if (level === "intervention_required") {
    blockingReasons = ["governance_v1_auto_acceptance_not_recommended"];
  } else if (level === "review") {
    blockingReasons = ["governance_v1_heightened_ops_scrutiny_recommended"];
  }

  blockingReasons = uniqSorted(blockingReasons);

  const severityScore = computeSeverity({
    overallCls,
    criticalCount: criticalDomainKeys.length,
    lowCount: lowDomainKeys.length,
    scopeCls: scope.classification,
    recurringCls: recurring.classification,
    hasPriceCollapse,
    recurringInstability,
    sparseIntake,
    driverCount: allDrivers.length,
    ctx: context,
  });

  const domainScores: Record<string, number> = {};
  const domainClassifications: Record<string, string> = {};
  for (const e of entries) {
    domainScores[e.key] = e.score;
    domainClassifications[e.key] = e.classification;
  }

  const auditSignals = uniqSorted([
    `governance_level:${level}`,
    `severity_score:${severityScore}`,
    `distinct_uncertainty_drivers:${allDrivers.length}`,
    ...(context?.estimatorFlags?.map((f) => `estimator_flag:${f}`) ?? []),
    ...(context?.estimatorMode ? [`estimator_mode:${context.estimatorMode}`] : []),
    ...(typeof context?.riskPercentUncapped === "number"
      ? [`risk_percent_uncapped:${context.riskPercentUncapped}`]
      : []),
  ]);

  const customerSafeSummary = uniqSorted([
    customerSafeHeadlineForLevel(level),
    ...customerSafeLinesForRecommendedActions(recommendedActions),
  ]);

  const adminSummary = uniqSorted([
    ...adminSummaryLinesForActions(recommendedActions),
    ...escalationReasons.map((r) => `Reason code: ${r}`),
  ]);

  return {
    schemaVersion: "estimate_escalation_governance_v1",
    sourceConfidenceSchemaVersion: confidenceBreakdown.schemaVersion,
    escalationLevel: level,
    escalationReasons: uniqSorted(escalationReasons),
    recommendedActions,
    blockingReasons,
    affectedDomains,
    severityScore,
    customerSafeSummary,
    adminSummary,
    confidenceInputs: {
      overallConfidence: confidenceBreakdown.overallConfidence,
      confidenceClassification: confidenceBreakdown.confidenceClassification,
      domainScores,
      domainClassifications,
      distinctUncertaintyDriverCount: allDrivers.length,
    },
    auditSignals,
  };
}
