/**
 * Canonical Step 2 (home details) → `EstimateFactorsDto` mapping for public intake.
 *
 * MUST stay aligned with:
 * - `services/api/.../dto/estimate-factors.dto.ts` + `estimate-factor-enums.ts`
 * - `services/api/.../estimate-factors-sanitize.ts` `DEFAULT_PUBLIC_FUNNEL_ESTIMATE_FACTORS`
 *
 * Three-layer intake (baseline facts, labor multipliers, expectation signals) is the
 * primary source of truth. Deep-clean focus + move overlays still merge add-ons and
 * bump severity where product cards demand it.
 */

import type {
  BookingAddOnToken,
  BookingAppliancePresenceToken,
  BookingDeepCleanFocus,
  BookingFlowState,
  BookingSurfaceDetailToken,
  BookingTransitionState,
} from "./bookingFlowTypes";
import {
  isBookingMoveTransitionServiceId,
  isDeepCleaningBookingServiceId,
} from "./bookingDeepClean";
import {
  normalizeBookingAddOnsForPayload,
  normalizeBookingAppliancePresenceForPayload,
} from "./bookingUrlState";

/** Mirrors server `DEFAULT_PUBLIC_FUNNEL_ESTIMATE_FACTORS` — keep in sync. */
export const BOOKING_INTAKE_DEFAULT_ESTIMATE_FACTORS: BookingIntakeEstimateFactors =
  {
    propertyType: "house",
    floors: "1",
    firstTimeWithServelink: "no",
    lastProfessionalClean: "1_3_months",
    clutterLevel: "light",
    kitchenCondition: "normal",
    stovetopType: "not_sure",
    bathroomCondition: "normal",
    glassShowers: "none",
    petPresence: "none",
    petAccidentsOrLitterAreas: "no",
    occupancyState: "occupied_normal",
    floorVisibility: "mostly_clear",
    carpetPercent: "26_50",
    stairsFlights: "none",
    addonIds: [],
    halfBathrooms: "0",
    floorMix: "mixed",
    layoutType: "mixed",
    occupancyLevel: "ppl_1_2",
    childrenInHome: "no",
    petImpact: "none",
    overallLaborCondition: "normal_lived_in",
    kitchenIntensity: "average_use",
    bathroomComplexity: "standard",
    clutterAccess: "mostly_clear",
    surfaceDetailTokens: [],
    primaryIntent: "detailed_standard",
    lastProCleanRecency: "days_30_90",
    firstTimeVisitProgram: "one_visit",
    recurringCadenceIntent: "none",
  };

export type BookingIntakeEstimateFactors = {
  propertyType: "apartment" | "house" | "condo" | "townhome" | "duplex";
  floors: "1" | "2" | "3_plus";
  firstTimeWithServelink: "yes" | "no" | "not_sure";
  lastProfessionalClean:
    | "under_2_weeks"
    | "2_4_weeks"
    | "1_3_months"
    | "3_6_months"
    | "6_plus_months"
    | "not_sure";
  clutterLevel: "minimal" | "light" | "moderate" | "heavy" | "not_sure";
  kitchenCondition: "light" | "normal" | "heavy_grease" | "not_sure";
  stovetopType: "flat_glass" | "gas_grates" | "not_sure";
  bathroomCondition: "light" | "normal" | "heavy_scale" | "not_sure";
  glassShowers: "none" | "one" | "multiple" | "not_sure";
  petPresence: "none" | "one" | "multiple" | "not_sure";
  petShedding?: "low" | "medium" | "high" | "not_sure";
  petAccidentsOrLitterAreas: "yes" | "no" | "not_sure";
  occupancyState: "vacant" | "occupied_normal" | "occupied_cluttered" | "not_sure";
  floorVisibility: "mostly_clear" | "some_obstacles" | "lots_of_items" | "not_sure";
  carpetPercent: "0_25" | "26_50" | "51_75" | "76_100" | "not_sure";
  stairsFlights: "none" | "one" | "two_plus" | "not_sure";
  addonIds: string[];
  halfBathrooms: "0" | "1" | "2_plus";
  floorMix: "mostly_hard" | "mixed" | "mostly_carpet";
  layoutType: "open_plan" | "mixed" | "segmented";
  occupancyLevel: "ppl_1_2" | "ppl_3_4" | "ppl_5_plus";
  childrenInHome: "yes" | "no";
  petImpact: "none" | "light" | "heavy";
  overallLaborCondition:
    | "recently_maintained"
    | "normal_lived_in"
    | "behind_weeks"
    | "major_reset";
  kitchenIntensity: "light_use" | "average_use" | "heavy_use";
  bathroomComplexity: "standard" | "moderate_detailing" | "heavy_detailing";
  clutterAccess: "mostly_clear" | "moderate_clutter" | "heavy_clutter";
  surfaceDetailTokens: string[];
  primaryIntent: "maintenance_clean" | "detailed_standard" | "reset_level";
  lastProCleanRecency:
    | "within_30_days"
    | "days_30_90"
    | "days_90_plus"
    | "unknown_or_not_recently";
  firstTimeVisitProgram: "one_visit" | "two_visit" | "three_visit";
  recurringCadenceIntent:
    | "weekly"
    | "every_10_days"
    | "biweekly"
    | "monthly"
    | "none";
};

