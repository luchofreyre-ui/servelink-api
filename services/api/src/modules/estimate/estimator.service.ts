import { Injectable } from "@nestjs/common";

/**
 * EstimatorService (deterministic, explainable, versioned-ready)
 *
 * Core principles (locked):
 * - Always returns a real-time estimate.
 * - Risk widens range (capped) and/or triggers staged plan (uncapped reveal) when extreme.
 * - Ops review never blocks estimating; flags only affect post-booking visibility/handling.
 */

export type EstimatorMode = "STANDARD" | "CAPPED" | "STAGED";

export type PropertyType = "apartment" | "house" | "condo" | "townhome" | "duplex";
export type SqftBand =
  | "0_799"
  | "800_1199"
  | "1200_1599"
  | "1600_1999"
  | "2000_2499"
  | "2500_2999"
  | "3000_3499"
  | "3500_plus";

export type Bedrooms = "0" | "1" | "2" | "3" | "4" | "5_plus";
export type Bathrooms = "1" | "1_5" | "2" | "2_5" | "3" | "3_5" | "4_plus";
export type Floors = "1" | "2" | "3_plus";

export type ServiceType = "maintenance" | "deep_clean" | "move_in" | "move_out";

export type KnownOrNotSure<T extends string> = T | "not_sure";

export type ClutterLevel = KnownOrNotSure<"minimal" | "light" | "moderate" | "heavy">;
export type ConditionLevel =
  | KnownOrNotSure<"light" | "normal" | "heavy_grease"> // kitchen
  | KnownOrNotSure<"light" | "normal" | "heavy_scale">; // bathroom

export type DustLevel = KnownOrNotSure<"low" | "medium" | "high">;

export type PetPresence = KnownOrNotSure<"none" | "one" | "multiple">;
export type SheddingLevel = KnownOrNotSure<"low" | "medium" | "high">;

export type FlooringMix = KnownOrNotSure<"mostly_hard" | "mixed" | "mostly_carpet">;
export type CarpetPercent = "0_25" | "26_50" | "51_75" | "76_100" | "not_sure";
export type StairsFlights = "none" | "one" | "two_plus" | "not_sure";

export type OccupancyState =
  | "vacant"
  | "occupied_normal"
  | "occupied_cluttered"
  | "not_sure";

export type FloorVisibility = "mostly_clear" | "some_obstacles" | "lots_of_items" | "not_sure";

export type StovetopType = "flat_glass" | "gas_grates" | "not_sure";

export type GlassShowers = "none" | "one" | "multiple" | "not_sure";

export type Addon =
  | "inside_oven"
  | "inside_fridge"
  | "interior_windows"
  | "blinds"
  | "baseboards_detail"
  | "cabinets_exterior_detail"
  | "laundry_fold"
  | "dish_wash_load"
  | "vacuum_sofa";

export type EstimatorFlag =
  | "OPS_VISIBILITY_HIGH"
  | "POST_BOOKING_REVIEW_ELIGIBLE"
  | "STAGED_PLAN_PRESENTED"
  | "HIGH_SCOPE_VARIANCE"
  | "LOW_CONFIDENCE";

export type EstimateLineItem = {
  label: string;
  minutes: number;
  reason?: string;
};

export type RiskSignal = {
  key: string;
  label: string;
  category: RiskCategory;
  percent: number; // 0–100
  reason?: string;
};

export type RiskCategory =
  | "unknowns"
  | "confirmed_multipliers"
  | "kitchen_complexity"
  | "bathroom_complexity"
  | "occupancy_access";

export type StagePlan = {
  totalMinutes: number;
  visits: Array<{
    visitNumber: number;
    purpose: string;
    minutes: number;
    tasks: string[];
  }>;
};

export type EstimateResult = {
  estimatorVersion: string;

  mode: EstimatorMode;

  estimateMinutes: number;
  lowerBoundMinutes: number;
  upperBoundMinutes: number;

  // present only in STAGED mode (>= 35% uncapped risk)
  uncappedMinutes?: number;
  stagedPlan?: StagePlan;

  confidence: number;

  riskPercentUncapped: number; // actual accumulated risk (0–100)
  riskPercentCappedForRange: number; // used to compute upper bound, capped by service cap
  riskCapped: boolean;

  breakdown: {
    baseline: EstimateLineItem[];
    adjustments: EstimateLineItem[];
    riskSignals: RiskSignal[];
  };

  flags: EstimatorFlag[];
};

