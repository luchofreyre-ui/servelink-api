/**
 * Pure recurring economics governance — deterministic, no I/O.
 */

import type {
  EstimateConfidenceBreakdown,
  EstimateConfidenceComparisonHints,
} from "../confidence/estimate-confidence-breakdown.types";
import type { EstimateEscalationGovernance } from "../escalation/estimate-escalation-governance.types";
import {
  recurringEconomicsReasonLabel,
  explainRecurringEconomicsRecommendedAction,
} from "./recurring-economics-explanations";
import type {
  EconomicRiskLevel,
  MaintenanceViability,
  MarginProtectionSignal,
  RecurringDiscountRisk,
  RecurringEconomicsGovernance,
  RecurringEconomicsRecommendedAction,
  RecurringEconomicsSourceSignals,
  ResetReviewRecommendation,
} from "./recurring-economics-governance.types";
import { RECURRING_ECONOMICS_GOVERNANCE_SCHEMA } from "./recurring-economics-governance.types";

type ConfidenceDomainKey = keyof Pick<
  EstimateConfidenceBreakdown,
  | "conditionConfidence"
  | "clutterConfidence"
  | "kitchenConfidence"
  | "bathroomConfidence"
  | "petConfidence"
  | "recencyConfidence"
  | "recurringTransitionConfidence"
  | "customerConsistencyConfidence"
  | "scopeCompletenessConfidence"
>;

const DOMAIN_BLOCK_KEYS: readonly ConfidenceDomainKey[] = [
  "conditionConfidence",
  "clutterConfidence",
  "kitchenConfidence",
  "bathroomConfidence",
  "petConfidence",
  "recencyConfidence",
  "recurringTransitionConfidence",
  "customerConsistencyConfidence",
  "scopeCompletenessConfidence",
];

export type RecurringEconomicsGovernanceInput = {
  serviceType: string;
  recurringCadenceIntent?: string | null;
  estimatedMinutes?: number | null;
  pricedMinutes?: number | null;
  estimatedPriceCents?: number | null;
  comparisonHints?: EstimateConfidenceComparisonHints | null;
  confidenceBreakdown: EstimateConfidenceBreakdown;
  escalationGovernance?: EstimateEscalationGovernance | null;
  estimatorFlags?: readonly string[];
  riskPercentUncapped?: number | null;
};

function appliesRecurringLane(input: RecurringEconomicsGovernanceInput): boolean {
  if (input.serviceType === "maintenance") return true;
  const c = input.recurringCadenceIntent;
  return c != null && c !== "none";
}

function driverSet(bd: EstimateConfidenceBreakdown): Set<string> {
  const s = new Set<string>();
  for (const k of DOMAIN_BLOCK_KEYS) {
    const block = bd[k];
    if (!block || typeof block !== "object") continue;
    for (const u of block.uncertaintyDrivers) {
      s.add(u);
    }
  }
  return s;
}

function lowCriticalDomainCount(bd: EstimateConfidenceBreakdown): number {
  let n = 0;
  for (const k of DOMAIN_BLOCK_KEYS) {
    const cls = bd[k]?.classification;
    if (cls === "low" || cls === "critical") n += 1;
  }
  return n;
}

function escalationLevelRank(level: string | null | undefined): number {
  switch (level) {
    case "hard_block":
      return 4;
    case "intervention_required":
      return 3;
    case "review":
      return 2;
    case "monitor":
      return 1;
    default:
      return 0;
  }
}

function rankToEconomicLevel(rank: number): EconomicRiskLevel {
  if (rank <= 0) return "none";
  if (rank === 1) return "low";
  if (rank === 2) return "medium";
  if (rank === 3) return "high";
  return "critical";
}

function discountRiskFromSignals(args: {
  drivers: Set<string>;
  recurringCls: string;
  scopeCls: string;
  escActions: Set<string>;
}): RecurringDiscountRisk {
  let score = 0;
  if (args.drivers.has("recurring_price_collapse_vs_prior")) score += 3;
  if (args.escActions.has("block_autonomous_discounting")) score += 2;
  if (args.escActions.has("recommend_manual_price_review")) score += 2;
  if (args.recurringCls === "low") score += 1;
  if (args.recurringCls === "critical") score += 2;
  if (args.scopeCls === "low") score += 1;
  if (args.scopeCls === "critical") score += 2;
  if (args.drivers.has("structured_intake_gaps")) score += 1;
  if (score >= 6) return "critical";
  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  if (score >= 1) return "low";
  return "none";
}

