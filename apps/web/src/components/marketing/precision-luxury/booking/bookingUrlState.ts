import type {
  BookingAddOnToken,
  BookingAppliancePresenceToken,
  BookingDeepCleanFocus,
  BookingDeepCleanProgramChoice,
  BookingFirstTimePostEstimateVisitChoice,
  BookingFlowState,
  BookingFrequencyOption,
  BookingHomeCondition,
  BookingProblemAreaToken,
  BookingPublicPath,
  BookingScopeIntensity,
  BookingStepId,
  BookingSurfaceComplexity,
  BookingSurfaceDetailToken,
  BookingTimeOption,
  CustomerIntent,
  BookingTransitionState,
} from "./bookingFlowTypes";
import { defaultBookingFlowState } from "./bookingFlowData";
import {
  isBookingMoveTransitionServiceId,
  isDeepCleaningBookingServiceId,
} from "./bookingDeepClean";
import {
  normalizeBookingBathroomsParam,
  normalizeBookingBedroomsParam,
} from "./bookingEstimateFactorFields";
import {
  getBookingDefaultServiceId,
  isValidBookingServiceId,
} from "./bookingServiceCatalog";
import {
  BOOKING_URL_PUBLIC_PATH_FIRST_RECURRING,
  BOOKING_URL_PUBLIC_PATH_ONE_TIME,
  BOOKING_URL_PUBLIC_PATH_RECURRING_GATE,
  PUBLIC_BOOK_INTERNAL_FIRST_TIME,
  PUBLIC_BOOK_INTERNAL_MOVE,
  PUBLIC_BOOK_INTERNAL_RECURRING,
  isPublicAnonymousBookingServiceId,
} from "./publicBookingTaxonomy";
import { normalizeBookingUpsellIds } from "./bookingUpsells";

const validSteps: BookingStepId[] = [
  "service",
  "intent",
  "home",
  "location",
  "review",
  "schedule",
];
const validFrequencies: BookingFrequencyOption[] = [
  "Weekly",
  "Bi-Weekly",
  "Monthly",
  "One-Time",
];
const validTimes: BookingTimeOption[] = [
  "Weekday Morning",
  "Weekday Afternoon",
  "Friday",
  "Saturday",
];

const STEP_RANK: Record<BookingStepId, number> = {
  service: 0,
  intent: 1,
  home: 2,
  location: 3,
  review: 4,
  schedule: 5,
};

/** Serialized when the customer is on the recurring auth gate (never `service=recurring`). */
export const BOOKING_URL_PUBLIC_PATH = "pubPath";

export const BOOKING_URL_SERVICE_LOC_ZIP = "locZip";
export const BOOKING_URL_SERVICE_LOC_ADDR = "locAddr";
export const BOOKING_URL_SERVICE_LOC_STREET = "locStreet";
export const BOOKING_URL_SERVICE_LOC_CITY = "locCity";
export const BOOKING_URL_SERVICE_LOC_STATE = "locState";
export const BOOKING_URL_SERVICE_LOC_UNIT = "locUnit";
export const BOOKING_URL_CUSTOMER_INTENT = "intent";

function isValidStep(value: string | null): value is BookingStepId {
  return !!value && validSteps.includes(value as BookingStepId);
}

function isValidFrequency(value: string | null): value is BookingFrequencyOption {
  return !!value && validFrequencies.includes(value as BookingFrequencyOption);
}

function isValidTime(value: string | null): value is BookingTimeOption {
  return !!value && validTimes.includes(value as BookingTimeOption);
}

function isValidCustomerIntent(value: string | null): value is CustomerIntent {
  return (
    value === "RESET" ||
    value === "MAINTAIN" ||
    value === "TOP_UP" ||
    value === "TRANSACTIONAL"
  );
}

function parseCustomerIntentParam(value: string | null): CustomerIntent | undefined {
  return isValidCustomerIntent(value) ? value : undefined;
}

function getParamValue(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);
  return value ?? "";
}

/** Aligns with intake DTO comma stripping + trim. */
export function normalizeBookingHomeSizeParam(raw: string): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/,/g, "").trim();
}

export function normalizeBookingPetsParam(raw: string): string {
  return String(raw ?? "").trim();
}

const BOOKING_HOME_CONDITION_VALUES = new Set<BookingHomeCondition>([
  "light_upkeep",
  "standard_lived_in",
  "heavy_buildup",
  "move_in_out_reset",
]);

const BOOKING_PROBLEM_AREA_VALUES = new Set<BookingProblemAreaToken>([
  "kitchen_grease",
  "bathroom_buildup",
  "pet_hair",
  "heavy_dust",
]);

const BOOKING_SURFACE_COMPLEXITY_VALUES = new Set<BookingSurfaceComplexity>([
  "minimal_furnishings",
  "average_furnishings",
  "dense_layout",
]);

const BOOKING_SCOPE_INTENSITY_VALUES = new Set<BookingScopeIntensity>([
  "targeted_touch_up",
  "full_home_refresh",
  "detail_heavy",
]);

const BOOKING_ADD_ON_TOKEN_VALUES = new Set<BookingAddOnToken>([
  "inside_fridge",
  "inside_oven",
  "interior_windows",
  "baseboards_detail",
  "cabinets_detail",
]);

const BOOKING_DEEP_CLEAN_FOCUS_VALUES = new Set<BookingDeepCleanFocus>([
  "whole_home_reset",
  "kitchen_bath_priority",
  "high_touch_detail",
]);

const BOOKING_TRANSITION_STATE_VALUES = new Set<BookingTransitionState>([
  "empty_home",
  "lightly_furnished",
  "fully_furnished",
]);

const BOOKING_APPLIANCE_PRESENCE_VALUES = new Set<BookingAppliancePresenceToken>([
  "refrigerator_present",
  "oven_present",
  "dishwasher_present",
  "washer_dryer_present",
]);

/**
 * URL keys for estimator depth (Phase 1). Omitted params rehydrate to flow defaults
 * (`standard_lived_in`, `[]`, `average_furnishings`) — see `parseIntakeFieldsFromSearchParams`.
 */
export const BOOKING_URL_HOME_CONDITION = "homeCondition";
export const BOOKING_URL_HOME_PROBLEMS = "homeProblems";
export const BOOKING_URL_HOME_SURFACE = "homeSurface";
/** Non-default scope intensity only (`full_home_refresh` omitted). */
export const BOOKING_URL_HOME_SCOPE = "homeScope";
/** Sorted known add-on tokens, comma-separated. */
export const BOOKING_URL_HOME_ADDONS = "homeAddOns";
/** Client-only selected enhancement ids, comma-separated; never sent to submit payload in V1. */
export const BOOKING_URL_UPSELLS = "upsells";
/** Deep-clean focus; only when service is deep clean and value is non-default. */
export const BOOKING_URL_DEEP_CLEAN_FOCUS = "dcFocus";
/** Move transition occupancy; only when service is move-in/move-out and non-default. */
export const BOOKING_URL_TRANSITION_STATE = "mvSetup";
/** Move transition appliances; sorted known tokens when service is move-in/move-out. */
export const BOOKING_URL_APPLIANCE_PRESENCE = "mvAppliances";

export function parseBookingHomeConditionParam(
  raw: string | null | undefined,
): BookingHomeCondition {
  const v = String(raw ?? "").trim();
  if (BOOKING_HOME_CONDITION_VALUES.has(v as BookingHomeCondition)) {
    return v as BookingHomeCondition;
  }
  return defaultBookingFlowState.condition;
}

export function parseBookingProblemAreasParam(
  raw: string | null | undefined,
): BookingProblemAreaToken[] {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  const out = new Set<BookingProblemAreaToken>();
  for (const p of parts) {
    if (BOOKING_PROBLEM_AREA_VALUES.has(p as BookingProblemAreaToken)) {
      out.add(p as BookingProblemAreaToken);
    }
  }
  return [...out].sort();
}

