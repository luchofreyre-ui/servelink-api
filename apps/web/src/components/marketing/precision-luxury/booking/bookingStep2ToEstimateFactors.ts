/**
 * Canonical Step 2 (home details) → `EstimateFactorsDto` mapping for public intake.
 *
 * MUST stay aligned with:
 * - `services/api/.../dto/estimate-factors.dto.ts` + `estimate-factor-enums.ts`
 * - `services/api/.../estimate-factors-sanitize.ts` `DEFAULT_PUBLIC_FUNNEL_ESTIMATE_FACTORS`
 *
 * Mapping tables (stable, documented):
 *
 * A) `condition` (overall home feel)
 * - light_upkeep      → lastPro 2_4_weeks, clutter light, kitchen/bath light, occupancy occupied_normal, floor mostly_clear
 * - standard_lived_in → lastPro 1_3_months, clutter light, kitchen/bath normal
 * - heavy_buildup     → lastPro 6_plus_months, clutter heavy, kitchen heavy_grease, bath heavy_scale, occupancy occupied_cluttered, floor lots_of_items
 * - move_in_out_reset → lastPro 6_plus_months, clutter moderate, kitchen/bath normal, occupancy vacant, floor mostly_clear
 *
 * B) `problemAreas` (merge; never downgrade severity)
 * - kitchen_grease   → kitchenCondition heavy_grease
 * - bathroom_buildup → bathroomCondition heavy_scale
 * - pet_hair       → petPresence one, petShedding high
 * - heavy_dust     → clutter at least moderate (bump one step if lighter)
 *
 * C) `surfaceComplexity`
 * - minimal_furnishings → floorVisibility mostly_clear (min)
 * - average_furnishings → floorVisibility at least some_obstacles; clutter at least light
 * - dense_layout        → floorVisibility lots_of_items; clutter at least moderate; occupancy at least occupied_cluttered
 *
 * D) `scopeIntensity`
 * - targeted_touch_up / full_home_refresh → firstTimeWithServelink no
 * - detail_heavy      → firstTimeWithServelink yes; clutter at least moderate
 *
 * E) `selectedAddOns` (marketing token → estimator `addonIds`)
 * - inside_fridge / inside_oven / interior_windows / baseboards_detail unchanged
 * - cabinets_detail → cabinets_exterior_detail (server token)
 *
 * F) `deepCleanFocus` (only when service is deep clean)
 * - whole_home_reset     → carpetPercent 51_75; glassShowers at least one
 * - kitchen_bath_priority → kitchen heavy_grease, bath heavy_scale, glass at least one
 * - high_touch_detail    → glassShowers multiple; interior_windows add-on; floor at least some_obstacles
 *
 * G) Move service: `transitionState` + `appliancePresence`
 * - empty_home / lightly_furnished / fully_furnished → occupancy + floorVisibility as above
 * - refrigerator_present → inside_fridge; oven_present → inside_oven; dishwasher_present → dish_wash_load; washer_dryer_present → laundry_fold
 *
 * H) Free-text `pets` (when problemAreas does not already set pet hair)
 * - non-empty → petPresence one (or multiple if text suggests 2+ pets), shedding medium/high
 */

import type {
  BookingAddOnToken,
  BookingAppliancePresenceToken,
  BookingDeepCleanFocus,
  BookingFlowState,
  BookingHomeCondition,
  BookingProblemAreaToken,
  BookingScopeIntensity,
  BookingSurfaceComplexity,
  BookingTransitionState,
} from "./bookingFlowTypes";
import {
  isBookingMoveTransitionServiceId,
  isDeepCleaningBookingServiceId,
} from "./bookingDeepClean";
import {
  normalizeBookingAddOnsForPayload,
  normalizeBookingAppliancePresenceForPayload,
  normalizeBookingProblemAreasForPayload,
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
};