function mergeEconomicLevel(
  a: EconomicRiskLevel,
  b: EconomicRiskLevel,
): EconomicRiskLevel {
  const order: EconomicRiskLevel[] = [
    "none",
    "low",
    "medium",
    "high",
    "critical",
  ];
  return order[Math.max(order.indexOf(a), order.indexOf(b))];
}

function minuteMismatchSignal(input: RecurringEconomicsGovernanceInput): boolean {
  const est = input.estimatedMinutes;
  const priced = input.pricedMinutes;
  if (
    typeof est !== "number" ||
    !Number.isFinite(est) ||
    typeof priced !== "number" ||
    !Number.isFinite(priced) ||
    est <= 0
  ) {
    return false;
  }
  const ratio = priced / est;
  return ratio < 0.88 || ratio > 1.12;
}

function evaluateResetReview(args: {
  drivers: Set<string>;
  recurringCls: string;
  scopeCls: string;
  conditionCls: string;
  recencyCls: string;
  escActions: Set<string>;
  appliesLane: boolean;
}): ResetReviewRecommendation {
  if (!args.appliesLane) return "none";
  if (args.escActions.has("recommend_recurring_reset_review")) return "required";
  if (args.recurringCls === "critical") return "required";
  const instability =
    args.drivers.has("cadence_vs_recency_mismatch") ||
    args.drivers.has("legacy_recency_unstable_for_recurring");
  if (args.recurringCls === "low" && instability) return "required";
  if (
    args.recurringCls === "low" ||
    args.scopeCls === "critical" ||
    args.conditionCls === "critical"
  ) {
    return "suggested";
  }
  const recencyWeak =
    args.recencyCls === "low" ||
    args.recencyCls === "critical" ||
    args.drivers.has("structured_recency_stale_or_unknown") ||
    args.drivers.has("recency_unknown_dual_channel");
  if (recencyWeak && (instability || args.recurringCls === "medium")) {
    return "suggested";
  }
  return "none";
}

function resetReviewMaintenanceTier(
  reset: ResetReviewRecommendation,
  recurringWeak: boolean,
): boolean {
  return reset === "required" || (reset === "suggested" && recurringWeak);
}

function evaluateMaintenanceViability(args: {
  appliesLane: boolean;
  drivers: Set<string>;
  recurringCls: string;
  scopeCls: string;
  petCls: string;
  clutterCls: string;
  conditionCls: string;
  reset: ResetReviewRecommendation;
}): MaintenanceViability {
  if (!args.appliesLane) return "not_applicable";

  if (args.reset === "required") return "reset_review_needed";

  const petAmb =
    args.petCls === "low" ||
    args.petCls === "critical" ||
    args.drivers.has("pet_presence_unknown") ||
    args.drivers.has("pet_impact_vs_presence_conflict") ||
    args.drivers.has("pet_shedding_missing") ||
    args.drivers.has("pet_accidents_ambiguous");

  const clutterUnc =
    args.clutterCls === "low" ||
    args.clutterCls === "critical" ||
    args.drivers.has("clutter_access_vs_band_conflict") ||
    args.drivers.has("occupancy_vs_clutter_band_conflict");

  const condUnc =
    args.conditionCls === "low" ||
    args.conditionCls === "critical" ||
    args.drivers.has("condition_cross_signal_conflict");

  const recencyStress =
    args.drivers.has("structured_recency_stale_or_unknown") ||
    args.drivers.has("recency_unknown_dual_channel") ||
    args.drivers.has("recency_cross_channel_conflict");

  const cadenceStress =
    args.drivers.has("cadence_vs_recency_mismatch") ||
    args.drivers.has("legacy_recency_unstable_for_recurring");

  const recurringWeak =
    args.recurringCls === "low" || args.recurringCls === "critical";

  if (cadenceStress || (recurringWeak && recencyStress)) return "unstable";
  if (
    args.scopeCls === "critical" ||
    (recurringWeak && args.scopeCls === "low")
  ) {
    return "unstable";
  }
  if (resetReviewMaintenanceTier(args.reset, recurringWeak)) {
    return "reset_review_needed";
  }
  if (petAmb || clutterUnc || condUnc || recencyStress || recurringWeak) {
    return "watch";
  }
  return "stable";
}

