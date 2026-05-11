import type { EstimateInput } from "../../modules/estimate/estimator.service";
import type {
  ConfidenceClassification,
  ConfidenceDomainSignals,
  EstimateConfidenceBreakdown,
  EstimateConfidenceComparisonHints,
} from "./estimate-confidence-breakdown.types";
import { classifyDomainScore, classifyOverallConfidence } from "./estimate-confidence-explanations";

export type AnalyzeEstimateConfidenceParams = {
  input: EstimateInput;
  /** Locked aggregate from EstimatorService.computeConfidence — echoed verbatim on breakdown.overallConfidence */
  aggregateConfidence: number;
  comparisonHints?: EstimateConfidenceComparisonHints;
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function uniqSorted(xs: string[]): string[] {
  return [...new Set(xs)].sort((a, b) => a.localeCompare(b));
}

type DomainDraft = {
  score: number;
  reasoning: string[];
  evidence: string[];
  drivers: string[];
};

function finalizeDomain(d: DomainDraft): ConfidenceDomainSignals {
  const score = round2(clamp01(d.score));
  return {
    score,
    classification: classifyDomainScore(score),
    reasoning: uniqSorted(d.reasoning),
    evidenceSignals: uniqSorted(d.evidence),
    uncertaintyDrivers: uniqSorted(d.drivers),
  };
}

function recencyTierLegacy(
  v: EstimateInput["last_professional_clean"] | undefined,
): "recent" | "mid" | "old" | "unknown" {
  if (v === undefined) return "unknown";
  if (v === "not_sure") return "unknown";
  if (v === "under_2_weeks" || v === "2_4_weeks") return "recent";
  if (v === "1_3_months") return "mid";
  return "old";
}

function recencyTierStructured(
  v: EstimateInput["last_pro_clean_recency"] | undefined,
): "recent" | "mid" | "old" | "unknown" {
  if (v === undefined) return "unknown";
  if (v === "within_30_days") return "recent";
  if (v === "days_30_90") return "mid";
  return "old";
}

function analyzeCondition(input: EstimateInput): ConfidenceDomainSignals {
  const d: DomainDraft = {
    score: 1,
    reasoning: [],
    evidence: [],
    drivers: [],
  };

  const svc = input.service_type;

  if (input.dust_level === undefined || input.dust_level === "not_sure") {
    d.score -= 0.07;
    d.reasoning.push("Dust level is unspecified or marked unsure.");
    d.drivers.push("dust_level_ambiguous");
    d.evidence.push(`dust_level=${input.dust_level ?? "undefined"}`);
  }

  if ((svc === "maintenance" || svc === "deep_clean") && input.overall_labor_condition === undefined) {
    d.score -= 0.08;
    d.reasoning.push("Whole-home labor condition narrative is missing for this service type.");
    d.drivers.push("overall_labor_condition_missing");
    d.evidence.push(`service_type=${svc}`);
  }

  if (
    input.overall_labor_condition === "recently_maintained" &&
    (input.kitchen_condition === "heavy_grease" || input.bathroom_condition === "heavy_scale")
  ) {
    d.score -= 0.12;
    d.reasoning.push(
      "Condition signals conflict: home described as recently maintained while kitchen/bathroom read heavy.",
    );
    d.drivers.push("condition_cross_signal_conflict");
    d.evidence.push(
      `overall_labor_condition=${input.overall_labor_condition}`,
      `kitchen_condition=${input.kitchen_condition}`,
      `bathroom_condition=${input.bathroom_condition}`,
    );
  }

  if (
    input.overall_labor_condition === "major_reset" &&
    (input.kitchen_condition === "light" || input.kitchen_condition === "normal") &&
    (input.bathroom_condition === "light" || input.bathroom_condition === "normal")
  ) {
    d.score -= 0.09;
    d.reasoning.push(
      "Major reset narrative contrasts with light/normal kitchen and bathroom condition selections.",
    );
    d.drivers.push("condition_narrative_mismatch");
    d.evidence.push(
      `overall_labor_condition=${input.overall_labor_condition}`,
      `kitchen_condition=${input.kitchen_condition}`,
      `bathroom_condition=${input.bathroom_condition}`,
    );
  }

  return finalizeDomain(d);
}

function analyzeClutter(input: EstimateInput): ConfidenceDomainSignals {
  const d: DomainDraft = {
    score: 1,
    reasoning: [],
    evidence: [],
    drivers: [],
  };

  if (input.clutter_level === "not_sure") {
    d.score -= 0.22;
    d.reasoning.push("Clutter level is unknown.");
    d.drivers.push("clutter_band_unknown");
    d.evidence.push("clutter_level=not_sure");
  }

  const heavyAccess =
    input.clutter_access === "heavy_clutter" || input.floor_visibility === "lots_of_items";
  const lightClutterBand =
    input.clutter_level === "minimal" || input.clutter_level === "light";

  if (heavyAccess && lightClutterBand) {
    d.score -= 0.13;
    d.reasoning.push("Access/clutter pathways indicate heavy obstacles while clutter band reads light.");
    d.drivers.push("clutter_access_vs_band_conflict");
    d.evidence.push(
      `clutter_level=${input.clutter_level}`,
      `clutter_access=${input.clutter_access ?? "undefined"}`,
      `floor_visibility=${input.floor_visibility ?? "undefined"}`,
    );
  }

  if (input.occupancy_state === "occupied_cluttered" && lightClutterBand) {
    d.score -= 0.1;
    d.reasoning.push("Occupancy indicates cluttered living while clutter band reads minimal/light.");
    d.drivers.push("occupancy_vs_clutter_band_conflict");
    d.evidence.push(
      `occupancy_state=${input.occupancy_state}`,
      `clutter_level=${input.clutter_level}`,
    );
  }

  return finalizeDomain(d);
}

function analyzeKitchen(input: EstimateInput): ConfidenceDomainSignals {
  const d: DomainDraft = {
    score: 1,
    reasoning: [],
    evidence: [],
    drivers: [],
  };

  if (input.kitchen_condition === "not_sure") {
    d.score -= 0.2;
    d.reasoning.push("Kitchen details were incomplete (condition unsure).");
    d.drivers.push("kitchen_condition_unknown");
    d.evidence.push("kitchen_condition=not_sure");
  }

  const svcNeedsKitchenIntensity =
    input.service_type === "maintenance" ||
    input.service_type === "deep_clean" ||
    input.service_type === "move_in" ||
    input.service_type === "move_out";

  if (svcNeedsKitchenIntensity && input.kitchen_intensity === undefined) {
    d.score -= 0.11;
    d.reasoning.push("Kitchen intensity answers were not captured for this service.");
    d.drivers.push("kitchen_intensity_missing");
    d.evidence.push(`service_type=${input.service_type}`);
  }

  if (input.kitchen_condition === "heavy_grease" && (input.stovetop_type === undefined || input.stovetop_type === "not_sure")) {
    d.score -= 0.09;
    d.reasoning.push("Heavy grease kitchen selected without a definite stovetop type.");
    d.drivers.push("stovetop_unknown_under_heavy_kitchen");
    d.evidence.push(
      `kitchen_condition=${input.kitchen_condition}`,
      `stovetop_type=${input.stovetop_type ?? "undefined"}`,
    );
  }

  return finalizeDomain(d);
}

function analyzeBathroom(input: EstimateInput): ConfidenceDomainSignals {
  const d: DomainDraft = {
    score: 1,
    reasoning: [],
    evidence: [],
    drivers: [],
  };

  if (input.bathroom_condition === "not_sure") {
    d.score -= 0.2;
    d.reasoning.push("Bathroom condition is unsure.");
    d.drivers.push("bathroom_condition_unknown");
    d.evidence.push("bathroom_condition=not_sure");
  }

  const glassAmbiguous =
    input.glass_showers === "not_sure" ||
    (input.glass_showers === undefined &&
      (input.bathroom_condition === "heavy_scale" ||
        input.bathroom_complexity === "heavy_detailing"));

  if (glassAmbiguous) {
    d.score -= input.glass_showers === "not_sure" ? 0.07 : 0.09;
    d.reasoning.push("Glass shower scope is not pinned where bathroom workload is elevated.");
    d.drivers.push("glass_showers_ambiguous");
    d.evidence.push(
      `glass_showers=${input.glass_showers ?? "undefined"}`,
      `bathroom_complexity=${input.bathroom_complexity ?? "undefined"}`,
    );
  }

  return finalizeDomain(d);
}

function analyzePet(input: EstimateInput): ConfidenceDomainSignals {
  const d: DomainDraft = {
    score: 1,
    reasoning: [],
    evidence: [],
    drivers: [],
  };

  if (input.pet_presence === "not_sure") {
    d.score -= 0.22;
    d.reasoning.push("Pet presence is unknown.");
    d.drivers.push("pet_presence_unknown");
    d.evidence.push("pet_presence=not_sure");
  }

  const petsLikely = input.pet_presence === "one" || input.pet_presence === "multiple";

  if (petsLikely && input.pet_shedding === undefined) {
    d.score -= 0.14;
    d.reasoning.push("Pet shedding intensity missing while pets are present.");
    d.drivers.push("pet_shedding_missing");
    d.evidence.push(`pet_presence=${input.pet_presence}`);
  }

  if (
    (input.pet_impact === "heavy" || input.pet_impact === "light") &&
    input.pet_presence === "none"
  ) {
    d.score -= 0.18;
    d.reasoning.push("Pet impact is nonzero while pet presence is none.");
    d.drivers.push("pet_impact_vs_presence_conflict");
    d.evidence.push(`pet_impact=${input.pet_impact}`, "pet_presence=none");
  }

  if (petsLikely && input.pet_accidents_or_litter_areas === "not_sure") {
    d.score -= 0.09;
    d.reasoning.push("Pet accident/litter signal left unsure despite pets in home.");
    d.drivers.push("pet_accidents_ambiguous");
    d.evidence.push(`pet_presence=${input.pet_presence}`);
  }

  return finalizeDomain(d);
}

function analyzeRecency(input: EstimateInput): ConfidenceDomainSignals {
  const d: DomainDraft = {
    score: 1,
    reasoning: [],
    evidence: [],
    drivers: [],
  };

  const L = recencyTierLegacy(input.last_professional_clean);
  const S = recencyTierStructured(input.last_pro_clean_recency);

  if (input.last_professional_clean === "not_sure" && input.last_pro_clean_recency === undefined) {
    d.score -= 0.18;
    d.reasoning.push("Professional clean recency is ambiguous across legacy and structured fields.");
    d.drivers.push("recency_unknown_dual_channel");
    d.evidence.push("last_professional_clean=not_sure", "last_pro_clean_recency=undefined");
  } else if (input.last_pro_clean_recency === "unknown_or_not_recently") {
    d.score -= 0.12;
    d.reasoning.push("Structured recency indicates unknown or not-recent professional baseline.");
    d.drivers.push("structured_recency_stale_or_unknown");
    d.evidence.push("last_pro_clean_recency=unknown_or_not_recently");
  }

  if (
    L !== "unknown" &&
    S !== "unknown" &&
    L !== S &&
    input.last_professional_clean !== undefined &&
    input.last_pro_clean_recency !== undefined
  ) {
    d.score -= 0.14;
    d.reasoning.push("Legacy last-clean cadence disagrees with structured recency answers.");
    d.drivers.push("recency_cross_channel_conflict");
    d.evidence.push(
      `legacy_tier=${L}`,
      `structured_tier=${S}`,
      `last_professional_clean=${input.last_professional_clean}`,
      `last_pro_clean_recency=${input.last_pro_clean_recency}`,
    );
  }

  return finalizeDomain(d);
}

function analyzeRecurringTransition(
  input: EstimateInput,
  hints?: EstimateConfidenceComparisonHints,
): ConfidenceDomainSignals {
  const d: DomainDraft = {
    score: 1,
    reasoning: [],
    evidence: [],
    drivers: [],
  };

  if (input.service_type === "maintenance") {
    if (
      input.recurring_cadence_intent === "weekly" &&
      (input.last_pro_clean_recency === "days_90_plus" ||
        input.last_pro_clean_recency === "unknown_or_not_recently")
    ) {
      d.score -= 0.15;
      d.reasoning.push(
        "Weekly recurring intent conflicts with a long or unknown gap since the last professional clean.",
      );
      d.drivers.push("cadence_vs_recency_mismatch");
      d.evidence.push(
        `recurring_cadence_intent=${input.recurring_cadence_intent}`,
        `last_pro_clean_recency=${input.last_pro_clean_recency}`,
      );
    }

    if (
      input.first_time_with_servelink === "no" &&
      (input.last_professional_clean === "6_plus_months" || input.last_professional_clean === "not_sure")
    ) {
      d.score -= 0.11;
      d.reasoning.push("Returning customer path shows stale or unsure legacy professional-clean horizon.");
      d.drivers.push("legacy_recency_unstable_for_recurring");
      d.evidence.push(
        `first_time_with_servelink=${input.first_time_with_servelink}`,
        `last_professional_clean=${input.last_professional_clean}`,
      );
    }
  }

  const prior = hints?.priorEstimatedPriceCents;
  const cur = hints?.currentEstimatedPriceCents;
  if (
    typeof prior === "number" &&
    typeof cur === "number" &&
    prior > 0 &&
    cur > 0 &&
    cur / prior < 0.65
  ) {
    d.score -= 0.22;
    d.reasoning.push(
      "Large recurring price drop versus prior estimate — transition stability confidence reduced.",
    );
    d.drivers.push("recurring_price_collapse_vs_prior");
    d.evidence.push(`priorEstimatedPriceCents=${prior}`, `currentEstimatedPriceCents=${cur}`);
  }

  return finalizeDomain(d);
}

function analyzeCustomerConsistency(input: EstimateInput): ConfidenceDomainSignals {
  const d: DomainDraft = {
    score: 1,
    reasoning: [],
    evidence: [],
    drivers: [],
  };

  if (input.first_time_with_servelink === "not_sure") {
    d.score -= 0.12;
    d.reasoning.push("First-time-with-platform signal is unsure.");
    d.drivers.push("first_time_unknown");
    d.evidence.push("first_time_with_servelink=not_sure");
  }

  if (input.occupancy_state === "occupied_cluttered") {
    const lightClutter =
      input.clutter_level === "minimal" ||
      input.clutter_level === "light" ||
      input.clutter_access === "mostly_clear";
    if (lightClutter) {
      d.score -= 0.11;
      d.reasoning.push("Occupancy reads cluttered while access/clutter selections read mostly clear/light.");
      d.drivers.push("occupancy_vs_access_conflict");
      d.evidence.push(
        `occupancy_state=${input.occupancy_state}`,
        `clutter_level=${input.clutter_level}`,
        `clutter_access=${input.clutter_access ?? "undefined"}`,
      );
    }
  }

  return finalizeDomain(d);
}

function analyzeScopeCompleteness(input: EstimateInput): ConfidenceDomainSignals {
  const d: DomainDraft = {
    score: 1,
    reasoning: [],
    evidence: [],
    drivers: [],
  };

  type Key = keyof EstimateInput;
  const maintenanceKeys: Key[] = [
    "overall_labor_condition",
    "kitchen_intensity",
    "bathroom_complexity",
    "clutter_access",
    "primary_cleaning_intent",
    "last_pro_clean_recency",
    "recurring_cadence_intent",
    "layout_type",
  ];

  const deepKeys: Key[] = [
    "overall_labor_condition",
    "kitchen_intensity",
    "bathroom_complexity",
    "clutter_access",
    "primary_cleaning_intent",
    "last_pro_clean_recency",
    "layout_type",
    "first_time_visit_program",
  ];

  const moveKeys: Key[] = [
    "overall_labor_condition",
    "kitchen_intensity",
    "clutter_access",
    "occupancy_level",
    "layout_type",
  ];

  let expected: Key[] = maintenanceKeys;
  if (input.service_type === "deep_clean") expected = deepKeys;
  else if (input.service_type === "move_in" || input.service_type === "move_out") expected = moveKeys;

  let missing = 0;
  const missingLabels: string[] = [];
  for (const key of expected) {
    if (input[key] === undefined || input[key] === null) {
      missing += 1;
      missingLabels.push(String(key));
    }
  }

  if (missing > 0) {
    const penalty = Math.min(0.48, missing * 0.065);
    d.score -= penalty;
    d.reasoning.push(
      `Questionnaire coverage is sparse (${missing} recommended structured fields missing).`,
    );
    d.drivers.push("structured_intake_gaps");
    d.evidence.push(`missing_fields=${missingLabels.sort((a, b) => a.localeCompare(b)).join(",")}`);
  }

  return finalizeDomain(d);
}

/**
 * Deterministic, pure decomposition of estimator-facing intake into explainable confidence domains.
 * Does not modify pricing, aggregate confidence math, or persistence.
 */
export function analyzeEstimateConfidence(
  params: AnalyzeEstimateConfidenceParams,
): EstimateConfidenceBreakdown {
  const { input, aggregateConfidence, comparisonHints } = params;

  const overallConfidence = round2(clamp01(aggregateConfidence));
  const confidenceClassification: ConfidenceClassification =
    classifyOverallConfidence(overallConfidence);

  return {
    schemaVersion: "estimate_confidence_breakdown_v1",
    overallConfidence,
    confidenceClassification,
    conditionConfidence: analyzeCondition(input),
    clutterConfidence: analyzeClutter(input),
    kitchenConfidence: analyzeKitchen(input),
    bathroomConfidence: analyzeBathroom(input),
    petConfidence: analyzePet(input),
    recencyConfidence: analyzeRecency(input),
    recurringTransitionConfidence: analyzeRecurringTransition(input, comparisonHints),
    customerConsistencyConfidence: analyzeCustomerConsistency(input),
    scopeCompletenessConfidence: analyzeScopeCompleteness(input),
  };
}