/** Higher rank = heavier visit context for estimator factors. */
const CLUTTER_RANK: Record<BookingIntakeEstimateFactors["clutterLevel"], number> = {
  minimal: 0,
  light: 1,
  not_sure: 2,
  moderate: 3,
  heavy: 4,
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

function maxClutter(
  a: BookingIntakeEstimateFactors["clutterLevel"],
  b: BookingIntakeEstimateFactors["clutterLevel"],
): BookingIntakeEstimateFactors["clutterLevel"] {
  return CLUTTER_RANK[a] >= CLUTTER_RANK[b] ? a : b;
}

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

function applyCondition(
  f: BookingIntakeEstimateFactors,
  condition: BookingHomeCondition,
) {
  switch (condition) {
    case "light_upkeep":
      f.lastProfessionalClean = "2_4_weeks";
      f.clutterLevel = "light";
      f.kitchenCondition = "light";
      f.bathroomCondition = "light";
      f.occupancyState = "occupied_normal";
      f.floorVisibility = "mostly_clear";
      break;
    case "standard_lived_in":
      f.lastProfessionalClean = "1_3_months";
      f.clutterLevel = "light";
      f.kitchenCondition = "normal";
      f.bathroomCondition = "normal";
      break;
    case "heavy_buildup":
      f.lastProfessionalClean = "6_plus_months";
      f.clutterLevel = "heavy";
      f.kitchenCondition = "heavy_grease";
      f.bathroomCondition = "heavy_scale";
      f.occupancyState = "occupied_cluttered";
      f.floorVisibility = "lots_of_items";
      break;
    case "move_in_out_reset":
      f.lastProfessionalClean = "6_plus_months";
      f.clutterLevel = "moderate";
      f.kitchenCondition = "normal";
      f.bathroomCondition = "normal";
      f.occupancyState = "vacant";
      f.floorVisibility = "mostly_clear";
      break;
    default:
      break;
  }
}

function applyProblemAreas(
  f: BookingIntakeEstimateFactors,
  tokens: readonly BookingProblemAreaToken[],
) {
  const set = new Set(tokens);
  if (set.has("kitchen_grease")) {
    f.kitchenCondition = "heavy_grease";
  }
  if (set.has("bathroom_buildup")) {
    f.bathroomCondition = "heavy_scale";
  }
  if (set.has("pet_hair")) {
    f.petPresence = "one";
    f.petShedding = "high";
  }
  if (set.has("heavy_dust")) {
    f.clutterLevel = maxClutter(f.clutterLevel, "moderate");
  }
}

function applySurface(
  f: BookingIntakeEstimateFactors,
  surface: BookingSurfaceComplexity,
) {
  switch (surface) {
    case "minimal_furnishings":
      f.floorVisibility = maxFloor(f.floorVisibility, "mostly_clear");
      break;
    case "average_furnishings":
      f.floorVisibility = maxFloor(f.floorVisibility, "some_obstacles");
      f.clutterLevel = maxClutter(f.clutterLevel, "light");
      break;
    case "dense_layout":
      f.floorVisibility = "lots_of_items";
      f.clutterLevel = maxClutter(f.clutterLevel, "moderate");
      f.occupancyState = maxOcc(f.occupancyState, "occupied_cluttered");
      break;
    default:
      break;
  }
}

function applyScope(f: BookingIntakeEstimateFactors, scope: BookingScopeIntensity) {
  switch (scope) {
    case "targeted_touch_up":
    case "full_home_refresh":
      f.firstTimeWithServelink = "no";
      break;
    case "detail_heavy":
      f.firstTimeWithServelink = "yes";
      f.clutterLevel = maxClutter(f.clutterLevel, "moderate");
      break;
    default:
      break;
  }
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

function applyPetsFreeText(
  f: BookingIntakeEstimateFactors,
  petsRaw: string,
  petHairFromProblems: boolean,
) {
  if (petHairFromProblems) return;
  const t = petsRaw.trim();
  if (!t) return;
  const multi = /\b(two|three|2|3|multiple|several)\b/i.test(t);
  f.petPresence = multi ? "multiple" : "one";
  f.petShedding = multi ? "high" : "medium";
}

/**
 * Builds the full `estimateFactors` object required by `CreateBookingDirectionIntakeDto` validation.
 */
export function buildIntakeEstimateFactorsFromBookingHomeState(
  state: Pick<
    BookingFlowState,
    | "serviceId"
    | "condition"
    | "problemAreas"
    | "surfaceComplexity"
    | "scopeIntensity"
    | "selectedAddOns"
    | "deepCleanFocus"
    | "transitionState"
    | "appliancePresence"
    | "pets"
  >,
): BookingIntakeEstimateFactors {
  const f: BookingIntakeEstimateFactors = {
    ...BOOKING_INTAKE_DEFAULT_ESTIMATE_FACTORS,
    addonIds: [...BOOKING_INTAKE_DEFAULT_ESTIMATE_FACTORS.addonIds],
  };

  /** Surface + scope before `condition` so move/reset occupancy can override dense-layout bumps. */
  applySurface(f, state.surfaceComplexity);
  applyScope(f, state.scopeIntensity);
  applyCondition(f, state.condition);

  const problemNorm = normalizeBookingProblemAreasForPayload([
    ...state.problemAreas,
  ]);
  applyProblemAreas(f, problemNorm);

  applySelectedAddOns(f, state.selectedAddOns);

  if (isDeepCleaningBookingServiceId(state.serviceId)) {
    applyDeepCleanFocus(f, state.deepCleanFocus);
  }

  if (isBookingMoveTransitionServiceId(state.serviceId)) {
    applyMoveTransition(f, state.transitionState);
    applyAppliancePresence(f, state.appliancePresence);
  }

  applyPetsFreeText(f, state.pets, problemNorm.includes("pet_hair"));

  if (f.petPresence !== "none" && f.petShedding == null) {
    f.petShedding = "medium";
  }

  f.addonIds = [...new Set(f.addonIds)].sort();

  const result: BookingIntakeEstimateFactors = { ...f };
  if (result.petPresence === "none") {
    delete result.petShedding;
  }

  return result;
}