function marginProtectionSignal(args: {
  discount: RecurringDiscountRisk;
  escalation: EstimateEscalationGovernance | null | undefined;
  drivers: Set<string>;
  riskUncapped: number | null | undefined;
  aggregateCls: string;
}): MarginProtectionSignal {
  const sev = args.escalation?.severityScore;
  const discountIdx = ["none", "low", "medium", "high", "critical"].indexOf(
    args.discount,
  );
  const collapse = args.drivers.has("recurring_price_collapse_vs_prior");
  const sparse = args.drivers.has("structured_intake_gaps");

  if (args.discount === "critical" || (args.discount === "high" && (sev ?? 0) >= 72)) {
    return "protect";
  }
  if (
    collapse &&
    sparse &&
    (args.aggregateCls === "low" || args.aggregateCls === "critical")
  ) {
    return "review";
  }
  if (
    discountIdx >= 3 ||
    (discountIdx >= 2 && ((sev ?? 0) >= 58 || (args.riskUncapped ?? 0) >= 35))
  ) {
    return "review";
  }
  if (
    discountIdx >= 2 ||
    (sev ?? 0) >= 48 ||
    (args.riskUncapped ?? 0) >= 35 ||
    (collapse && sparse)
  ) {
    return "monitor";
  }
  return "none";
}

function riskScore(args: {
  escalationRank: number;
  discount: RecurringDiscountRisk;
  maintenance: MaintenanceViability;
  reset: ResetReviewRecommendation;
  margin: MarginProtectionSignal;
  lowCritDomains: number;
  riskUncapped: number | null | undefined;
  appliesLane: boolean;
}): number {
  let s = 0;
  s += args.escalationRank * 14;
  s += ["none", "low", "medium", "high", "critical"].indexOf(args.discount) * 13;
  if (args.appliesLane) {
    if (args.maintenance === "watch") s += 8;
    if (args.maintenance === "unstable") s += 16;
    if (args.maintenance === "reset_review_needed") s += 22;
  }
  if (args.reset === "suggested") s += 10;
  if (args.reset === "required") s += 18;
  if (args.margin === "monitor") s += 6;
  if (args.margin === "review") s += 12;
  if (args.margin === "protect") s += 18;
  s += Math.min(18, args.lowCritDomains * 5);
  const ru = args.riskUncapped ?? 0;
  if (ru >= 35) s += 12;
  else if (ru >= 26) s += 6;
  return Math.min(100, Math.round(s));
}

function sortedUnique(actions: RecurringEconomicsRecommendedAction[]) {
  return [...new Set(actions)].sort((a, b) => a.localeCompare(b));
}

/**
 * Deterministic recurring economics governance from estimate-derived signals.
 */
