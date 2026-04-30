import { Injectable } from "@nestjs/common";
import { CLEANING_PRICING_POLICY_V1 } from "../pricing/pricing-policy";
import type { EstimateInput } from "./estimator.service";
import type {
  EstimateRiskLevel,
  EstimateV2Output,
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

function serviceTypeMultiplier(serviceType: string | null): {
  value: number;
  unknown: boolean;
} {
  if (serviceType === "maintenance" || serviceType === "standard") {
    return { value: 1.0, unknown: false };
  }
  if (serviceType === "deep_clean") return { value: 1.35, unknown: false };
  if (serviceType === "move_in" || serviceType === "move_out") {
    return { value: 1.5, unknown: false };
  }
  return { value: 1.15, unknown: true };
}

function laborConditionMultiplier(value: string | null): {
  value: number;
  unknown: boolean;
  heavy: boolean;
  severe: boolean;
} {
  if (value === "recently_maintained" || value === "light") {
    return { value: 0.9, unknown: false, heavy: false, severe: false };
  }
  if (value === "normal_lived_in" || value === "normal" || value === "moderate") {
    return { value: 1.0, unknown: false, heavy: false, severe: false };
  }
  if (value === "behind_weeks" || value === "heavy") {
    return { value: 1.25, unknown: false, heavy: true, severe: false };
  }
  if (value === "major_reset" || value === "severe") {
    return { value: 1.45, unknown: false, heavy: true, severe: true };
  }
  return { value: 1.1, unknown: true, heavy: false, severe: false };
}

function clutterMultiplier(value: string | null): {
  value: number;
  unknown: boolean;
  heavy: boolean;
  severe: boolean;
} {
  if (value === "mostly_clear" || value === "minimal" || value === "low") {
    return { value: 0.95, unknown: false, heavy: false, severe: false };
  }
  if (value === "moderate_clutter" || value === "moderate") {
    return { value: 1.1, unknown: false, heavy: false, severe: false };
  }
  if (value === "heavy_clutter" || value === "high") {
    return { value: 1.25, unknown: false, heavy: true, severe: false };
  }
  if (value === "severe") {
    return { value: 1.4, unknown: false, heavy: true, severe: true };
  }
  return { value: 1.1, unknown: true, heavy: false, severe: false };
}

function kitchenMultiplier(value: string | null): {
  value: number;
  unknown: boolean;
  heavy: boolean;
  severe: boolean;
} {
  if (value === "light_use" || value === "light") {
    return { value: 0.95, unknown: false, heavy: false, severe: false };
  }
  if (value === "average_use" || value === "normal" || value === "moderate") {
    return { value: 1.0, unknown: false, heavy: false, severe: false };
  }
  if (value === "heavy_use" || value === "heavy") {
    return { value: 1.2, unknown: false, heavy: true, severe: false };
  }
  if (value === "severe") {
    return { value: 1.35, unknown: false, heavy: true, severe: true };
  }
  return { value: 1.05, unknown: true, heavy: false, severe: false };
}

function petMultiplier(input: Record<string, unknown>): {
  value: number;
  unknown: boolean;
  complex: boolean;
} {
  const impact = stringField(input, "pet_impact");
  const presence = stringField(input, "pet_presence");
  if (impact === "heavy" || presence === "multiple") {
    return { value: 1.15, unknown: false, complex: true };
  }
  if (impact === "light" || presence === "one" || presence === "yes") {
    return { value: 1.08, unknown: false, complex: true };
  }
  if (impact === "none" || presence === "none") {
    return { value: 1.0, unknown: false, complex: false };
  }
  return { value: 1.03, unknown: true, complex: false };
}

function recencyMultiplier(value: string | null): {
  value: number;
  unknown: boolean;
  longTime: boolean;
} {
  if (value === "within_30_days" || value === "under_2_weeks") {
    return { value: 0.95, unknown: false, longTime: false };
  }
  if (value === "2_4_weeks") return { value: 1.0, unknown: false, longTime: false };
  if (value === "days_30_90" || value === "1_3_months") {
    return { value: 1.12, unknown: false, longTime: false };
  }
  if (
    value === "days_90_plus" ||
    value === "3_6_months" ||
    value === "6_plus_months"
  ) {
    return { value: 1.25, unknown: false, longTime: true };
  }
  return { value: 1.08, unknown: true, longTime: false };
}

function expectationMultiplier(value: string | null, serviceType: string | null): {
  value: number;
  unknown: boolean;
} {
  if (value === "maintenance_clean" || value === "basic") {
    return { value: 1.0, unknown: false };
  }
  if (value === "reset_level" || value === "deep_reset") {
    return { value: 1.15, unknown: false };
  }
  if (value === "presentation_ready" || value === "guest_ready") {
    return { value: 1.18, unknown: false };
  }
  if (serviceType === "move_in" || serviceType === "move_out" || value === "move_ready") {
    return { value: 1.25, unknown: false };
  }
  if (value === "detailed_standard") return { value: 1.05, unknown: false };
  return { value: 1.05, unknown: true };
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
  const bedrooms = numberFromBedrooms(source.bedrooms);
  const bathrooms = numberFromBathrooms(source.bathrooms);
  const serviceType = stringField(source, "service_type");
  const laborCondition = laborConditionMultiplier(
    stringField(source, "overall_labor_condition"),
  );
  const clutter = clutterMultiplier(stringField(source, "clutter_access"));
  const kitchen = kitchenMultiplier(stringField(source, "kitchen_intensity"));
  const pet = petMultiplier(source);
  const recency = recencyMultiplier(
    stringField(source, "last_pro_clean_recency") ??
      stringField(source, "last_professional_clean"),
  );
  const service = serviceTypeMultiplier(serviceType);
  const expectation = expectationMultiplier(
    stringField(source, "primary_cleaning_intent"),
    serviceType,
  );

  const riskFlags: string[] = [];
  let confidence = 1.0;
  if (squareFootage == null) {
    confidence -= 0.15;
    riskFlags.push("MISSING_SQUARE_FOOTAGE");
  }
  if (bedrooms == null) confidence -= 0.1;
  if (bathrooms == null) confidence -= 0.1;
  if (service.unknown) {
    confidence -= 0.1;
    riskFlags.push("UNKNOWN_SERVICE_TYPE");
  }
  if (laborCondition.unknown) confidence -= 0.1;
  if (clutter.unknown) confidence -= 0.08;
  if (kitchen.unknown) confidence -= 0.06;
  if (recency.unknown) confidence -= 0.06;
  if (laborCondition.heavy) riskFlags.push("HEAVY_LABOR_CONDITION");
  if (clutter.heavy) riskFlags.push("HIGH_CLUTTER_ACCESS");
  if (kitchen.heavy) riskFlags.push("HEAVY_KITCHEN_INTENSITY");
  if (pet.complex) riskFlags.push("PET_COMPLEXITY");
  if (recency.longTime) riskFlags.push("LONG_TIME_SINCE_LAST_CLEAN");
  if (serviceType === "move_out" && (service.unknown || recency.unknown || clutter.unknown)) {
    riskFlags.push("MOVE_OUT_HIGH_VARIANCE");
  }
  const severeFlags = [laborCondition.severe, clutter.severe, kitchen.severe].filter(Boolean)
    .length;
  confidence -= severeFlags * 0.05;
  const confidenceScore = clamp(confidence, 0.35, 0.95);
  if (confidenceScore < 0.65) riskFlags.push("LOW_CONFIDENCE_ESTIMATE");

  const baseMinutes = 60;
  const squareFootageMinutes = (squareFootage ?? 1400) * 0.06;
  const bedroomMinutes = (bedrooms ?? 2) * 12;
  const bathroomMinutes = (bathrooms ?? 2) * 25;
  const rawExpected =
    (baseMinutes + squareFootageMinutes + bedroomMinutes + bathroomMinutes) *
    service.value *
    laborCondition.value *
    clutter.value *
    kitchen.value *
    pet.value *
    recency.value *
    expectation.value;
  const expectedMinutes = roundUpToFive(rawExpected);
  const anyHeavy =
    laborCondition.heavy || clutter.heavy || kitchen.heavy || pet.value > 1.1;
  const riskLevel: EstimateRiskLevel =
    confidenceScore < 0.65 ||
    laborCondition.severe ||
    clutter.severe ||
    kitchen.severe ||
    riskFlags.includes("MOVE_OUT_HIGH_VARIANCE")
      ? "high"
      : confidenceScore < 0.8 || anyHeavy
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
      serviceTypeMultiplier: service.value,
      laborConditionMultiplier: laborCondition.value,
      clutterAccessMultiplier: clutter.value,
      kitchenIntensityMultiplier: kitchen.value,
      petMultiplier: pet.value,
      recencyMultiplier: recency.value,
      expectationMultiplier: expectation.value,
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

@Injectable()
export class EstimateEngineV2Service {
  estimateV2(input: EstimateInput | Record<string, unknown>): EstimateV2Output {
    return estimateV2(input);
  }
}