export type EstimateInput = {
  property_type: PropertyType;
  sqft_band: SqftBand;
  bedrooms: Bedrooms;
  bathrooms: Bathrooms;
  floors: Floors;

  service_type: ServiceType;

  first_time_with_servelink: KnownOrNotSure<"yes" | "no">;
  last_professional_clean?: KnownOrNotSure<
    "under_2_weeks" | "2_4_weeks" | "1_3_months" | "3_6_months" | "6_plus_months"
  >;

  clutter_level: ClutterLevel;

  kitchen_condition: KnownOrNotSure<"light" | "normal" | "heavy_grease">;
  stovetop_type?: StovetopType;

  bathroom_condition: KnownOrNotSure<"light" | "normal" | "heavy_scale">;
  glass_showers?: GlassShowers;

  dust_level?: DustLevel;

  pet_presence: PetPresence;
  pet_shedding?: SheddingLevel;
  pet_accidents_or_litter_areas?: KnownOrNotSure<"yes" | "no">;

  occupancy_state?: OccupancyState;
  floor_visibility?: FloorVisibility;

  flooring_mix?: FlooringMix;
  carpet_percent?: CarpetPercent;
  stairs_flights?: StairsFlights;

  addons?: Addon[];
};

type RangeCaps = { upsideCapPct: number; downsideCapPct: number };

const ESTIMATOR_VERSION = "est_v1.0.0";

// ----------------------------
// Baseline tables (locked)
// ----------------------------
const BASE_MIN_BY_SQFT: Record<SqftBand, number> = {
  "0_799": 120,
  "800_1199": 160,
  "1200_1599": 200,
  "1600_1999": 240,
  "2000_2499": 290,
  "2500_2999": 340,
  "3000_3499": 390,
  "3500_plus": 450,
};

const BEDROOM_ADJ_MIN: Record<Bedrooms, number> = {
  "0": -10,
  "1": -10,
  "2": 0,
  "3": 15,
  "4": 30,
  "5_plus": 50,
};

const BATHROOM_ADJ_MIN: Record<Bathrooms, number> = {
  "1": -15,
  "1_5": 0,
  "2": 20,
  "2_5": 40,
  "3": 65,
  "3_5": 90,
  "4_plus": 120,
};

const PROPERTY_TYPE_ADJ_MIN: Record<PropertyType, number> = {
  apartment: -10,
  condo: -5,
  house: 0,
  townhome: 10,
  duplex: 15,
};

const FLOORS_ADJ_MIN: Record<Floors, number> = {
  "1": 0,
  "2": 10,
  "3_plus": 20,
};

// ----------------------------
// Service type adjustments (locked v1)
// ----------------------------
function serviceTypeMinutes(service: ServiceType, sqft: SqftBand): number {
  if (service === "maintenance") return 0;

  if (service === "deep_clean") {
    // <1600 => +60, 1600–2499 => +90, 2500+ => +120
    if (sqft === "0_799" || sqft === "800_1199" || sqft === "1200_1599") return 60;
    if (sqft === "1600_1999" || sqft === "2000_2499") return 90;
    return 120;
  }

  // move-in / move-out: +120..+180 (vacant typical; real vacancy handled via occupancy adjustment too)
  if (sqft === "0_799" || sqft === "800_1199" || sqft === "1200_1599") return 120;
  if (sqft === "1600_1999" || sqft === "2000_2499") return 150;
  return 180;
}

function rangeCapsForService(service: ServiceType): RangeCaps {
  // Locked per your instruction:
  // Maintenance: +15 / -5, Deep: +25 / -7, Move-in/out: +25 / -10
  if (service === "maintenance") return { upsideCapPct: 15, downsideCapPct: 5 };
  if (service === "deep_clean") return { upsideCapPct: 25, downsideCapPct: 7 };
  return { upsideCapPct: 25, downsideCapPct: 10 };
}