export function parseBookingSurfaceComplexityParam(
  raw: string | null | undefined,
): BookingSurfaceComplexity {
  const v = String(raw ?? "").trim();
  if (BOOKING_SURFACE_COMPLEXITY_VALUES.has(v as BookingSurfaceComplexity)) {
    return v as BookingSurfaceComplexity;
  }
  return defaultBookingFlowState.surfaceComplexity;
}

export function parseBookingScopeIntensityParam(
  raw: string | null | undefined,
): BookingScopeIntensity {
  const v = String(raw ?? "").trim();
  if (BOOKING_SCOPE_INTENSITY_VALUES.has(v as BookingScopeIntensity)) {
    return v as BookingScopeIntensity;
  }
  return defaultBookingFlowState.scopeIntensity;
}

export function parseBookingAddOnsParam(
  raw: string | null | undefined,
): BookingAddOnToken[] {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  const out = new Set<BookingAddOnToken>();
  for (const p of parts) {
    if (BOOKING_ADD_ON_TOKEN_VALUES.has(p as BookingAddOnToken)) {
      out.add(p as BookingAddOnToken);
    }
  }
  return [...out].sort();
}

export function parseBookingUpsellIdsParam(
  raw: string | null | undefined,
  intent: CustomerIntent | undefined,
): string[] {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  return normalizeBookingUpsellIds(parts, intent);
}

/** Dedupe, filter unknown tokens, sort — stable for preview/submit request keys. */
export function normalizeBookingProblemAreasForPayload(
  areas: readonly BookingProblemAreaToken[],
): BookingProblemAreaToken[] {
  const out = new Set<BookingProblemAreaToken>();
  for (const a of areas) {
    if (BOOKING_PROBLEM_AREA_VALUES.has(a)) out.add(a);
  }
  return [...out].sort();
}

/** Dedupe, filter unknown tokens, sort — stable for preview/submit request keys. */
export function normalizeBookingAddOnsForPayload(
  tokens: readonly BookingAddOnToken[],
): BookingAddOnToken[] {
  const out = new Set<BookingAddOnToken>();
  for (const t of tokens) {
    if (BOOKING_ADD_ON_TOKEN_VALUES.has(t)) out.add(t);
  }
  return [...out].sort();
}

export function parseBookingDeepCleanFocusParam(
  raw: string | null | undefined,
): BookingDeepCleanFocus {
  const v = String(raw ?? "").trim();
  if (BOOKING_DEEP_CLEAN_FOCUS_VALUES.has(v as BookingDeepCleanFocus)) {
    return v as BookingDeepCleanFocus;
  }
  return defaultBookingFlowState.deepCleanFocus;
}

export function parseBookingTransitionStateParam(
  raw: string | null | undefined,
): BookingTransitionState {
  const v = String(raw ?? "").trim();
  if (BOOKING_TRANSITION_STATE_VALUES.has(v as BookingTransitionState)) {
    return v as BookingTransitionState;
  }
  return defaultBookingFlowState.transitionState;
}

export function parseBookingAppliancePresenceParam(
  raw: string | null | undefined,
): BookingAppliancePresenceToken[] {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  const out = new Set<BookingAppliancePresenceToken>();
  for (const p of parts) {
    if (BOOKING_APPLIANCE_PRESENCE_VALUES.has(p as BookingAppliancePresenceToken)) {
      out.add(p as BookingAppliancePresenceToken);
    }
  }
  return [...out].sort();
}

/** Dedupe, filter unknown tokens, sort — stable for preview/submit request keys. */
export function normalizeBookingAppliancePresenceForPayload(
  tokens: readonly BookingAppliancePresenceToken[],
): BookingAppliancePresenceToken[] {
  const out = new Set<BookingAppliancePresenceToken>();
  for (const t of tokens) {
    if (BOOKING_APPLIANCE_PRESENCE_VALUES.has(t)) out.add(t);
  }
  return [...out].sort();
}

export function isHomeDetailsComplete(
  s: Pick<BookingFlowState, "homeSize" | "bedrooms" | "bathrooms">,
): boolean {
  const size = normalizeBookingHomeSizeParam(s.homeSize);
  return (
    !!size &&
    Number(size) >= 300 &&
    !!String(s.bedrooms ?? "").trim() &&
    !!String(s.bathrooms ?? "").trim()
  );
}

export function isScheduleDetailsComplete(
  s: Pick<BookingFlowState, "frequency" | "preferredTime">,
): boolean {
  return !!String(s.frequency ?? "").trim() && !!String(s.preferredTime ?? "").trim();
}

/** @deprecated Prefer {@link isPublicAnonymousPreferredWindowComplete} for /book. */
export const isCadenceComplete = isScheduleDetailsComplete;

/** Anonymous public funnel: timing is chosen after estimate from team slots (no early preference). */
export function isPublicAnonymousPreferredWindowComplete(
  _s: Pick<BookingFlowState, "preferredTime">,
): boolean {
  return true;
}

export function normalizeBookingServiceLocationZipParam(raw: string): string {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, "");
}