export function evaluateRecurringEconomicsGovernance(
  input: RecurringEconomicsGovernanceInput,
): RecurringEconomicsGovernance {
  const bd = input.confidenceBreakdown;
  const drivers = driverSet(bd);
  const esc = input.escalationGovernance ?? null;
  const escActions = new Set(esc?.recommendedActions ?? []);
  const escalationLevel = esc?.escalationLevel ?? null;
  const applies = appliesRecurringLane(input);

  const recurringCls = bd.recurringTransitionConfidence.classification;
  const scopeCls = bd.scopeCompletenessConfidence.classification;
  const petCls = bd.petConfidence.classification;
  const clutterCls = bd.clutterConfidence.classification;
  const conditionCls = bd.conditionConfidence.classification;
  const recencyCls = bd.recencyConfidence.classification;

  const sourceSignals: RecurringEconomicsSourceSignals = {
    appliesRecurringLane: applies,
    serviceType: input.serviceType,
    recurringCadenceIntent: input.recurringCadenceIntent ?? null,
    hasPriceCollapseDriver: drivers.has("recurring_price_collapse_vs_prior"),
    hasSparseIntakeDriver: drivers.has("structured_intake_gaps"),
    recurringTransitionClassification: recurringCls,
    scopeCompletenessClassification: scopeCls,
    escalationLevel,
    escalationSeverityScore:
      typeof esc?.severityScore === "number" && Number.isFinite(esc.severityScore)
        ? esc.severityScore
        : null,
    lowOrCriticalDomainCount: lowCriticalDomainCount(bd),
    hasCadenceRecencyMismatch: drivers.has("cadence_vs_recency_mismatch"),
    hasLegacyRecencyInstability: drivers.has(
      "legacy_recency_unstable_for_recurring",
    ),
  };

  if (!applies) {
    const adminSummary = [
      recurringEconomicsReasonLabel("recurring_lane_not_applicable"),
    ].sort((a, b) => a.localeCompare(b));
    const g: RecurringEconomicsGovernance = {
      schemaVersion: RECURRING_ECONOMICS_GOVERNANCE_SCHEMA,
      economicRiskLevel: "none",
      maintenanceViability: "not_applicable",
      recurringDiscountRisk: "none",
      resetReviewRecommendation: "none",
      marginProtectionSignal: "none",
      riskScore: 0,
      economicReasons: sortedCodes(["recurring_lane_not_applicable"]),
      maintenanceReasons: [],
      recommendedActions: sortedUnique(["no_action"]),
      affectedSignals: [],
      adminSummary,
      customerSafeSummary: [
        "This estimate was not evaluated as a recurring maintenance lane.",
      ],
      sourceSignals,
    };
    return finalizeGovernance(g);
  }

  const recurringDiscountRisk = discountRiskFromSignals({
    drivers,
    recurringCls,
    scopeCls,
    escActions,
  });

  const escalationEconomicFloor = rankToEconomicLevel(
    escalationLevelRank(escalationLevel),
  );
  let economicRiskLevel = mergeEconomicLevel(
    escalationEconomicFloor,
    rankToEconomicLevel(
      ["none", "low", "medium", "high", "critical"].indexOf(recurringDiscountRisk),
    ),
  );

  if (escalationLevel === "hard_block") {
    economicRiskLevel = mergeEconomicLevel(economicRiskLevel, "critical");
  }

  const resetReviewRecommendation = evaluateResetReview({
    drivers,
    recurringCls,
    scopeCls,
    conditionCls,
    recencyCls,
    escActions,
    appliesLane: applies,
  });

  const maintenanceViability = evaluateMaintenanceViability({
    appliesLane: applies,
    drivers,
    recurringCls,
    scopeCls,
    petCls,
    clutterCls,
    conditionCls,
    reset: resetReviewRecommendation,
  });

  const marginProtectionSignalOut = marginProtectionSignal({
    discount: recurringDiscountRisk,
    escalation: esc,
    drivers,
    riskUncapped: input.riskPercentUncapped,
    aggregateCls: bd.confidenceClassification,
  });

  const rs = riskScore({
    escalationRank: escalationLevelRank(escalationLevel),
    discount: recurringDiscountRisk,
    maintenance: maintenanceViability,
    reset: resetReviewRecommendation,
    margin: marginProtectionSignalOut,
    lowCritDomains: lowCriticalDomainCount(bd),
    riskUncapped: input.riskPercentUncapped,
    appliesLane: applies,
  });

  const recommendedActions = deriveRecommendedActions({
    recurringDiscountRisk,
    maintenanceViability,
    resetReviewRecommendation,
    marginProtectionSignal: marginProtectionSignalOut,
    escalationLevel,
    escActions,
    minuteMismatch: minuteMismatchSignal(input),
    drivers,
  });

  const economicReasons = deriveEconomicReasons({
    escalationLevel,
    recurringDiscountRisk,
    drivers,
    escActions,
    riskUncapped: input.riskPercentUncapped,
  });

  const maintenanceReasons = deriveMaintenanceReasons({
    maintenanceViability,
    drivers,
    recurringCls,
    petCls,
    clutterCls,
    conditionCls,
  });

  const affectedSignals = sortedCodes([
    ...drivers,
    ...(escalationLevel ? [`escalation:${escalationLevel}`] : []),
    ...(esc?.recommendedActions.map((a) => `esc_action:${a}`) ?? []),
  ]);

  const adminSummary = buildAdminSummaryLines({
    economicRiskLevel,
    maintenanceViability,
    recurringDiscountRisk,
    resetReviewRecommendation,
    marginProtectionSignal: marginProtectionSignalOut,
    recommendedActions,
  });

  const customerSafeSummary = buildCustomerSafeSummary({
    maintenanceViability,
    resetReviewRecommendation,
    recurringDiscountRisk,
  });

  const g: RecurringEconomicsGovernance = {
    schemaVersion: RECURRING_ECONOMICS_GOVERNANCE_SCHEMA,
    economicRiskLevel,
    maintenanceViability,
    recurringDiscountRisk,
    resetReviewRecommendation,
    marginProtectionSignal: marginProtectionSignalOut,
    riskScore: rs,
    economicReasons,
    maintenanceReasons,
    recommendedActions,
    affectedSignals,
    adminSummary,
    customerSafeSummary,
    sourceSignals,
  };

  return finalizeGovernance(g);
}