// ----------------------------
// Add-ons minutes (locked v1)
// ----------------------------
const ADDON_MINUTES: Record<Addon, number> = {
  inside_oven: 30,
  inside_fridge: 25,
  interior_windows: 45,
  blinds: 40,
  baseboards_detail: 30,
  cabinets_exterior_detail: 25,
  laundry_fold: 20,
  dish_wash_load: 15,
  vacuum_sofa: 15,
};

// ----------------------------
// Adjustments (condition + occupancy etc.) (locked v1)
// ----------------------------
function firstTimeMinutes(first: KnownOrNotSure<"yes" | "no">): number {
  if (first === "yes") return 30;
  if (first === "not_sure") return 45;
  return 0;
}

function occupancyMinutes(occ?: OccupancyState): number {
  if (!occ || occ === "not_sure") return 0;
  if (occ === "vacant") return -15;
  if (occ === "occupied_cluttered") return 30;
  return 0; // occupied_normal
}

function floorVisibilityMinutes(v?: FloorVisibility): number {
  if (!v || v === "not_sure") return 0;
  if (v === "some_obstacles") return 20;
  if (v === "lots_of_items") return 45;
  return 0;
}

function clutterMinutes(c: ClutterLevel): number {
  if (c === "minimal") return -10;
  if (c === "light") return 0;
  if (c === "moderate") return 30;
  if (c === "heavy") return 60;
  // not_sure
  return 45;
}

function kitchenMinutes(k: KnownOrNotSure<"light" | "normal" | "heavy_grease">): number {
  if (k === "light") return 0;
  if (k === "normal") return 10;
  if (k === "heavy_grease") return 40;
  return 25; // not_sure
}

function stovetopMinutes(s?: StovetopType): number {
  if (!s || s === "not_sure") return 0;
  if (s === "gas_grates") return 15;
  return 0;
}

function bathroomMinutes(b: KnownOrNotSure<"light" | "normal" | "heavy_scale">): number {
  if (b === "light") return 0;
  if (b === "normal") return 10;
  if (b === "heavy_scale") return 35;
  return 20; // not_sure
}

function glassShowerMinutes(g?: GlassShowers): number {
  if (!g || g === "not_sure") return 0;
  if (g === "one") return 15;
  if (g === "multiple") return 30;
  return 0;
}

function petsMinutes(p: PetPresence): number {
  if (p === "none") return 0;
  if (p === "one") return 15;
  if (p === "multiple") return 30;
  return 20; // not_sure
}

function sheddingMinutes(s?: SheddingLevel): number {
  if (!s || s === "not_sure") return 0;
  if (s === "medium") return 10;
  if (s === "high") return 25;
  return 0; // low
}

function petAccidentsMinutes(y?: KnownOrNotSure<"yes" | "no">): number {
  if (!y || y === "not_sure") return 0;
  return y === "yes" ? 30 : 0;
}

function carpetMinutes(p?: CarpetPercent): number {
  if (!p || p === "not_sure") return 0;
  if (p === "26_50") return 10;
  if (p === "51_75") return 25;
  if (p === "76_100") return 40;
  return 0; // 0_25
}

function stairsMinutes(s?: StairsFlights): number {
  if (!s || s === "not_sure") return 0;
  if (s === "one") return 10;
  if (s === "two_plus") return 25;
  return 0;
}

// ----------------------------
// Risk signals registry (locked per your caps)
// Unknowns cap 15%
// Confirmed multipliers cap 20%
// Kitchen cap 10%
// Bathroom cap 10%
// Occupancy/access cap 5%
// Global cap for range: service cap (<=25%)
// Scope reveal + 4-visit plan: uncapped >=35%
// ----------------------------

type RiskAccumulator = {
  signals: RiskSignal[];
  totalsByCategory: Record<RiskCategory, number>; // percent
  totalPercent: number;
};

function addRisk(acc: RiskAccumulator, signal: RiskSignal, categoryCap: number) {
  const current = acc.totalsByCategory[signal.category] || 0;
  const remaining = Math.max(0, categoryCap - current);
  const applied = Math.min(signal.percent, remaining);

  if (applied <= 0) return;

  acc.totalsByCategory[signal.category] = current + applied;
  acc.totalPercent += applied;
  acc.signals.push({ ...signal, percent: applied });
}