const FLOOR_RANK: Record<BookingIntakeEstimateFactors["floorVisibility"], number> = {
  mostly_clear: 0,
  not_sure: 1,
  some_obstacles: 2,
  lots_of_items: 3,
};

const OCC_RANK: Record<BookingIntakeEstimateFactors["occupancyState"], number> = {
  vacant: 0,
  not_sure: 1,
  occupied_normal: 2,
  occupied_cluttered: 3,
};

const GLASS_RANK: Record<BookingIntakeEstimateFactors["glassShowers"], number> = {
  none: 0,
  not_sure: 1,
  one: 2,
  multiple: 3,
};

function maxFloor(
  a: BookingIntakeEstimateFactors["floorVisibility"],
  b: BookingIntakeEstimateFactors["floorVisibility"],
): BookingIntakeEstimateFactors["floorVisibility"] {
  return FLOOR_RANK[a] >= FLOOR_RANK[b] ? a : b;
}

function maxOcc(
  a: BookingIntakeEstimateFactors["occupancyState"],
  b: BookingIntakeEstimateFactors["occupancyState"],
): BookingIntakeEstimateFactors["occupancyState"] {
  return OCC_RANK[a] >= OCC_RANK[b] ? a : b;
}

function maxGlass(
  a: BookingIntakeEstimateFactors["glassShowers"],
  b: BookingIntakeEstimateFactors["glassShowers"],
): BookingIntakeEstimateFactors["glassShowers"] {
  return GLASS_RANK[a] >= GLASS_RANK[b] ? a : b;
}

const ADDON_TOKEN_TO_ID: Record<BookingAddOnToken, string> = {
  inside_fridge: "inside_fridge",
  inside_oven: "inside_oven",
  interior_windows: "interior_windows",
  baseboards_detail: "baseboards_detail",
  cabinets_detail: "cabinets_exterior_detail",
};

function pushUniqueAddon(addonIds: string[], id: string) {
  if (!addonIds.includes(id)) addonIds.push(id);
}

function applySelectedAddOns(
  f: BookingIntakeEstimateFactors,
  selected: readonly BookingAddOnToken[],
) {
  const norm = normalizeBookingAddOnsForPayload([...selected]);
  for (const t of norm) {
    const mapped = ADDON_TOKEN_TO_ID[t as BookingAddOnToken];
    if (mapped) pushUniqueAddon(f.addonIds, mapped);
  }
}

function applyDeepCleanFocus(
  f: BookingIntakeEstimateFactors,
  focus: BookingDeepCleanFocus,
) {
  switch (focus) {
    case "whole_home_reset":
      f.carpetPercent = "51_75";
      f.glassShowers = maxGlass(f.glassShowers, "one");
      break;
    case "kitchen_bath_priority":
      f.kitchenIntensity = "heavy_use";
      f.bathroomComplexity = "heavy_detailing";
      f.kitchenCondition = "heavy_grease";
      f.bathroomCondition = "heavy_scale";
      f.glassShowers = maxGlass(f.glassShowers, "one");
      break;
    case "high_touch_detail":
      f.glassShowers = "multiple";
      f.floorVisibility = maxFloor(f.floorVisibility, "some_obstacles");
      pushUniqueAddon(f.addonIds, "interior_windows");
      break;
    default:
      break;
  }
}