function sortedCodes(codes: string[]): string[] {
  return [...new Set(codes)].sort((a, b) => a.localeCompare(b));
}

function finalizeGovernance(g: RecurringEconomicsGovernance): RecurringEconomicsGovernance {
  return {
    ...g,
    economicReasons: sortedCodes(g.economicReasons),
    maintenanceReasons: sortedCodes(g.maintenanceReasons),
    affectedSignals: sortedCodes(g.affectedSignals),
    adminSummary: [...new Set(g.adminSummary)].sort((a, b) => a.localeCompare(b)),
    customerSafeSummary: [...new Set(g.customerSafeSummary)].sort((a, b) =>
      a.localeCompare(b),
    ),
    recommendedActions: sortedUnique(g.recommendedActions),
  };
}

function deriveRecommendedActions(args: {
  drivers: Set<string>;
  recurringDiscountRisk: RecurringDiscountRisk;
  maintenanceViability: MaintenanceViability;
  resetReviewRecommendation: ResetReviewRecommendation;
  marginProtectionSignal: MarginProtectionSignal;
  escalationLevel: string | null;
  escActions: Set<string>;
  minuteMismatch: boolean;
}): RecurringEconomicsRecommendedAction[] {
  const out: RecurringEconomicsRecommendedAction[] = [];
  const push = (...xs: RecurringEconomicsRecommendedAction[]) => {
    out.push(...xs);
  };

  if (
    args.maintenanceViability === "stable" &&
    args.recurringDiscountRisk === "none" &&
    args.resetReviewRecommendation === "none" &&
    args.marginProtectionSignal === "none" &&
    escalationLevelRank(args.escalationLevel) === 0
  ) {
    push("no_action");
    return out;
  }

  if (
    args.maintenanceViability === "watch" ||
    args.maintenanceViability === "unstable"
  ) {
    push("monitor_recurring_account");
  }

  if (["medium", "high", "critical"].includes(args.recurringDiscountRisk)) {
    push("review_recurring_discount");
  }

  if (args.minuteMismatch) {
    push("review_estimated_minutes");
  }

  if (
    args.resetReviewRecommendation === "suggested" ||
    args.resetReviewRecommendation === "required"
  ) {
    push("review_reset_requirement");
  }

  if (
    args.escActions.has("recommend_manual_price_review") ||
    args.recurringDiscountRisk === "high" ||
    args.recurringDiscountRisk === "critical"
  ) {
    push("flag_for_manual_pricing_review");
  }

  if (
    args.drivers.has("condition_cross_signal_conflict") ||
    args.maintenanceViability === "unstable"
  ) {
    push("flag_for_fo_feedback");
  }

  if (
    args.drivers.has("kitchen_intensity_missing") ||
    args.drivers.has("structured_intake_gaps")
  ) {
    push("collect_more_condition_evidence");
  }

  if (
    args.marginProtectionSignal === "review" ||
    args.marginProtectionSignal === "protect"
  ) {
    push("protect_margin_before_discounting");
  }

  if (
    args.escActions.has("block_autonomous_discounting") ||
    args.marginProtectionSignal === "protect" ||
    args.recurringDiscountRisk === "critical"
  ) {
    push("do_not_autonomously_reduce_price");
  }

  if (out.length === 0) push("no_action");
  return sortedUnique(out);
}