function buildRiskSignals(input: EstimateInput): RiskAccumulator {
  const acc: RiskAccumulator = {
    signals: [],
    totalsByCategory: {
      unknowns: 0,
      confirmed_multipliers: 0,
      kitchen_complexity: 0,
      bathroom_complexity: 0,
      occupancy_access: 0,
    },
    totalPercent: 0,
  };

  // Category caps (locked)
  const CAP_UNKNOWN = 15;
  const CAP_CONFIRMED = 20;
  const CAP_KITCHEN = 10;
  const CAP_BATH = 10;
  const CAP_OCC = 5;

  // Unknowns (each unknown +5%, capped at 15%)
  const unknownKeys: Array<{ cond: boolean; label: string; key: string }> = [
    { cond: input.clutter_level === "not_sure", label: "Clutter unknown", key: "unknown_clutter" },
    { cond: input.kitchen_condition === "not_sure", label: "Kitchen unknown", key: "unknown_kitchen" },
    { cond: input.bathroom_condition === "not_sure", label: "Bathroom unknown", key: "unknown_bathroom" },
    { cond: input.pet_presence === "not_sure", label: "Pets unknown", key: "unknown_pets" },
    { cond: input.first_time_with_servelink === "not_sure", label: "First-time unknown", key: "unknown_first_time" },
    { cond: input.occupancy_state === "not_sure", label: "Occupancy unknown", key: "unknown_occupancy" },
    { cond: input.floor_visibility === "not_sure", label: "Floor visibility unknown", key: "unknown_floor_visibility" },
    { cond: input.carpet_percent === "not_sure", label: "Carpet % unknown", key: "unknown_carpet" },
    { cond: input.stairs_flights === "not_sure", label: "Stairs unknown", key: "unknown_stairs" },
  ];

  for (const u of unknownKeys) {
    if (!u.cond) continue;
    addRisk(
      acc,
      { key: u.key, label: u.label, category: "unknowns", percent: 5 },
      CAP_UNKNOWN,
    );
  }

  // Confirmed labor multipliers (cap 20%)
  if (input.first_time_with_servelink === "yes") {
    addRisk(
      acc,
      { key: "confirmed_first_time", label: "First-time clean", category: "confirmed_multipliers", percent: 5 },
      CAP_CONFIRMED,
    );
  }

  if (input.clutter_level === "moderate") {
    addRisk(
      acc,
      { key: "confirmed_clutter_moderate", label: "Moderate clutter", category: "confirmed_multipliers", percent: 5 },
      CAP_CONFIRMED,
    );
  }
  if (input.clutter_level === "heavy") {
    addRisk(
      acc,
      { key: "confirmed_clutter_heavy", label: "Heavy clutter", category: "confirmed_multipliers", percent: 10 },
      CAP_CONFIRMED,
    );
  }

  if (input.pet_presence === "multiple") {
    addRisk(
      acc,
      { key: "confirmed_pets_multiple", label: "Multiple pets", category: "confirmed_multipliers", percent: 5 },
      CAP_CONFIRMED,
    );
  }
  if (input.pet_shedding === "high") {
    addRisk(
      acc,
      { key: "confirmed_shedding_high", label: "High shedding", category: "confirmed_multipliers", percent: 5 },
      CAP_CONFIRMED,
    );
  }
  if (input.pet_accidents_or_litter_areas === "yes") {
    addRisk(
      acc,
      { key: "confirmed_pet_accidents", label: "Pet accidents / litter areas", category: "confirmed_multipliers", percent: 5 },
      CAP_CONFIRMED,
    );
  }

  // Kitchen complexity (cap 10%)
  if (input.kitchen_condition === "heavy_grease") {
    addRisk(
      acc,
      { key: "kitchen_heavy_grease", label: "Heavy kitchen grease", category: "kitchen_complexity", percent: 5 },
      CAP_KITCHEN,
    );
  }
  if (input.stovetop_type === "gas_grates") {
    addRisk(
      acc,
      { key: "kitchen_gas_grates", label: "Gas grates stovetop", category: "kitchen_complexity", percent: 3 },
      CAP_KITCHEN,
    );
  }

  // Bathroom complexity (cap 10%)
  if (input.bathroom_condition === "heavy_scale") {
    addRisk(
      acc,
      { key: "bath_heavy_scale", label: "Heavy bathroom scale", category: "bathroom_complexity", percent: 5 },
      CAP_BATH,
    );
  }
  if (input.glass_showers === "multiple") {
    addRisk(
      acc,
      { key: "bath_glass_multiple", label: "Multiple glass showers", category: "bathroom_complexity", percent: 5 },
      CAP_BATH,
    );
  }
  if (input.glass_showers === "one") {
    // single glass shower still adds some risk, but smaller
    addRisk(
      acc,
      { key: "bath_glass_one", label: "Glass shower", category: "bathroom_complexity", percent: 3 },
      CAP_BATH,
    );
  }

  // Occupancy/access friction (cap 5%)
  if (input.occupancy_state === "occupied_cluttered") {
    addRisk(
      acc,
      { key: "occ_occupied_cluttered", label: "Occupied + cluttered", category: "occupancy_access", percent: 5 },
      CAP_OCC,
    );
  } else if (input.occupancy_state === "occupied_normal") {
    addRisk(
      acc,
      { key: "occ_occupied", label: "Occupied during service", category: "occupancy_access", percent: 3 },
      CAP_OCC,
    );
  }

  if (input.floor_visibility === "lots_of_items") {
    addRisk(
      acc,
      { key: "occ_floor_obstructed", label: "Obstructed floors", category: "occupancy_access", percent: 5 },
      CAP_OCC,
    );
  } else if (input.floor_visibility === "some_obstacles") {
    addRisk(
      acc,
      { key: "occ_floor_some", label: "Some obstacles", category: "occupancy_access", percent: 3 },
      CAP_OCC,
    );
  }

  return acc;
}