function applyMoveTransition(
  f: BookingIntakeEstimateFactors,
  transition: BookingTransitionState,
) {
  switch (transition) {
    case "empty_home":
      f.occupancyState = "vacant";
      f.floorVisibility = maxFloor(f.floorVisibility, "mostly_clear");
      break;
    case "lightly_furnished":
      f.occupancyState = maxOcc(f.occupancyState, "occupied_normal");
      f.floorVisibility = maxFloor(f.floorVisibility, "some_obstacles");
      break;
    case "fully_furnished":
      f.occupancyState = "occupied_cluttered";
      f.floorVisibility = "lots_of_items";
      break;
    default:
      break;
  }
}

function applyAppliancePresence(
  f: BookingIntakeEstimateFactors,
  tokens: readonly BookingAppliancePresenceToken[],
) {
  const norm = normalizeBookingAppliancePresenceForPayload([...tokens]);
  for (const t of norm) {
    if (t === "refrigerator_present") pushUniqueAddon(f.addonIds, "inside_fridge");
    if (t === "oven_present") pushUniqueAddon(f.addonIds, "inside_oven");
    if (t === "dishwasher_present") pushUniqueAddon(f.addonIds, "dish_wash_load");
    if (t === "washer_dryer_present") pushUniqueAddon(f.addonIds, "laundry_fold");
  }
}

const SURFACE_DETAIL_ALLOWED = new Set<string>([
  "interior_glass",
  "heavy_mirrors",
  "built_ins",
  "detailed_trim",
  "many_touchpoints",
]);

export function normalizeSurfaceDetailTokens(
  tokens: readonly BookingSurfaceDetailToken[],
): string[] {
  const out = tokens.filter((x) => SURFACE_DETAIL_ALLOWED.has(x));
  return [...new Set(out)].sort();
}

/**
 * Derives legacy estimator enum slots from layered intake so the web payload matches
 * `sanitizePublicIntakeEstimateFactors` (services/api/.../estimate-factors-sanitize.ts).
 */
function syncLegacyPublicEstimateTokensFromLayered(
  f: BookingIntakeEstimateFactors,
): void {
  f.clutterLevel =
    f.clutterAccess === "mostly_clear"
      ? "light"
      : f.clutterAccess === "moderate_clutter"
        ? "moderate"
        : "heavy";
  f.kitchenCondition =
    f.kitchenIntensity === "light_use"
      ? "light"
      : f.kitchenIntensity === "heavy_use"
        ? "heavy_grease"
        : "normal";
  f.bathroomCondition =
    f.bathroomComplexity === "heavy_detailing" ? "heavy_scale" : "normal";
  switch (f.lastProCleanRecency) {
    case "within_30_days":
      f.lastProfessionalClean = "under_2_weeks";
      break;
    case "days_30_90":
      f.lastProfessionalClean = "1_3_months";
      break;
    case "days_90_plus":
      f.lastProfessionalClean = "6_plus_months";
      break;
    default:
      f.lastProfessionalClean = "not_sure";
  }
  f.firstTimeWithServelink = f.primaryIntent === "reset_level" ? "yes" : "no";
  f.petPresence =
    f.petImpact === "none" ? "none" : f.petImpact === "light" ? "one" : "multiple";
  f.occupancyState =
    f.occupancyLevel === "ppl_5_plus" ? "occupied_cluttered" : "occupied_normal";
  f.carpetPercent =
    f.floorMix === "mostly_hard"
      ? "0_25"
      : f.floorMix === "mostly_carpet"
        ? "76_100"
        : "26_50";

  let floorVisibility = f.floorVisibility;
  if (f.layoutType === "open_plan") {
    floorVisibility = "mostly_clear";
  } else if (f.layoutType === "segmented") {
    if (floorVisibility === "mostly_clear") {
      floorVisibility = "some_obstacles";
    }
  }
  f.floorVisibility = floorVisibility;

  let glass = f.glassShowers;
  if (
    f.surfaceDetailTokens.includes("interior_glass") ||
    f.surfaceDetailTokens.includes("heavy_mirrors")
  ) {
    if (glass === "none" || glass === "not_sure") {
      glass = "one";
    }
  }
  f.glassShowers = glass;

  if (f.petImpact !== "none") {
    f.petShedding =
      f.petImpact === "light" ? "low" : f.petImpact === "heavy" ? "high" : "medium";
  } else {
    delete f.petShedding;
  }
}