function deriveEconomicReasons(args: {
  escalationLevel: string | null;
  recurringDiscountRisk: RecurringDiscountRisk;
  drivers: Set<string>;
  escActions: Set<string>;
  riskUncapped: number | null | undefined;
}): string[] {
  const codes: string[] = [];
  if (args.escalationLevel === "hard_block") codes.push("escalation_hard_block");
  if (args.escalationLevel === "intervention_required") {
    codes.push("escalation_intervention");
  }
  if (args.drivers.has("recurring_price_collapse_vs_prior")) {
    codes.push("recurring_price_collapse_signal");
  }
  if (args.drivers.has("structured_intake_gaps")) {
    codes.push("sparse_structured_intake");
  }
  if (args.escActions.has("recommend_manual_price_review")) {
    codes.push("manual_price_review_escalation");
  }
  if (args.escActions.has("block_autonomous_discounting")) {
    codes.push("block_autonomous_discounting_escalation");
  }
  if ((args.riskUncapped ?? 0) >= 35) {
    codes.push("elevated_uncapped_risk");
  }
  if (
    ["medium", "high", "critical"].includes(args.recurringDiscountRisk) &&
    codes.length === 0
  ) {
    codes.push("recurring_discount_pressure");
  }
  return codes;
}

function deriveMaintenanceReasons(args: {
  maintenanceViability: MaintenanceViability;
  drivers: Set<string>;
  recurringCls: string;
  petCls: string;
  clutterCls: string;
  conditionCls: string;
}): string[] {
  const codes: string[] = [];
  switch (args.maintenanceViability) {
    case "stable":
      codes.push("maintenance_lane_stable");
      break;
    case "watch":
      codes.push("maintenance_lane_watch");
      break;
    case "unstable":
      codes.push("maintenance_lane_unstable");
      break;
    case "reset_review_needed":
      codes.push("maintenance_reset_alignment");
      break;
    default:
      break;
  }
  if (
    args.petCls === "low" ||
    args.petCls === "critical" ||
    args.drivers.has("pet_presence_unknown")
  ) {
    codes.push("pet_signal_ambiguity");
  }
  if (
    args.clutterCls === "low" ||
    args.clutterCls === "critical" ||
    args.drivers.has("clutter_access_vs_band_conflict")
  ) {
    codes.push("clutter_signal_uncertainty");
  }
  if (
    args.conditionCls === "low" ||
    args.conditionCls === "critical" ||
    args.drivers.has("condition_cross_signal_conflict")
  ) {
    codes.push("condition_signal_uncertainty");
  }
  if (args.drivers.has("cadence_vs_recency_mismatch")) {
    codes.push("cadence_recency_mismatch");
  }
  if (args.drivers.has("legacy_recency_unstable_for_recurring")) {
    codes.push("legacy_recency_instability");
  }
  if (args.recurringCls === "low" || args.recurringCls === "critical") {
    codes.push("recurring_transition_weak");
  }
  return codes;
}

function buildAdminSummaryLines(args: {
  economicRiskLevel: EconomicRiskLevel;
  maintenanceViability: MaintenanceViability;
  recurringDiscountRisk: RecurringDiscountRisk;
  resetReviewRecommendation: ResetReviewRecommendation;
  marginProtectionSignal: MarginProtectionSignal;
  recommendedActions: RecurringEconomicsRecommendedAction[];
}): string[] {
  const lines: string[] = [];
  lines.push(
    `Economic risk: ${args.economicRiskLevel}; maintenance: ${args.maintenanceViability}; discount risk: ${args.recurringDiscountRisk}.`,
  );
  lines.push(
    `Reset review: ${args.resetReviewRecommendation}; margin signal: ${args.marginProtectionSignal}.`,
  );
  for (const a of args.recommendedActions) {
    lines.push(explainRecurringEconomicsRecommendedAction(a));
  }
  return lines;
}

function buildCustomerSafeSummary(args: {
  maintenanceViability: MaintenanceViability;
  resetReviewRecommendation: ResetReviewRecommendation;
  recurringDiscountRisk: RecurringDiscountRisk;
}): string[] {
  const lines: string[] = [];
  if (args.resetReviewRecommendation !== "none") {
    lines.push(
      "Maintenance cadence and baseline timing may benefit from an operator review.",
    );
  }
  if (
    args.recurringDiscountRisk === "high" ||
    args.recurringDiscountRisk === "critical"
  ) {
    lines.push("Pricing compared with prior estimates may need careful review.");
  }
  if (
    args.maintenanceViability === "unstable" ||
    args.maintenanceViability === "reset_review_needed"
  ) {
    lines.push(
      "Ongoing maintenance viability signals suggest elevated follow-up attention.",
    );
  }
  if (lines.length === 0) {
    lines.push("No recurring economics advisories at this time.");
  }
  return lines;
}