// ----------------------------
// Confidence math (locked)
// - start 0.85
// - unknowns: -0.05 each, cap -0.20
// - confirmed multipliers: cap -0.15 (first-time, clutter, pets)
// - kitchen: cap -0.10
// - bathroom: cap -0.10
// - occupancy/access: cap -0.05
// - floor at 0.30
// ----------------------------
function computeConfidence(input: EstimateInput): number {
  let c = 0.85;

  // Unknowns
  const unknowns = [
    input.clutter_level === "not_sure",
    input.kitchen_condition === "not_sure",
    input.bathroom_condition === "not_sure",
    input.pet_presence === "not_sure",
    input.first_time_with_servelink === "not_sure",
    input.occupancy_state === "not_sure",
    input.floor_visibility === "not_sure",
    input.carpet_percent === "not_sure",
    input.stairs_flights === "not_sure",
  ].filter(Boolean).length;

  const unknownDeduction = Math.min(0.20, unknowns * 0.05);
  c -= unknownDeduction;

  // Confirmed multipliers
  let confMult = 0;
  if (input.first_time_with_servelink === "yes") confMult += 0.05;
  if (input.clutter_level === "moderate") confMult += 0.05;
  if (input.clutter_level === "heavy") confMult += 0.10;
  if (input.pet_presence === "multiple" || input.pet_shedding === "high") confMult += 0.05;
  c -= Math.min(0.15, confMult);

  // Kitchen
  let k = 0;
  if (input.kitchen_condition === "heavy_grease") k += 0.05;
  c -= Math.min(0.10, k);

  // Bathroom
  let b = 0;
  if (input.bathroom_condition === "heavy_scale") b += 0.05;
  if (input.glass_showers === "multiple") b += 0.05;
  c -= Math.min(0.10, b);

  // Occupancy/access
  let o = 0;
  if (input.occupancy_state === "occupied_normal") o += 0.03;
  if (input.occupancy_state === "occupied_cluttered") o += 0.05;
  if (input.floor_visibility === "some_obstacles") o += 0.03;
  if (input.floor_visibility === "lots_of_items") o += 0.05;
  c -= Math.min(0.05, o);

  c = Math.max(0.30, c);

  // clamp to 2 decimals for stability in tests/logging
  return Math.round(c * 100) / 100;
}