function normalizeLocationText(raw: string | undefined): string {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export function isServiceLocationComplete(
  s: Pick<
    BookingFlowState,
    | "serviceLocationZip"
    | "serviceLocationStreet"
    | "serviceLocationCity"
    | "serviceLocationState"
    | "serviceLocationUnit"
    | "serviceLocationAddressLine"
  >,
): boolean {
  const z = normalizeBookingServiceLocationZipParam(s.serviceLocationZip);
  const street = normalizeLocationText(s.serviceLocationStreet);
  const city = normalizeLocationText(s.serviceLocationCity);
  const state = normalizeLocationText(s.serviceLocationState);
  const legacy = normalizeLocationText(s.serviceLocationAddressLine);
  const effectiveStreet = street || legacy;
  return (
    z.length >= 5 &&
    effectiveStreet.length >= 3 &&
    city.length >= 2 &&
    state.length >= 2
  );
}

/** Matches `PublicServiceLocationDto` on the booking-direction-intake API. */
export type PublicServiceLocationPayload = {
  street: string;
  city: string;
  state: string;
  zip: string;
  unit?: string;
};

export function buildPublicServiceLocationPayload(
  s: Pick<
    BookingFlowState,
    | "serviceLocationZip"
    | "serviceLocationStreet"
    | "serviceLocationCity"
    | "serviceLocationState"
    | "serviceLocationUnit"
    | "serviceLocationAddressLine"
  >,
): PublicServiceLocationPayload | null {
  if (!isServiceLocationComplete(s)) return null;
  const zip = normalizeBookingServiceLocationZipParam(s.serviceLocationZip);
  const street = normalizeLocationText(s.serviceLocationStreet);
  const city = normalizeLocationText(s.serviceLocationCity);
  const state = normalizeLocationText(s.serviceLocationState);
  const legacy = normalizeLocationText(s.serviceLocationAddressLine);
  const effectiveStreet = street || legacy;
  const unitRaw = normalizeLocationText(s.serviceLocationUnit);
  const out: PublicServiceLocationPayload = {
    street: effectiveStreet,
    city,
    state,
    zip,
  };
  if (unitRaw.length > 0) out.unit = unitRaw;
  return out;
}

/** Step 4 (Choose a time): team + concrete slot chosen (hold created client-side just before confirm). */
export function isPublicScheduleSelectionComplete(
  s: Pick<
    BookingFlowState,
    | "schedulingBookingId"
    | "selectedTeamId"
    | "selectedSlotStart"
    | "selectedSlotEnd"
  >,
): boolean {
  return (
    !!String(s.schedulingBookingId ?? "").trim() &&
    !!String(s.selectedTeamId ?? "").trim() &&
    !!String(s.selectedSlotStart ?? "").trim() &&
    !!String(s.selectedSlotEnd ?? "").trim()
  );
}

/** Highest step whose prerequisites are satisfied by the given state (structural only). */
export function computeMaxReadyStep(s: BookingFlowState): BookingStepId {
  if (s.bookingPublicPath === "recurring_auth_gate") return "service";
  if (!isPublicAnonymousBookingServiceId(s.serviceId)) return "service";
  if (!s.intent) return "intent";
  if (!isHomeDetailsComplete(s)) {
    return "home";
  }
  if (!isServiceLocationComplete(s)) return "location";
  if (!String(s.schedulingBookingId ?? "").trim()) return "review";
  return "schedule";
}

/** Keeps the visible step from sitting ahead of structural readiness (in-app edits, not only URL). */
export function clampBookingStepToStructuralMax(
  s: BookingFlowState,
): BookingFlowState {
  const max = computeMaxReadyStep(s);
  if (STEP_RANK[s.step] > STEP_RANK[max]) {
    return { ...s, step: max };
  }
  return s;
}

/**
 * Step 1 only: merge a new `serviceId` and the implied `deepCleanProgram`.
 * Preserves neutral home + schedule fields; clears deep-clean-only program when leaving deep clean.
 * (Review certainty / submit flags are reset in the client shell, not here.)
 */
export function applyServiceChangeToBookingFlowState(
  prev: BookingFlowState,
  nextServiceId: string,
): BookingFlowState {
  const deepCleanProgram: BookingDeepCleanProgramChoice | "" =
    isDeepCleaningBookingServiceId(nextServiceId)
      ? prev.deepCleanProgram === "phased_3_visit" ||
          prev.deepCleanProgram === "single_visit"
        ? prev.deepCleanProgram
        : "single_visit"
      : "";

  const deepCleanFocus = isDeepCleaningBookingServiceId(nextServiceId)
    ? isDeepCleaningBookingServiceId(prev.serviceId)
      ? prev.deepCleanFocus
      : defaultBookingFlowState.deepCleanFocus
    : defaultBookingFlowState.deepCleanFocus;

  const transitionState = isBookingMoveTransitionServiceId(nextServiceId)
    ? isBookingMoveTransitionServiceId(prev.serviceId)
      ? prev.transitionState
      : defaultBookingFlowState.transitionState
    : defaultBookingFlowState.transitionState;

  const appliancePresence = isBookingMoveTransitionServiceId(nextServiceId)
    ? isBookingMoveTransitionServiceId(prev.serviceId)
      ? prev.appliancePresence
      : defaultBookingFlowState.appliancePresence
    : defaultBookingFlowState.appliancePresence;

  const bookingPublicPath: BookingPublicPath =
    isBookingMoveTransitionServiceId(nextServiceId)
      ? "move_transition"
      : isDeepCleaningBookingServiceId(nextServiceId)
        ? "one_time_cleaning"
        : "one_time_cleaning";

  return {
    ...prev,
    serviceId: nextServiceId,
    bookingPublicPath,
    deepCleanProgram,
    deepCleanFocus,
    transitionState,
    appliancePresence,
    serviceLocationZip: "",
    serviceLocationStreet: "",
    serviceLocationCity: "",
    serviceLocationState: "",
    serviceLocationUnit: "",
    serviceLocationAddressLine: "",
    intent: undefined,
    selectedUpsellIds: [],
    firstTimePostEstimateVisitChoice: "",
    schedulingBookingId: "",
    schedulingIntakeId: "",
    selectedTeamId: "",
    selectedTeamDisplayName: "",
    availableTeams: [],
    availableWindows: [],
    selectedSlotId: "",
    selectedSlotStart: "",
    selectedSlotEnd: "",
    publicHoldId: "",
    schedulingConfirmed: false,
  };
}

/**
 * Merge `frequency` and/or `preferredTime` from explicit patch keys.
 * All other fields stay as-entered; step clamping is applied by the caller.
 */
export function applyScheduleFieldChangeToBookingFlowState(
  prev: BookingFlowState,
  patch: Partial<Pick<BookingFlowState, "frequency" | "preferredTime">>,
): BookingFlowState {
  return {
    ...prev,
    ...(patch.frequency !== undefined ? { frequency: patch.frequency } : {}),
    ...(patch.preferredTime !== undefined
      ? {
          preferredTime: patch.preferredTime,
          frequency: "One-Time" as BookingFlowState["frequency"],
        }
      : {}),
  };
}

export function applyServiceLocationFieldChangeToBookingFlowState(
  prev: BookingFlowState,
  patch: Partial<
    Pick<
      BookingFlowState,
      | "serviceLocationZip"
      | "serviceLocationStreet"
      | "serviceLocationCity"
      | "serviceLocationState"
      | "serviceLocationUnit"
      | "serviceLocationAddressLine"
    >
  >,
): BookingFlowState {
  return {
    ...prev,
    ...(patch.serviceLocationZip !== undefined
      ? {
          serviceLocationZip: normalizeBookingServiceLocationZipParam(
            patch.serviceLocationZip,
          ),
        }
      : {}),
    ...(patch.serviceLocationStreet !== undefined
      ? {
          serviceLocationStreet: normalizeLocationText(patch.serviceLocationStreet),
        }
      : {}),
    ...(patch.serviceLocationCity !== undefined
      ? {
          serviceLocationCity: normalizeLocationText(patch.serviceLocationCity),
        }
      : {}),
    ...(patch.serviceLocationState !== undefined
      ? {
          serviceLocationState: normalizeLocationText(patch.serviceLocationState),
        }
      : {}),
    ...(patch.serviceLocationUnit !== undefined
      ? {
          serviceLocationUnit: normalizeLocationText(patch.serviceLocationUnit),
        }
      : {}),
    ...(patch.serviceLocationAddressLine !== undefined
      ? {
          serviceLocationAddressLine: normalizeLocationText(
            patch.serviceLocationAddressLine,
          ),
        }
      : {}),
  };
}

const BOOKING_FIRST_TIME_POST_ESTIMATE_VALUES = new Set<
  BookingFirstTimePostEstimateVisitChoice
>(["", "one_visit", "two_visits", "three_visits", "convert_recurring"]);

export function parseBookingFirstTimePostEstimateVisitChoiceParam(
  raw: string | null | undefined,
): BookingFirstTimePostEstimateVisitChoice {
  const v = String(raw ?? "").trim();
  if (BOOKING_FIRST_TIME_POST_ESTIMATE_VALUES.has(v as BookingFirstTimePostEstimateVisitChoice)) {
    return v as BookingFirstTimePostEstimateVisitChoice;
  }
  return "";
}

export function applyFirstTimePostEstimateVisitChoiceToBookingFlowState(
  prev: BookingFlowState,
  choice: BookingFirstTimePostEstimateVisitChoice,
): BookingFlowState {
  const normalized = parseBookingFirstTimePostEstimateVisitChoiceParam(choice);
  const deepCleanProgram: BookingDeepCleanProgramChoice | "" =
    isDeepCleaningBookingServiceId(prev.serviceId)
      ? normalized === "three_visits"
        ? "phased_3_visit"
        : normalized === "" ||
            normalized === "one_visit" ||
            normalized === "two_visits" ||
            normalized === "convert_recurring"
          ? "single_visit"
          : prev.deepCleanProgram
      : "";

  return {
    ...prev,
    firstTimePostEstimateVisitChoice: normalized,
    ...(isDeepCleaningBookingServiceId(prev.serviceId)
      ? { deepCleanProgram }
      : {}),
    schedulingBookingId: "",
    schedulingIntakeId: "",
    selectedTeamId: "",
    selectedTeamDisplayName: "",
    availableTeams: [],
    availableWindows: [],
    selectedSlotId: "",
    selectedSlotStart: "",
    selectedSlotEnd: "",
    publicHoldId: "",
    schedulingConfirmed: false,
  };
}

/**
 * Step 2 only: merge home-detail fields present in `patch`.
 * Service, schedule, contact, and deep-clean program stay as-entered unless the caller clamps step.
 */
const BOOKING_SURFACE_DETAIL_FLOW_VALUES = new Set<BookingSurfaceDetailToken>([
  "interior_glass",
  "heavy_mirrors",
  "built_ins",
  "detailed_trim",
  "many_touchpoints",
]);

function normalizeBookingSurfaceDetailTokensForFlow(
  tokens: readonly BookingSurfaceDetailToken[],
): BookingSurfaceDetailToken[] {
  const out = tokens.filter((t) => BOOKING_SURFACE_DETAIL_FLOW_VALUES.has(t));
  return [...new Set(out)].sort();
}

export function applyHomeDetailsFieldChangeToBookingFlowState(
  prev: BookingFlowState,
  patch: Partial<
    Pick<
      BookingFlowState,
      | "homeSize"
      | "bedrooms"
      | "bathrooms"
      | "pets"
      | "condition"
      | "problemAreas"
      | "surfaceComplexity"
      | "scopeIntensity"
      | "selectedAddOns"
      | "selectedUpsellIds"
      | "deepCleanFocus"
      | "transitionState"
      | "appliancePresence"
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
      | "deepCleanProgram"
    >
  >,
): BookingFlowState {
  return {
    ...prev,
    ...(patch.homeSize !== undefined ? { homeSize: patch.homeSize } : {}),
    ...(patch.bedrooms !== undefined ? { bedrooms: patch.bedrooms } : {}),
    ...(patch.bathrooms !== undefined ? { bathrooms: patch.bathrooms } : {}),
    ...(patch.pets !== undefined ? { pets: patch.pets } : {}),
    ...(patch.condition !== undefined ? { condition: patch.condition } : {}),
    ...(patch.problemAreas !== undefined
      ? { problemAreas: normalizeBookingProblemAreasForPayload(patch.problemAreas) }
      : {}),
    ...(patch.surfaceComplexity !== undefined
      ? { surfaceComplexity: patch.surfaceComplexity }
      : {}),
    ...(patch.scopeIntensity !== undefined
      ? { scopeIntensity: patch.scopeIntensity }
      : {}),
    ...(patch.selectedAddOns !== undefined
      ? {
          selectedAddOns: normalizeBookingAddOnsForPayload(patch.selectedAddOns),
        }
      : {}),
    ...(patch.selectedUpsellIds !== undefined
      ? {
          selectedUpsellIds: normalizeBookingUpsellIds(
            patch.selectedUpsellIds,
            prev.intent,
          ),
        }
      : {}),
    ...(patch.deepCleanFocus !== undefined
      ? { deepCleanFocus: patch.deepCleanFocus }
      : {}),
    ...(patch.transitionState !== undefined
      ? { transitionState: patch.transitionState }
      : {}),
    ...(patch.appliancePresence !== undefined
      ? {
          appliancePresence: normalizeBookingAppliancePresenceForPayload(
            patch.appliancePresence,
          ),
        }
      : {}),
    ...(patch.halfBathrooms !== undefined ? { halfBathrooms: patch.halfBathrooms } : {}),
    ...(patch.intakeFloors !== undefined ? { intakeFloors: patch.intakeFloors } : {}),
    ...(patch.intakeStairsFlights !== undefined
      ? { intakeStairsFlights: patch.intakeStairsFlights }
      : {}),
    ...(patch.floorMix !== undefined ? { floorMix: patch.floorMix } : {}),
    ...(patch.layoutType !== undefined ? { layoutType: patch.layoutType } : {}),
    ...(patch.occupancyLevel !== undefined ? { occupancyLevel: patch.occupancyLevel } : {}),
    ...(patch.childrenInHome !== undefined ? { childrenInHome: patch.childrenInHome } : {}),
    ...(patch.petImpactLevel !== undefined ? { petImpactLevel: patch.petImpactLevel } : {}),
    ...(patch.overallLaborCondition !== undefined
      ? { overallLaborCondition: patch.overallLaborCondition }
      : {}),
    ...(patch.kitchenIntensity !== undefined ? { kitchenIntensity: patch.kitchenIntensity } : {}),
    ...(patch.bathroomComplexity !== undefined
      ? { bathroomComplexity: patch.bathroomComplexity }
      : {}),
    ...(patch.clutterAccess !== undefined ? { clutterAccess: patch.clutterAccess } : {}),
    ...(patch.surfaceDetailTokens !== undefined
      ? {
          surfaceDetailTokens: normalizeBookingSurfaceDetailTokensForFlow(
            patch.surfaceDetailTokens,
          ),
        }
      : {}),
    ...(patch.primaryIntent !== undefined ? { primaryIntent: patch.primaryIntent } : {}),
    ...(patch.lastProCleanRecency !== undefined
      ? { lastProCleanRecency: patch.lastProCleanRecency }
      : {}),
    ...(patch.firstTimeVisitProgram !== undefined
      ? { firstTimeVisitProgram: patch.firstTimeVisitProgram }
      : {}),
    ...(patch.recurringCadenceIntent !== undefined
      ? { recurringCadenceIntent: patch.recurringCadenceIntent }
      : {}),
    ...(patch.deepCleanProgram !== undefined ? { deepCleanProgram: patch.deepCleanProgram } : {}),
  };
}

/**
 * Review contact fields only: merge `customerName` and/or `customerEmail` when present in `patch`.
 * Service, home, schedule, and deep-clean program stay as-entered unless the caller clamps step.
 */
export function applyContactFieldChangeToBookingFlowState(
  prev: BookingFlowState,
  patch: Partial<Pick<BookingFlowState, "customerName" | "customerEmail">>,
): BookingFlowState {
  return {
    ...prev,
    ...(patch.customerName !== undefined
      ? { customerName: patch.customerName }
      : {}),
    ...(patch.customerEmail !== undefined
      ? { customerEmail: patch.customerEmail }
      : {}),
  };
}

function parseDeepCleanProgramParam(
  raw: string | null,
): BookingDeepCleanProgramChoice | "" {
  const v = (raw ?? "").trim();
  if (v === "phased_3_visit" || v === "phased") return "phased_3_visit";
  if (v === "single_visit" || v === "single") return "single_visit";
  return "";
}

/**
 * True when the URL carries booking shape beyond a cold `/book` entry
 * (so we may default the step to the deepest valid step when `step` is absent).
 */
export function hasUrlBookingShapeBeyondColdStart(
  searchParams: URLSearchParams,
): boolean {
  const shapeKeys = [
    "homeSize",
    "bedrooms",
    "bathrooms",
    "pets",
    BOOKING_URL_HOME_CONDITION,
    BOOKING_URL_HOME_PROBLEMS,
    BOOKING_URL_HOME_SURFACE,
    BOOKING_URL_HOME_SCOPE,
    BOOKING_URL_HOME_ADDONS,
    BOOKING_URL_UPSELLS,
    BOOKING_URL_DEEP_CLEAN_FOCUS,
    BOOKING_URL_TRANSITION_STATE,
    BOOKING_URL_APPLIANCE_PRESENCE,
    "frequency",
    "preferredTime",
    "dcProgram",
    BOOKING_URL_SERVICE_LOC_ZIP,
    BOOKING_URL_SERVICE_LOC_ADDR,
    BOOKING_URL_SERVICE_LOC_STREET,
    BOOKING_URL_SERVICE_LOC_CITY,
    BOOKING_URL_SERVICE_LOC_STATE,
    BOOKING_URL_SERVICE_LOC_UNIT,
    BOOKING_URL_PUBLIC_PATH,
    BOOKING_URL_CUSTOMER_INTENT,
  ];
  for (const k of shapeKeys) {
    if (getParamValue(searchParams, k).trim()) return true;
  }
  const svc = getParamValue(searchParams, "service").trim();
  if (svc && isValidBookingServiceId(svc) && svc !== getBookingDefaultServiceId()) {
    return true;
  }
  return false;
}

/**
 * Resolves `step` from the URL against structural readiness.
 * - Invalid / missing `step` + cold URL → default `service`.
 * - Invalid / missing `step` + shaped URL → deepest structurally valid step.
 * - Valid `step` → never above what data supports (clamp down only).
 */
export function resolveBookingStepFromUrl(
  searchParams: URLSearchParams,
  partial: BookingFlowState,
): BookingStepId {
  const maxStep = computeMaxReadyStep(partial);
  const rawStep = searchParams.get("step");
  const shaped = hasUrlBookingShapeBeyondColdStart(searchParams);

  if (!isValidStep(rawStep)) {
    return shaped ? maxStep : defaultBookingFlowState.step;
  }

  if (STEP_RANK[rawStep] > STEP_RANK[maxStep]) {
    return maxStep;
  }
  return rawStep;
}

export function buildBookingSearchParams(state: BookingFlowState) {
  const params = new URLSearchParams();

  params.set("step", state.step);
  params.set("service", state.serviceId.trim());
  if (state.intent) params.set(BOOKING_URL_CUSTOMER_INTENT, state.intent);
  if (state.bookingPublicPath === "recurring_auth_gate") {
    params.set(BOOKING_URL_PUBLIC_PATH, BOOKING_URL_PUBLIC_PATH_RECURRING_GATE);
  } else if (
    isDeepCleaningBookingServiceId(state.serviceId) &&
    state.bookingPublicPath === "first_time_with_recurring"
  ) {
    params.set(BOOKING_URL_PUBLIC_PATH, BOOKING_URL_PUBLIC_PATH_FIRST_RECURRING);
  } else if (
    isDeepCleaningBookingServiceId(state.serviceId) &&
    state.bookingPublicPath === "one_time_cleaning"
  ) {
    params.set(BOOKING_URL_PUBLIC_PATH, BOOKING_URL_PUBLIC_PATH_ONE_TIME);
  } else if (
    isBookingMoveTransitionServiceId(state.serviceId) &&
    state.bookingPublicPath === "move_transition"
  ) {
    params.set(BOOKING_URL_PUBLIC_PATH, "move");
  }

  const locZip = normalizeBookingServiceLocationZipParam(state.serviceLocationZip);
  if (locZip) params.set(BOOKING_URL_SERVICE_LOC_ZIP, locZip);
  const locStreet = normalizeLocationText(state.serviceLocationStreet);
  const locCity = normalizeLocationText(state.serviceLocationCity);
  const locState = normalizeLocationText(state.serviceLocationState);
  const locUnit = normalizeLocationText(state.serviceLocationUnit);
  const locAddr = normalizeLocationText(state.serviceLocationAddressLine);
  if (locStreet) params.set(BOOKING_URL_SERVICE_LOC_STREET, locStreet);
  if (locCity) params.set(BOOKING_URL_SERVICE_LOC_CITY, locCity);
  if (locState) params.set(BOOKING_URL_SERVICE_LOC_STATE, locState);
  if (locUnit) params.set(BOOKING_URL_SERVICE_LOC_UNIT, locUnit);
  if (locAddr && !locStreet) params.set(BOOKING_URL_SERVICE_LOC_ADDR, locAddr);

  const homeSize = normalizeBookingHomeSizeParam(state.homeSize);
  if (homeSize) params.set("homeSize", homeSize);
  if (state.bedrooms.trim()) params.set("bedrooms", state.bedrooms.trim());
  if (state.bathrooms.trim()) params.set("bathrooms", state.bathrooms.trim());
  const pets = normalizeBookingPetsParam(state.pets);
  if (pets) params.set("pets", pets);
  if (state.frequency) params.set("frequency", String(state.frequency).trim());
  if (state.preferredTime) {
    params.set("preferredTime", String(state.preferredTime).trim());
  }
  if (
    isDeepCleaningBookingServiceId(state.serviceId) &&
    state.deepCleanProgram
  ) {
    params.set("dcProgram", state.deepCleanProgram);
  }

  if (state.condition !== defaultBookingFlowState.condition) {
    params.set(BOOKING_URL_HOME_CONDITION, state.condition);
  }
  const problemsForUrl = normalizeBookingProblemAreasForPayload(
    state.problemAreas,
  );
  if (problemsForUrl.length > 0) {
    params.set(BOOKING_URL_HOME_PROBLEMS, problemsForUrl.join(","));
  }
  if (state.surfaceComplexity !== defaultBookingFlowState.surfaceComplexity) {
    params.set(BOOKING_URL_HOME_SURFACE, state.surfaceComplexity);
  }
  if (state.scopeIntensity !== defaultBookingFlowState.scopeIntensity) {
    params.set(BOOKING_URL_HOME_SCOPE, state.scopeIntensity);
  }
  const addOnsForUrl = normalizeBookingAddOnsForPayload(state.selectedAddOns);
  if (addOnsForUrl.length > 0) {
    params.set(BOOKING_URL_HOME_ADDONS, addOnsForUrl.join(","));
  }
  const upsellsForUrl = normalizeBookingUpsellIds(
    state.selectedUpsellIds,
    state.intent,
  );
  if (upsellsForUrl.length > 0) {
    params.set(BOOKING_URL_UPSELLS, upsellsForUrl.join(","));
  }
  if (
    isDeepCleaningBookingServiceId(state.serviceId) &&
    state.deepCleanFocus !== defaultBookingFlowState.deepCleanFocus
  ) {
    params.set(BOOKING_URL_DEEP_CLEAN_FOCUS, state.deepCleanFocus);
  }
  if (
    isBookingMoveTransitionServiceId(state.serviceId) &&
    state.transitionState !== defaultBookingFlowState.transitionState
  ) {
    params.set(BOOKING_URL_TRANSITION_STATE, state.transitionState);
  }
  const appliancesForUrl = normalizeBookingAppliancePresenceForPayload(
    state.appliancePresence,
  );
  if (
    isBookingMoveTransitionServiceId(state.serviceId) &&
    appliancesForUrl.length > 0
  ) {
    params.set(BOOKING_URL_APPLIANCE_PRESENCE, appliancesForUrl.join(","));
  }

  /** Persist post-review scheduling context so URL→state sync does not strip `schedulingBookingId` and clamp off `schedule`. */
  if (state.schedulingBookingId.trim()) {
    params.set("bookingId", state.schedulingBookingId.trim());
  }
  if (state.schedulingIntakeId.trim()) {
    params.set("intakeId", state.schedulingIntakeId.trim());
  }

  return params;
}

export type ParsedBookingIntakeFields = Pick<
  BookingFlowState,
  | "serviceId"
  | "intent"
  | "homeSize"
  | "bedrooms"
  | "bathrooms"
  | "pets"
  | "condition"
  | "problemAreas"
  | "surfaceComplexity"
  | "scopeIntensity"
  | "selectedAddOns"
  | "selectedUpsellIds"
  | "deepCleanFocus"
  | "transitionState"
  | "appliancePresence"
  | "frequency"
  | "preferredTime"
  | "deepCleanProgram"
>;

export function parseIntakeFieldsFromSearchParams(
  searchParams: URLSearchParams,
): ParsedBookingIntakeFields {
  const frequencyRaw = getParamValue(searchParams, "frequency").trim();
  const preferredTimeRaw = getParamValue(searchParams, "preferredTime").trim();
  const serviceRaw = getParamValue(searchParams, "service").trim();

  const resolvedServiceId = isValidBookingServiceId(serviceRaw)
    ? serviceRaw
    : defaultBookingFlowState.serviceId;

  let deepCleanProgram = parseDeepCleanProgramParam(
    searchParams.get("dcProgram"),
  );
  if (isDeepCleaningBookingServiceId(resolvedServiceId)) {
    if (!deepCleanProgram) deepCleanProgram = "single_visit";
  } else {
    deepCleanProgram = "";
  }

  const intent = parseCustomerIntentParam(
    searchParams.get(BOOKING_URL_CUSTOMER_INTENT),
  );

  return {
    serviceId: resolvedServiceId,
    intent,
    homeSize: normalizeBookingHomeSizeParam(
      getParamValue(searchParams, "homeSize"),
    ),
    bedrooms: normalizeBookingBedroomsParam(
      getParamValue(searchParams, "bedrooms").trim(),
    ),
    bathrooms: normalizeBookingBathroomsParam(
      getParamValue(searchParams, "bathrooms").trim(),
    ),
    pets: normalizeBookingPetsParam(getParamValue(searchParams, "pets")),
    condition: parseBookingHomeConditionParam(
      getParamValue(searchParams, BOOKING_URL_HOME_CONDITION),
    ),
    problemAreas: parseBookingProblemAreasParam(
      getParamValue(searchParams, BOOKING_URL_HOME_PROBLEMS),
    ),
    surfaceComplexity: parseBookingSurfaceComplexityParam(
      getParamValue(searchParams, BOOKING_URL_HOME_SURFACE),
    ),
    scopeIntensity: parseBookingScopeIntensityParam(
      getParamValue(searchParams, BOOKING_URL_HOME_SCOPE),
    ),
    selectedAddOns: parseBookingAddOnsParam(
      getParamValue(searchParams, BOOKING_URL_HOME_ADDONS),
    ),
    selectedUpsellIds: parseBookingUpsellIdsParam(
      getParamValue(searchParams, BOOKING_URL_UPSELLS),
      intent,
    ),
    deepCleanFocus: isDeepCleaningBookingServiceId(resolvedServiceId)
      ? parseBookingDeepCleanFocusParam(
          getParamValue(searchParams, BOOKING_URL_DEEP_CLEAN_FOCUS),
        )
      : defaultBookingFlowState.deepCleanFocus,
    transitionState: isBookingMoveTransitionServiceId(resolvedServiceId)
      ? parseBookingTransitionStateParam(
          getParamValue(searchParams, BOOKING_URL_TRANSITION_STATE),
        )
      : defaultBookingFlowState.transitionState,
    appliancePresence: isBookingMoveTransitionServiceId(resolvedServiceId)
      ? parseBookingAppliancePresenceParam(
          getParamValue(searchParams, BOOKING_URL_APPLIANCE_PRESENCE),
        )
      : defaultBookingFlowState.appliancePresence,
    frequency: isValidFrequency(frequencyRaw) ? frequencyRaw : "",
    preferredTime: isValidTime(preferredTimeRaw) ? preferredTimeRaw : "",
    deepCleanProgram,
  };
}

/** True when confirmation (or other) URL carries echoed /book intake keys beyond `service` alone. */
export function hasPublicIntakeEchoInSearchParams(
  searchParams: URLSearchParams,
): boolean {
  return hasUrlBookingShapeBeyondColdStart(searchParams);
}

export function readPublicIntakeEchoFromSearchParams(
  searchParams: URLSearchParams,
): ParsedBookingIntakeFields {
  return parseIntakeFieldsFromSearchParams(searchParams);
}

export function parseBookingSearchParams(
  searchParams: URLSearchParams,
): BookingFlowState {
  const serviceRaw = getParamValue(searchParams, "service").trim();
  const fields = parseIntakeFieldsFromSearchParams(searchParams);
  const pubPathRaw = getParamValue(searchParams, BOOKING_URL_PUBLIC_PATH).trim();

  let serviceId = fields.serviceId;
  let deepCleanProgram = fields.deepCleanProgram;
  let bookingPublicPath: BookingPublicPath = "one_time_cleaning";

  if (
    serviceRaw === PUBLIC_BOOK_INTERNAL_RECURRING ||
    pubPathRaw === BOOKING_URL_PUBLIC_PATH_RECURRING_GATE ||
    pubPathRaw === "recurring_gate"
  ) {
    bookingPublicPath = "recurring_auth_gate";
    serviceId = PUBLIC_BOOK_INTERNAL_FIRST_TIME;
    deepCleanProgram =
      parseDeepCleanProgramParam(searchParams.get("dcProgram")) || "single_visit";
  } else if (serviceId === PUBLIC_BOOK_INTERNAL_MOVE) {
    bookingPublicPath = "move_transition";
  } else if (isDeepCleaningBookingServiceId(serviceId)) {
    if (
      pubPathRaw === BOOKING_URL_PUBLIC_PATH_FIRST_RECURRING ||
      pubPathRaw === "first_time_recurring"
    ) {
      bookingPublicPath = "first_time_with_recurring";
    } else {
      bookingPublicPath = "one_time_cleaning";
    }
  } else {
    bookingPublicPath = "one_time_cleaning";
  }

  const locZip = normalizeBookingServiceLocationZipParam(
    getParamValue(searchParams, BOOKING_URL_SERVICE_LOC_ZIP),
  );
  const locStreetRaw = String(
    getParamValue(searchParams, BOOKING_URL_SERVICE_LOC_STREET) ?? "",
  ).trim();
  const locCityRaw = String(
    getParamValue(searchParams, BOOKING_URL_SERVICE_LOC_CITY) ?? "",
  ).trim();
  const locStateRaw = String(
    getParamValue(searchParams, BOOKING_URL_SERVICE_LOC_STATE) ?? "",
  ).trim();
  const locUnitRaw = String(
    getParamValue(searchParams, BOOKING_URL_SERVICE_LOC_UNIT) ?? "",
  ).trim();
  const locAddrLegacy = String(
    getParamValue(searchParams, BOOKING_URL_SERVICE_LOC_ADDR) ?? "",
  ).trim();
  const streetFromParams = locStreetRaw || (!locStreetRaw && locAddrLegacy ? locAddrLegacy : "");

  const partial: BookingFlowState = {
    ...defaultBookingFlowState,
    ...fields,
    serviceId,
    deepCleanProgram,
    bookingPublicPath,
    serviceLocationZip: locZip,
    serviceLocationStreet: normalizeLocationText(streetFromParams),
    serviceLocationCity: normalizeLocationText(locCityRaw),
    serviceLocationState: normalizeLocationText(locStateRaw),
    serviceLocationUnit: normalizeLocationText(locUnitRaw),
    serviceLocationAddressLine: normalizeLocationText(locAddrLegacy),
    firstTimePostEstimateVisitChoice: defaultBookingFlowState.firstTimePostEstimateVisitChoice,
    frequency: "One-Time",
    step: defaultBookingFlowState.step,
    customerName: "",
    customerEmail: "",
    schedulingBookingId: getParamValue(searchParams, "bookingId").trim(),
    schedulingIntakeId: getParamValue(searchParams, "intakeId").trim(),
    selectedTeamId: "",
    selectedTeamDisplayName: "",
    availableTeams: [],
    availableWindows: [],
    selectedSlotId: "",
    selectedSlotStart: "",
    selectedSlotEnd: "",
    publicHoldId: "",
    schedulingConfirmed: false,
  };
  partial.step = resolveBookingStepFromUrl(searchParams, partial);
  return partial;
}

/**
 * Echoes canonical /book query keys onto confirmation URLs so the thank-you
 * page can mirror what the customer submitted (same keys as the live flow).
 */
export function appendPublicIntakeContextToSearchParams(
  q: URLSearchParams,
  state: Pick<
    BookingFlowState,
    | "serviceId"
    | "intent"
    | "homeSize"
    | "bedrooms"
    | "bathrooms"
    | "pets"
    | "condition"
    | "problemAreas"
    | "surfaceComplexity"
    | "scopeIntensity"
    | "selectedAddOns"
    | "selectedUpsellIds"
    | "deepCleanFocus"
    | "transitionState"
    | "appliancePresence"
    | "frequency"
    | "preferredTime"
    | "deepCleanProgram"
    | "bookingPublicPath"
    | "serviceLocationZip"
    | "serviceLocationStreet"
    | "serviceLocationCity"
    | "serviceLocationState"
    | "serviceLocationUnit"
    | "serviceLocationAddressLine"
  >,
  opts?: { maxHomeSizeChars?: number },
): void {
  const maxLen = opts?.maxHomeSizeChars ?? 180;
  const home = normalizeBookingHomeSizeParam(state.homeSize);
  if (state.intent) q.set(BOOKING_URL_CUSTOMER_INTENT, state.intent);
  if (home) q.set("homeSize", home.slice(0, maxLen));
  if (state.bedrooms.trim()) q.set("bedrooms", state.bedrooms.trim());
  if (state.bathrooms.trim()) q.set("bathrooms", state.bathrooms.trim());
  const pets = normalizeBookingPetsParam(state.pets);
  if (pets) q.set("pets", pets);
  if (state.frequency) q.set("frequency", String(state.frequency).trim());
  if (state.preferredTime) {
    q.set("preferredTime", String(state.preferredTime).trim());
  }
  q.set("service", state.serviceId.trim());
  if (state.bookingPublicPath === "recurring_auth_gate") {
    q.set(BOOKING_URL_PUBLIC_PATH, BOOKING_URL_PUBLIC_PATH_RECURRING_GATE);
  } else if (
    isDeepCleaningBookingServiceId(state.serviceId) &&
    state.bookingPublicPath === "first_time_with_recurring"
  ) {
    q.set(BOOKING_URL_PUBLIC_PATH, BOOKING_URL_PUBLIC_PATH_FIRST_RECURRING);
  } else if (
    isDeepCleaningBookingServiceId(state.serviceId) &&
    state.bookingPublicPath === "one_time_cleaning"
  ) {
    q.set(BOOKING_URL_PUBLIC_PATH, BOOKING_URL_PUBLIC_PATH_ONE_TIME);
  } else if (
    isBookingMoveTransitionServiceId(state.serviceId) &&
    state.bookingPublicPath === "move_transition"
  ) {
    q.set(BOOKING_URL_PUBLIC_PATH, "move");
  }
  const echoZip = normalizeBookingServiceLocationZipParam(state.serviceLocationZip);
  if (echoZip) q.set(BOOKING_URL_SERVICE_LOC_ZIP, echoZip);
  const echoStreet = normalizeLocationText(state.serviceLocationStreet);
  const echoCity = normalizeLocationText(state.serviceLocationCity);
  const echoState = normalizeLocationText(state.serviceLocationState);
  const echoUnit = normalizeLocationText(state.serviceLocationUnit);
  const echoAddr = normalizeLocationText(state.serviceLocationAddressLine);
  if (echoStreet) q.set(BOOKING_URL_SERVICE_LOC_STREET, echoStreet);
  if (echoCity) q.set(BOOKING_URL_SERVICE_LOC_CITY, echoCity);
  if (echoState) q.set(BOOKING_URL_SERVICE_LOC_STATE, echoState);
  if (echoUnit) q.set(BOOKING_URL_SERVICE_LOC_UNIT, echoUnit);
  if (echoAddr && !echoStreet) q.set(BOOKING_URL_SERVICE_LOC_ADDR, echoAddr);
  if (
    isDeepCleaningBookingServiceId(state.serviceId) &&
    state.deepCleanProgram
  ) {
    q.set("dcProgram", state.deepCleanProgram);
  }
  if (state.condition !== defaultBookingFlowState.condition) {
    q.set(BOOKING_URL_HOME_CONDITION, state.condition);
  }
  const problemsEcho = normalizeBookingProblemAreasForPayload(state.problemAreas);
  if (problemsEcho.length > 0) {
    q.set(BOOKING_URL_HOME_PROBLEMS, problemsEcho.join(","));
  }
  if (state.surfaceComplexity !== defaultBookingFlowState.surfaceComplexity) {
    q.set(BOOKING_URL_HOME_SURFACE, state.surfaceComplexity);
  }
  if (state.scopeIntensity !== defaultBookingFlowState.scopeIntensity) {
    q.set(BOOKING_URL_HOME_SCOPE, state.scopeIntensity);
  }
  const addOnsEcho = normalizeBookingAddOnsForPayload(state.selectedAddOns);
  if (addOnsEcho.length > 0) {
    q.set(BOOKING_URL_HOME_ADDONS, addOnsEcho.join(","));
  }
  const upsellsEcho = normalizeBookingUpsellIds(
    state.selectedUpsellIds,
    state.intent,
  );
  if (upsellsEcho.length > 0) {
    q.set(BOOKING_URL_UPSELLS, upsellsEcho.join(","));
  }
  if (
    isDeepCleaningBookingServiceId(state.serviceId) &&
    state.deepCleanFocus !== defaultBookingFlowState.deepCleanFocus
  ) {
    q.set(BOOKING_URL_DEEP_CLEAN_FOCUS, state.deepCleanFocus);
  }
  if (
    isBookingMoveTransitionServiceId(state.serviceId) &&
    state.transitionState !== defaultBookingFlowState.transitionState
  ) {
    q.set(BOOKING_URL_TRANSITION_STATE, state.transitionState);
  }
  const appliancesEcho = normalizeBookingAppliancePresenceForPayload(
    state.appliancePresence,
  );
  if (
    isBookingMoveTransitionServiceId(state.serviceId) &&
    appliancesEcho.length > 0
  ) {
    q.set(BOOKING_URL_APPLIANCE_PRESENCE, appliancesEcho.join(","));
  }
}

/** Same-origin snapshot so an empty confirmation URL can still show a truthful outcome after refresh. */
export const BOOKING_CONFIRMATION_SESSION_KEY = "servelink.bookingConfirmation.v1";

const BOOKING_CONFIRMATION_SESSION_MAX_MS = 45 * 60 * 1000;

export type BookingConfirmationSessionSnapshotV1 = {
  v: 1;
  savedAt: number;
  intakeId: string;
  bookingId: string;
  priceCents: number | null;
  durationMinutes: number | null;
  confidence: number | null;
  bookingErrorCode: string;
  /** Last known public deposit PI id (never store `client_secret`). */
  publicDepositPaymentIntentId?: string;
  publicDepositStatus?: string;
  publicDepositHoldId?: string;
  paymentSessionKey?: string;
  selectedTeamId?: string;
  selectedTeamDisplayName?: string;
  selectedSlotStart?: string;
  selectedSlotEnd?: string;
  paymentSessionCreatedAt?: string;
  paymentSessionExpiresAt?: string;
};

export function writeBookingConfirmationSessionSnapshot(
  partial: Omit<BookingConfirmationSessionSnapshotV1, "v" | "savedAt">,
): void {
  if (typeof window === "undefined") return;
  const intakeId = partial.intakeId.trim();
  if (!intakeId) return;
  try {
    const payload: BookingConfirmationSessionSnapshotV1 = {
      v: 1,
      savedAt: Date.now(),
      intakeId,
      bookingId: partial.bookingId.trim(),
      priceCents:
        typeof partial.priceCents === "number" &&
        Number.isFinite(partial.priceCents)
          ? partial.priceCents
          : null,
      durationMinutes:
        typeof partial.durationMinutes === "number" &&
        Number.isFinite(partial.durationMinutes)
          ? partial.durationMinutes
          : null,
      confidence:
        typeof partial.confidence === "number" &&
        Number.isFinite(partial.confidence)
          ? partial.confidence
          : null,
      bookingErrorCode: partial.bookingErrorCode.trim(),
      ...(typeof partial.publicDepositPaymentIntentId === "string" &&
      partial.publicDepositPaymentIntentId.trim()
        ? { publicDepositPaymentIntentId: partial.publicDepositPaymentIntentId.trim() }
        : {}),
      ...(typeof partial.publicDepositStatus === "string" &&
      partial.publicDepositStatus.trim()
        ? { publicDepositStatus: partial.publicDepositStatus.trim() }
        : {}),
      ...(typeof partial.publicDepositHoldId === "string" &&
      partial.publicDepositHoldId.trim()
        ? { publicDepositHoldId: partial.publicDepositHoldId.trim() }
        : {}),
      ...(typeof partial.paymentSessionKey === "string" &&
      partial.paymentSessionKey.trim()
        ? { paymentSessionKey: partial.paymentSessionKey.trim() }
        : {}),
      ...(typeof partial.selectedTeamId === "string" && partial.selectedTeamId.trim()
        ? { selectedTeamId: partial.selectedTeamId.trim() }
        : {}),
      ...(typeof partial.selectedTeamDisplayName === "string" &&
      partial.selectedTeamDisplayName.trim()
        ? { selectedTeamDisplayName: partial.selectedTeamDisplayName.trim() }
        : {}),
      ...(typeof partial.selectedSlotStart === "string" &&
      partial.selectedSlotStart.trim()
        ? { selectedSlotStart: partial.selectedSlotStart.trim() }
        : {}),
      ...(typeof partial.selectedSlotEnd === "string" && partial.selectedSlotEnd.trim()
        ? { selectedSlotEnd: partial.selectedSlotEnd.trim() }
        : {}),
      ...(typeof partial.paymentSessionCreatedAt === "string" &&
      partial.paymentSessionCreatedAt.trim()
        ? { paymentSessionCreatedAt: partial.paymentSessionCreatedAt.trim() }
        : {}),
      ...(typeof partial.paymentSessionExpiresAt === "string" &&
      partial.paymentSessionExpiresAt.trim()
        ? { paymentSessionExpiresAt: partial.paymentSessionExpiresAt.trim() }
        : {}),
    };
    window.sessionStorage.setItem(
      BOOKING_CONFIRMATION_SESSION_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // quota / private mode
  }
}

export function readBookingConfirmationSessionSnapshot(): BookingConfirmationSessionSnapshotV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(BOOKING_CONFIRMATION_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<BookingConfirmationSessionSnapshotV1>;
    if (o.v !== 1 || typeof o.savedAt !== "number") return null;
    if (Date.now() - o.savedAt > BOOKING_CONFIRMATION_SESSION_MAX_MS) return null;
    if (typeof o.intakeId !== "string" || !o.intakeId.trim()) return null;
    return {
      v: 1,
      savedAt: o.savedAt,
      intakeId: o.intakeId.trim(),
      bookingId: typeof o.bookingId === "string" ? o.bookingId.trim() : "",
      priceCents:
        typeof o.priceCents === "number" && Number.isFinite(o.priceCents)
          ? o.priceCents
          : null,
      durationMinutes:
        typeof o.durationMinutes === "number" &&
        Number.isFinite(o.durationMinutes)
          ? o.durationMinutes
          : null,
      confidence:
        typeof o.confidence === "number" && Number.isFinite(o.confidence)
          ? o.confidence
          : null,
      bookingErrorCode:
        typeof o.bookingErrorCode === "string" ? o.bookingErrorCode.trim() : "",
      publicDepositPaymentIntentId:
        typeof o.publicDepositPaymentIntentId === "string"
          ? o.publicDepositPaymentIntentId.trim()
          : undefined,
      publicDepositStatus:
        typeof o.publicDepositStatus === "string"
          ? o.publicDepositStatus.trim()
          : undefined,
      publicDepositHoldId:
        typeof o.publicDepositHoldId === "string"
          ? o.publicDepositHoldId.trim()
          : undefined,
      paymentSessionKey:
        typeof o.paymentSessionKey === "string"
          ? o.paymentSessionKey.trim()
          : undefined,
      selectedTeamId:
        typeof o.selectedTeamId === "string" ? o.selectedTeamId.trim() : undefined,
      selectedTeamDisplayName:
        typeof o.selectedTeamDisplayName === "string"
          ? o.selectedTeamDisplayName.trim()
          : undefined,
      selectedSlotStart:
        typeof o.selectedSlotStart === "string"
          ? o.selectedSlotStart.trim()
          : undefined,
      selectedSlotEnd:
        typeof o.selectedSlotEnd === "string" ? o.selectedSlotEnd.trim() : undefined,
      paymentSessionCreatedAt:
        typeof o.paymentSessionCreatedAt === "string"
          ? o.paymentSessionCreatedAt.trim()
          : undefined,
      paymentSessionExpiresAt:
        typeof o.paymentSessionExpiresAt === "string"
          ? o.paymentSessionExpiresAt.trim()
          : undefined,
    };
  } catch {
    return null;
  }
}

export function clearBookingConfirmationSessionSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(BOOKING_CONFIRMATION_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function clearBookingConfirmationPaymentSessionState(
  bookingId?: string | null,
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(BOOKING_CONFIRMATION_SESSION_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<BookingConfirmationSessionSnapshotV1>;
    if (parsed.v !== 1 || typeof parsed.intakeId !== "string") return;
    const expectedBookingId = bookingId?.trim();
    if (
      expectedBookingId &&
      typeof parsed.bookingId === "string" &&
      parsed.bookingId.trim() !== expectedBookingId
    ) {
      return;
    }
    const cleaned = { ...parsed };
    delete cleaned.publicDepositPaymentIntentId;
    delete cleaned.publicDepositStatus;
    delete cleaned.publicDepositHoldId;
    delete cleaned.paymentSessionKey;
    delete cleaned.paymentSessionCreatedAt;
    delete cleaned.paymentSessionExpiresAt;
    window.sessionStorage.setItem(
      BOOKING_CONFIRMATION_SESSION_KEY,
      JSON.stringify(cleaned),
    );
  } catch {
    // ignore
  }
}

/** When the address bar lost all confirmation pairs (common after refresh glitches). */
export function isConfirmationUrlQueryEmpty(searchParams: URLSearchParams): boolean {
  return [...searchParams.keys()].length === 0;
}

/**
 * If the URL has no keys, rebuild the same query keys from a recent submit snapshot.
 * Otherwise return a clone of the URL params (URL remains the source of truth).
 *
 * Used only on `/book/confirmation`. Do not call from the active `/book` funnel—
 * confirmation snapshots must not hydrate booking entry state.
 */
export function mergeConfirmationParamsFromSessionIfUrlEmpty(
  url: URLSearchParams,
  session: BookingConfirmationSessionSnapshotV1 | null,
): URLSearchParams {
  if (!isConfirmationUrlQueryEmpty(url)) {
    return new URLSearchParams(url.toString());
  }
  if (!session) return new URLSearchParams();
  const q = new URLSearchParams();
  q.set("intakeId", session.intakeId);
  if (session.bookingId) q.set("bookingId", session.bookingId);
  if (session.priceCents != null) {
    q.set("priceCents", String(session.priceCents));
  }
  if (session.durationMinutes != null) {
    q.set("durationMinutes", String(session.durationMinutes));
  }
  if (session.confidence != null) {
    q.set("confidence", String(session.confidence));
  }
  if (session.bookingErrorCode) {
    q.set("bookingError", session.bookingErrorCode);
  }
  return q;
}

/** Set when leaving confirmation for `/book` so the flow can reset without carrying prior completion UI. */
export const BOOKING_FLOW_FRESH_START_FLAG = "servelink.bookingFlowFreshStart.v1";

export function markBookingFlowFreshStartRequested(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BOOKING_FLOW_FRESH_START_FLAG, "1");
  } catch {
    // ignore
  }
}

export function consumeBookingFlowFreshStartRequested(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = window.sessionStorage.getItem(BOOKING_FLOW_FRESH_START_FLAG);
    if (v !== "1") return false;
    window.sessionStorage.removeItem(BOOKING_FLOW_FRESH_START_FLAG);
    return true;
  } catch {
    return false;
  }
}
