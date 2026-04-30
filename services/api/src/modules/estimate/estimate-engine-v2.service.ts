import { Injectable } from "@nestjs/common";
import { CLEANING_PRICING_POLICY_V1 } from "../pricing/pricing-policy";
import type { EstimateInput } from "./estimator.service";
import type {
  EstimateReconciliationClassification,
  EstimateRiskLevel,
  EstimateV2Output,
  EstimateV2Reconciliation,
} from "./estimate-engine-v2.types";

const SNAPSHOT_VERSION = "estimate_engine_v2_core_v1" as const;
const EXPLANATION =
  "This estimate is based on home size, room count, service type, condition, access/clutter, kitchen intensity, pets, and recency. A risk-adjusted service window is used to reduce on-site price changes.";

function roundUpToFive(value: number): number {
  return Math.max(0, Math.ceil(value / 5) * 5);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function finiteNonNegativeNumber(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function finiteNonNegativeInteger(value: number): number {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

function stringField(input: Record<string, unknown>, key: string): string | null {
  const value = input[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberFromBedrooms(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  if (value === "5_plus") return 5;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

function numberFromBathrooms(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  if (value === "4_plus") return 4;
  const n = Number(value.replace("_", "."));
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

function squareFootageFromBand(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const map: Record<string, number> = {
    "0_799": 600,
    "800_1199": 1000,
    "1200_1599": 1400,
    "1600_1999": 1800,
    "2000_2499": 2250,
    "2500_2999": 2750,
    "3000_3499": 3250,
    "3500_plus": 4000,
  };
  return map[value] ?? null;
}

function squareFootageMaxFromBand(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const map: Record<string, number> = {
    "0_799": 799,
    "800_1199": 1199,
    "1200_1599": 1599,
    "1600_1999": 1999,
    "2000_2499": 2499,
    "2500_2999": 2999,
    "3000_3499": 3499,
    // Open-ended band uses the current estimator's existing 4000 sqft convention.
    "3500_plus": 4000,
  };
  return map[value] ?? null;
}

type SupportedServiceType = "maintenance" | "deep_clean" | "move_in" | "move_out";

function supportedServiceType(value: string | null): SupportedServiceType | null {
  if (
    value === "maintenance" ||
    value === "deep_clean" ||
    value === "move_in" ||
    value === "move_out"
  ) {
    return value;
  }
  return null;
}

function serviceRate(serviceType: SupportedServiceType | null): number {
  if (serviceType === "deep_clean") return 0.09;
  if (serviceType === "move_in" || serviceType === "move_out") return 0.12;
  return 0;
}

function serviceMaxConditionMultiplier(serviceType: SupportedServiceType | null): number {
  if (serviceType === "deep_clean") return 1.4;
  if (serviceType === "move_in" || serviceType === "move_out") return 1.35;
  return 1.2;
}

function serviceAbsoluteMax(serviceType: SupportedServiceType | null): number {
  if (serviceType === "deep_clean") return 780;
  if (serviceType === "move_in" || serviceType === "move_out") return 720;
  return 330;
}

function scoreFromMap(
  value: string | null,
  map: Record<string, number>,
): { score: number; unknown: boolean } {
  if (value != null && Object.prototype.hasOwnProperty.call(map, value)) {
    return { score: map[value], unknown: false };
  }
  return { score: 0, unknown: true };
}

function conditionMultiplier(conditionScore: number): number {
  if (conditionScore <= -3) return 0.9;
  if (conditionScore <= 1) return 1.0;
  if (conditionScore <= 3) return 1.1;
  if (conditionScore <= 5) return 1.22;
  if (conditionScore <= 7) return 1.32;
  return 1.4;
}

function expectationRisk(value: string | null): { known: boolean; riskFlag: string | null } {
  if (value === "maintenance_clean" || value === "basic") {
    return { known: true, riskFlag: null };
  }
  if (value === "reset_level" || value === "deep_reset") {
    return { known: true, riskFlag: "RESET_EXPECTATION" };
  }
  if (value === "presentation_ready" || value === "guest_ready") {
    return { known: true, riskFlag: "PRESENTATION_EXPECTATION" };
  }
  if (value === "move_ready" || value === "detailed_standard") {
    return { known: true, riskFlag: null };
  }
  return { known: false, riskFlag: "UNKNOWN_EXPECTATION" };
}

function bufferPercentForRisk(riskLevel: EstimateRiskLevel): number {
  if (riskLevel === "high") return 22;
  if (riskLevel === "medium") return 12;
  return 5;
}

function varianceRangeForRisk(expectedMinutes: number, riskLevel: EstimateRiskLevel) {
  if (riskLevel === "high") {
    return {
      lowMinutes: roundUpToFive(expectedMinutes * 0.85),
      highMinutes: roundUpToFive(expectedMinutes * 1.35),
    };
  }
  if (riskLevel === "medium") {
    return {
      lowMinutes: roundUpToFive(expectedMinutes * 0.9),
      highMinutes: roundUpToFive(expectedMinutes * 1.2),
    };
  }
  return {
    lowMinutes: roundUpToFive(expectedMinutes * 0.9),
    highMinutes: roundUpToFive(expectedMinutes * 1.1),
  };
}

export function estimateV2(input: EstimateInput | Record<string, unknown>): EstimateV2Output {
  const source = input as Record<string, unknown>;
  const squareFootage = squareFootageFromBand(source.sqft_band);
  const squareFootageMax = squareFootageMaxFromBand(source.sqft_band);
  const bedrooms = numberFromBedrooms(source.bedrooms);
  const bathrooms = numberFromBathrooms(source.bathrooms);
  const serviceType = stringField(source, "service_type");
  const supportedService = supportedServiceType(serviceType);
  const laborCondition = scoreFromMap(
    stringField(source, "overall_labor_condition"),
    {
      recently_maintained: -2,
      normal_lived_in: 0,
      behind_weeks: 2,
      major_reset: 4,
    },
  );
  const clutter = scoreFromMap(stringField(source, "clutter_access"), {
    mostly_clear: -1,
    minimal: -1,
    moderate_clutter: 1,
    heavy_clutter: 3,
  });
  const kitchen = scoreFromMap(stringField(source, "kitchen_intensity"), {
    light_use: -1,
    average_use: 0,
    heavy_use: 3,
  });
  const pet = scoreFromMap(stringField(source, "pet_impact"), {
    none: 0,
    light: 1,
    heavy: 2,
  });
  const recency = scoreFromMap(
    stringField(source, "last_pro_clean_recency") ??
      stringField(source, "last_professional_clean"),
    {
      within_30_days: -1,
      "2_4_weeks": 0,
      days_30_90: 1,
      days_90_plus: 2,
      unknown_or_not_recently: 1,
    },
  );
  const expectation = expectationRisk(stringField(source, "primary_cleaning_intent"));

  const riskFlags: string[] = [];
  let confidence = 1.0;
  if (squareFootage == null) {
    confidence -= 0.15;
    riskFlags.push("MISSING_SQUARE_FOOTAGE");
  }
  if (bedrooms == null) confidence -= 0.1;
  if (bathrooms == null) confidence -= 0.1;
  if (supportedService == null) {
    confidence -= 0.1;
    riskFlags.push("UNKNOWN_SERVICE_TYPE");
  }
  if (squareFootageMax == null) confidence -= 0.05;
  if (laborCondition.unknown) confidence -= 0.1;
  if (clutter.unknown) confidence -= 0.08;
  if (kitchen.unknown) confidence -= 0.06;
  if (pet.unknown) confidence -= 0.03;
  if (recency.unknown) confidence -= 0.06;
  if (!expectation.known) confidence -= 0.03;
  if (laborCondition.score >= 4) riskFlags.push("HEAVY_LABOR_CONDITION");
  if (clutter.score >= 3) riskFlags.push("HIGH_CLUTTER_ACCESS");
  if (kitchen.score >= 3) riskFlags.push("HEAVY_KITCHEN_INTENSITY");
  if (pet.score > 0) riskFlags.push("PET_COMPLEXITY");
  if (recency.score >= 2) riskFlags.push("LONG_TIME_SINCE_LAST_CLEAN");
  if (expectation.riskFlag) riskFlags.push(expectation.riskFlag);
  const confidenceScore = clamp(confidence, 0.35, 0.95);
  if (confidenceScore < 0.65) riskFlags.push("LOW_CONFIDENCE_ESTIMATE");

  const baseMinutes = 60;
  const squareFootageMinutes = (squareFootage ?? 1400) * 0.06;
  const bedroomMinutes = (bedrooms ?? 2) * 12;
  const bathroomMinutes = (bathrooms ?? 2) * 25;
  const serviceAddMinutes = (squareFootage ?? 1400) * serviceRate(supportedService);
  const conditionScore = clamp(
    laborCondition.score * 1.0 +
      clutter.score * 0.75 +
      kitchen.score * 0.9 +
      pet.score * 0.55 +
      recency.score * 0.65,
    -5,
    10,
  );
  const rawConditionMultiplier = conditionMultiplier(conditionScore);
  const maxConditionMultiplier = serviceMaxConditionMultiplier(supportedService);
  const appliedConditionMultiplier = Math.min(
    rawConditionMultiplier,
    maxConditionMultiplier,
  );
  const uncappedExpected =
    (baseMinutes +
      squareFootageMinutes +
      bedroomMinutes +
      bathroomMinutes +
      serviceAddMinutes) *
    appliedConditionMultiplier;
  const absoluteMaxMinutes = serviceAbsoluteMax(supportedService);
  const sqftBandMaxMinutesCap = (squareFootageMax ?? 4000) * 0.28;
  const cappedExpected = Math.min(
    uncappedExpected,
    absoluteMaxMinutes,
    sqftBandMaxMinutesCap,
  );
  const expectedMinutes = roundUpToFive(cappedExpected);
  const unknownCriticalFields =
    squareFootage == null ||
    squareFootageMax == null ||
    bedrooms == null ||
    bathrooms == null ||
    supportedService == null ||
    laborCondition.unknown ||
    clutter.unknown ||
    kitchen.unknown ||
    pet.unknown ||
    recency.unknown;
  const reachedHardCap =
    expectedMinutes >= roundUpToFive(absoluteMaxMinutes) ||
    expectedMinutes >= roundUpToFive(sqftBandMaxMinutesCap);
  const riskLevel: EstimateRiskLevel =
    conditionScore > 7 || reachedHardCap || unknownCriticalFields
      ? "high"
      : confidenceScore < 0.8 || conditionScore > 3
        ? "medium"
        : "low";
  const bufferPercent = bufferPercentForRisk(riskLevel);
  const bufferMinutes = roundUpToFive(expectedMinutes * (bufferPercent / 100));
  const pricedMinutes = expectedMinutes + bufferMinutes;
  const estimatedPrice = Math.round(
    (pricedMinutes / 60) * CLEANING_PRICING_POLICY_V1.hourlyRateCents,
  );
  const bufferReasonCodes = [
    `RISK_${riskLevel.toUpperCase()}`,
    ...riskFlags,
  ];

  return {
    snapshotVersion: SNAPSHOT_VERSION,
    expectedMinutes,
    bufferMinutes,
    bufferPercent,
    pricedMinutes,
    confidenceScore,
    riskLevel,
    varianceRange: varianceRangeForRisk(expectedMinutes, riskLevel),
    pricingFactors: {
      baseMinutes,
      squareFootageMinutes: Math.round(squareFootageMinutes),
      bedroomMinutes,
      bathroomMinutes,
      serviceAddMinutes: Math.round(serviceAddMinutes),
      conditionScore,
      conditionMultiplier: appliedConditionMultiplier,
      serviceMaxConditionMultiplier: maxConditionMultiplier,
      serviceAbsoluteMaxMinutes: absoluteMaxMinutes,
      sqftBandMaxMinutesCap,
      appliedExpectedMinutesCap: cappedExpected,
      confidencePenaltyMultiplier: confidenceScore,
    },
    riskFlags,
    explanation: EXPLANATION,
    adminOnly: {
      expectedMinutes,
      bufferMinutes,
      pricedMinutes,
      bufferPolicy: `${bufferPercent}% ${riskLevel} risk buffer`,
      bufferReasonCodes,
    },
    foVisible: {
      targetMinutes: expectedMinutes,
      riskFlags,
    },
    customerVisible: {
      estimatedMinutes: pricedMinutes,
      estimatedPrice,
      explanation: EXPLANATION,
    },
  };
}

export function calculateEstimateV2Reconciliation(params: {
  v1Minutes: number;
  v1PriceCents: number;
  v2ExpectedMinutes: number;
  v2PricedMinutes: number;
  v2PriceCents: number;
}): EstimateV2Reconciliation {
  const flags: string[] = [];
  const legacyInputMissing =
    !Number.isFinite(params.v1Minutes) ||
    params.v1Minutes < 0 ||
    !Number.isFinite(params.v1PriceCents) ||
    params.v1PriceCents < 0;
  const v1Minutes = finiteNonNegativeNumber(params.v1Minutes);
  const v1PriceCents = finiteNonNegativeInteger(params.v1PriceCents);
  const v2ExpectedMinutes = finiteNonNegativeNumber(params.v2ExpectedMinutes);
  const v2PricedMinutes = finiteNonNegativeNumber(params.v2PricedMinutes);
  const v2PriceCents = finiteNonNegativeInteger(params.v2PriceCents);

  const expectedDeltaMinutes = v2ExpectedMinutes - v1Minutes;
  const pricedDeltaMinutes = v2PricedMinutes - v1Minutes;
  const expectedDeltaPercent =
    v1Minutes > 0 ? expectedDeltaMinutes / v1Minutes : 0;
  const pricedDeltaPercent =
    v1Minutes > 0 ? pricedDeltaMinutes / v1Minutes : 0;
  const priceDeltaCents = v2PriceCents - v1PriceCents;
  const priceDeltaPercent =
    v1PriceCents > 0 ? priceDeltaCents / v1PriceCents : 0;

  const classification: EstimateReconciliationClassification =
    Math.abs(expectedDeltaPercent) <= 0.2
      ? "aligned"
      : expectedDeltaPercent > 0.2
        ? "v2_higher"
        : "v2_lower";

  if (legacyInputMissing) flags.push("ESTIMATE_RECONCILIATION_LEGACY_INPUT_MISSING");
  if (Math.abs(expectedDeltaPercent) > 0.4) {
    flags.push("ESTIMATE_V2_LARGE_MINUTE_DELTA");
  }
  if (Math.abs(priceDeltaPercent) > 0.25) {
    flags.push("ESTIMATE_V2_LARGE_PRICE_DELTA");
  }
  if (priceDeltaCents > 0) flags.push("ESTIMATE_V2_PRICE_HIGHER_THAN_V1");
  if (priceDeltaCents < 0) flags.push("ESTIMATE_V2_PRICE_LOWER_THAN_V1");

  return {
    v1Minutes,
    v1PriceCents,
    v2ExpectedMinutes,
    v2PricedMinutes,
    v2PriceCents,
    expectedDeltaMinutes,
    pricedDeltaMinutes,
    expectedDeltaPercent,
    pricedDeltaPercent,
    priceDeltaCents,
    priceDeltaPercent,
    classification,
    authority: {
      pricingAuthority: "legacy_v1",
      durationAuthority: "legacy_v1",
      v2Mode: "shadow",
    },
    flags,
  };
}

@Injectable()
export class EstimateEngineV2Service {
  estimateV2(input: EstimateInput | Record<string, unknown>): EstimateV2Output {
    return estimateV2(input);
  }

  calculateReconciliation(params: {
    v1Minutes: number;
    v1PriceCents: number;
    v2ExpectedMinutes: number;
    v2PricedMinutes: number;
    v2PriceCents: number;
  }): EstimateV2Reconciliation {
    return calculateEstimateV2Reconciliation(params);
  }
}