function roundInt(n: number): number {
  return Math.max(0, Math.round(n));
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

@Injectable()
export class EstimatorService {
  estimate(input: EstimateInput): EstimateResult {
    // ---- Baseline
    const baseline: EstimateLineItem[] = [];
    baseline.push({ label: "Base size (sqft band)", minutes: BASE_MIN_BY_SQFT[input.sqft_band] });
    baseline.push({ label: "Bedrooms", minutes: BEDROOM_ADJ_MIN[input.bedrooms] });
    baseline.push({ label: "Bathrooms", minutes: BATHROOM_ADJ_MIN[input.bathrooms] });
    baseline.push({ label: "Property type", minutes: PROPERTY_TYPE_ADJ_MIN[input.property_type] });
    baseline.push({ label: "Floors", minutes: FLOORS_ADJ_MIN[input.floors] });

    const baselineMinutes = baseline.reduce((sum, li) => sum + li.minutes, 0);

    // ---- Adjustments
    const adjustments: EstimateLineItem[] = [];

    const svcMin = serviceTypeMinutes(input.service_type, input.sqft_band);
    if (svcMin !== 0) adjustments.push({ label: `Service type: ${input.service_type}`, minutes: svcMin });

    const ftMin = firstTimeMinutes(input.first_time_with_servelink);
    if (ftMin !== 0) adjustments.push({ label: "First-time clean", minutes: ftMin });

    const occMin = occupancyMinutes(input.occupancy_state);
    if (occMin !== 0) adjustments.push({ label: "Occupancy", minutes: occMin });

    const visMin = floorVisibilityMinutes(input.floor_visibility);
    if (visMin !== 0) adjustments.push({ label: "Floor visibility / obstacles", minutes: visMin });

    const clMin = clutterMinutes(input.clutter_level);
    if (clMin !== 0) adjustments.push({ label: "Clutter level", minutes: clMin });

    const kMin = kitchenMinutes(input.kitchen_condition);
    if (kMin !== 0) adjustments.push({ label: "Kitchen condition", minutes: kMin });

    const stMin = stovetopMinutes(input.stovetop_type);
    if (stMin !== 0) adjustments.push({ label: "Stovetop type", minutes: stMin });

    const baMin = bathroomMinutes(input.bathroom_condition);
    if (baMin !== 0) adjustments.push({ label: "Bathroom condition", minutes: baMin });

    const gsMin = glassShowerMinutes(input.glass_showers);
    if (gsMin !== 0) adjustments.push({ label: "Glass showers", minutes: gsMin });

    const pMin = petsMinutes(input.pet_presence);
    if (pMin !== 0) adjustments.push({ label: "Pets", minutes: pMin });

    const shMin = sheddingMinutes(input.pet_shedding);
    if (shMin !== 0) adjustments.push({ label: "Pet shedding", minutes: shMin });

    const paMin = petAccidentsMinutes(input.pet_accidents_or_litter_areas);
    if (paMin !== 0) adjustments.push({ label: "Pet accidents / litter areas", minutes: paMin });

    const cpMin = carpetMinutes(input.carpet_percent);
    if (cpMin !== 0) adjustments.push({ label: "Carpet percentage", minutes: cpMin });

    const stairMin = stairsMinutes(input.stairs_flights);
    if (stairMin !== 0) adjustments.push({ label: "Stairs", minutes: stairMin });

    const addons = input.addons ?? [];
    for (const a of addons) {
      const m = ADDON_MINUTES[a] ?? 0;
      if (m > 0) adjustments.push({ label: `Add-on: ${a}`, minutes: m });
    }

    const baseEstimateMinutes = baselineMinutes + adjustments.reduce((sum, li) => sum + li.minutes, 0);
    const estimateMinutes = roundInt(baseEstimateMinutes);

    // ---- Risk (uncapped) + determine mode
    const riskAcc = buildRiskSignals(input);
    const riskPercentUncapped = roundInt(riskAcc.totalPercent);

    // Determine service cap for range
    const caps = rangeCapsForService(input.service_type);
    const riskPercentCappedForRange = roundInt(clamp(riskPercentUncapped, 0, caps.upsideCapPct));
    const riskCapped = riskPercentUncapped > riskPercentCappedForRange;

    // Mode selection (locked)
    // - <=25%: STANDARD
    // - 26..34%: CAPPED
    // - >=35%: STAGED (uncapped reveal + plan)
    let mode: EstimatorMode = "STANDARD";
    if (riskPercentUncapped >= 35) mode = "STAGED";
    else if (riskPercentUncapped >= 26) mode = "CAPPED";

    // ---- Confidence
    const confidence = computeConfidence(input);

    // ---- Range math (anchored asymmetric)
    const lower = roundInt(estimateMinutes * (1 - caps.downsideCapPct / 100));
    const upper = roundInt(estimateMinutes * (1 + riskPercentCappedForRange / 100));

    // ---- Staged plan (only if STAGED)
    let uncappedMinutes: number | undefined;
    let stagedPlan: StagePlan | undefined;

    if (mode === "STAGED") {
      // Show real numbers (uncapped) and provide 4-visit plan (calculated)
      uncappedMinutes = roundInt(estimateMinutes * (1 + riskPercentUncapped / 100));

      // 4-visit distribution: 30/30/25/15 (purpose-driven, not equal splits)
      const v1 = roundInt(uncappedMinutes * 0.30);
      const v2 = roundInt(uncappedMinutes * 0.30);
      const v3 = roundInt(uncappedMinutes * 0.25);
      const v4 = Math.max(0, uncappedMinutes - v1 - v2 - v3);

      const commonTasks = (extra: string[]) => [
        "Trash removal (light, as needed)",
        "Sanitize high-touch areas",
        ...extra,
      ];

      stagedPlan = {
        totalMinutes: uncappedMinutes,
        visits: [
          {
            visitNumber: 1,
            purpose: "Reset & Access (Foundation)",
            minutes: v1,
            tasks: commonTasks([
              "Clear surfaces (no organizing)",
              "Kitchen + bathrooms: functional sanitation",
              "Floors: sweep/vacuum baseline pass",
            ]),
          },
          {
            visitNumber: 2,
            purpose: "Deep Detail (High-Impact Zones)",
            minutes: v2,
            tasks: commonTasks([
              "Kitchen deep detail (grease/detail surfaces)",
              "Bathroom deep detail (scale/grout/glass)",
              "Baseboards/detail in priority areas",
            ]),
          },
          {
            visitNumber: 3,
            purpose: "Whole-Home Detail (Uniform Quality)",
            minutes: v3,
            tasks: commonTasks([
              "Remaining rooms detail work",
              "Edges/corners and floor finishing",
              "Furniture vacuum / spot work as needed",
            ]),
          },
          {
            visitNumber: 4,
            purpose: "Polish & Maintenance Setup",
            minutes: v4,
            tasks: commonTasks([
              "Final polish / QA pass",
              "Address missed items",
              "Set up maintenance-ready baseline",
            ]),
          },
        ],
      };
    }

    // ---- Flags (non-blocking estimation)
    const flags: EstimatorFlag[] = [];

    const flaggedForOps =
      mode !== "STANDARD" || confidence < 0.65 || riskPercentUncapped >= 26;

    if (flaggedForOps) {
      flags.push("OPS_VISIBILITY_HIGH");
      flags.push("POST_BOOKING_REVIEW_ELIGIBLE");
    }

    if (riskPercentUncapped >= 26) flags.push("HIGH_SCOPE_VARIANCE");
    if (confidence < 0.65) flags.push("LOW_CONFIDENCE");
    if (mode === "STAGED") flags.push("STAGED_PLAN_PRESENTED");

    return {
      estimatorVersion: ESTIMATOR_VERSION,

      mode,

      estimateMinutes: estimateMinutes,
      lowerBoundMinutes: lower,
      upperBoundMinutes: upper,

      uncappedMinutes,
      stagedPlan,

      confidence,

      riskPercentUncapped,
      riskPercentCappedForRange,
      riskCapped,

      breakdown: {
        baseline,
        adjustments,
        riskSignals: riskAcc.signals,
      },

      flags,
    };
  }
}