/**
 * Builds the full `estimateFactors` object required by `CreateBookingDirectionIntakeDto` validation.
 */
export function buildIntakeEstimateFactorsFromBookingHomeState(
  state: Pick<
    BookingFlowState,
    | "serviceId"
    | "selectedAddOns"
    | "deepCleanFocus"
    | "transitionState"
    | "appliancePresence"
    | "pets"
    | "halfBathrooms"
    | "intakeFloors"
    | "intakeStairsFlights"
    | "floorMix"
    | "layoutType"
    | "occupancyLevel"
    | "childrenInHome"
    | "petImpactLevel"
    | "overallLaborCondition"
    | "kitchenIntensity"
    | "bathroomComplexity"
    | "clutterAccess"
    | "surfaceDetailTokens"
    | "primaryIntent"
    | "lastProCleanRecency"
    | "firstTimeVisitProgram"
    | "recurringCadenceIntent"
  >,
): BookingIntakeEstimateFactors {
  const f: BookingIntakeEstimateFactors = {
    ...BOOKING_INTAKE_DEFAULT_ESTIMATE_FACTORS,
    addonIds: [...BOOKING_INTAKE_DEFAULT_ESTIMATE_FACTORS.addonIds],
  };

  f.halfBathrooms =
    state.halfBathrooms as BookingIntakeEstimateFactors["halfBathrooms"];
  f.floors = state.intakeFloors as BookingIntakeEstimateFactors["floors"];
  f.stairsFlights =
    state.intakeStairsFlights as BookingIntakeEstimateFactors["stairsFlights"];
  f.floorMix = state.floorMix as BookingIntakeEstimateFactors["floorMix"];
  f.layoutType = state.layoutType as BookingIntakeEstimateFactors["layoutType"];
  f.occupancyLevel =
    state.occupancyLevel as BookingIntakeEstimateFactors["occupancyLevel"];
  f.childrenInHome =
    state.childrenInHome as BookingIntakeEstimateFactors["childrenInHome"];
  f.petImpact = state.petImpactLevel as BookingIntakeEstimateFactors["petImpact"];
  f.overallLaborCondition = state.overallLaborCondition;
  f.kitchenIntensity = state.kitchenIntensity;
  f.bathroomComplexity = state.bathroomComplexity;
  f.clutterAccess = state.clutterAccess;
  f.surfaceDetailTokens = normalizeSurfaceDetailTokens(state.surfaceDetailTokens);
  f.primaryIntent = state.primaryIntent;
  f.lastProCleanRecency = state.lastProCleanRecency;
  f.firstTimeVisitProgram = state.firstTimeVisitProgram;
  f.recurringCadenceIntent = state.recurringCadenceIntent;

  applySelectedAddOns(f, state.selectedAddOns);

  if (isDeepCleaningBookingServiceId(state.serviceId)) {
    applyDeepCleanFocus(f, state.deepCleanFocus);
  }

  if (isBookingMoveTransitionServiceId(state.serviceId)) {
    applyMoveTransition(f, state.transitionState);
    applyAppliancePresence(f, state.appliancePresence);
  }

  if (state.petImpactLevel === "none" && (state.pets ?? "").trim()) {
    f.petImpact = "light";
  }

  syncLegacyPublicEstimateTokensFromLayered(f);

  f.addonIds = [...new Set(f.addonIds)].sort();

  return { ...f };
}
