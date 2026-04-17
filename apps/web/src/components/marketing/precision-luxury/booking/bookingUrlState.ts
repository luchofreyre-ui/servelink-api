import type {
  BookingAddOnToken,
  BookingAppliancePresenceToken,
  BookingDeepCleanFocus,
  BookingDeepCleanProgramChoice,
  BookingFlowState,
  BookingFrequencyOption,
  BookingHomeCondition,
  BookingProblemAreaToken,
  BookingScopeIntensity,
  BookingStepId,
  BookingSurfaceComplexity,
  BookingTimeOption,
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

const validSteps: BookingStepId[] = ["service", "home", "schedule", "review"];
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
  home: 1,
  review: 2,
  schedule: 3,
};

function isValidStep(value: string | null): value is BookingStepId {
  return !!value && validSteps.includes(value as BookingStepId);
}

function isValidFrequency(value: string | null): value is BookingFrequencyOption {
  return !!value && validFrequencies.includes(value as BookingFrequencyOption);
}

function isValidTime(value: string | null): value is BookingTimeOption {
  return !!value && validTimes.includes(value as BookingTimeOption);
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
  return (
    !!normalizeBookingHomeSizeParam(s.homeSize) &&
    !!String(s.bedrooms ?? "").trim() &&
    !!String(s.bathrooms ?? "").trim()
  );
}

export function isScheduleDetailsComplete(
  s: Pick<BookingFlowState, "frequency" | "preferredTime">,
): boolean {
  return !!String(s.frequency ?? "").trim() && !!String(s.preferredTime ?? "").trim();
}

/** Service cadence collected on the home step (still required for intake / estimator). */
export const isCadenceComplete = isScheduleDetailsComplete;

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
  if (!isHomeDetailsComplete(s) || !isCadenceComplete(s)) return "home";
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

  return {
    ...prev,
    serviceId: nextServiceId,
    deepCleanProgram,
    deepCleanFocus,
    transitionState,
    appliancePresence,
    schedulingBookingId: "",
    schedulingIntakeId: "",
    selectedTeamId: "",
    selectedTeamDisplayName: "",
    availableTeams: [],
    availableWindows: [],
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
      ? { preferredTime: patch.preferredTime }
      : {}),
  };
}

/**
 * Step 2 only: merge home-detail fields present in `patch`.
 * Service, schedule, contact, and deep-clean program stay as-entered unless the caller clamps step.
 */
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
      | "deepCleanFocus"
      | "transitionState"
      | "appliancePresence"
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
    BOOKING_URL_DEEP_CLEAN_FOCUS,
    BOOKING_URL_TRANSITION_STATE,
    BOOKING_URL_APPLIANCE_PRESENCE,
    "frequency",
    "preferredTime",
    "dcProgram",
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

  return params;
}

export type ParsedBookingIntakeFields = Pick<
  BookingFlowState,
  | "serviceId"
  | "homeSize"
  | "bedrooms"
  | "bathrooms"
  | "pets"
  | "condition"
  | "problemAreas"
  | "surfaceComplexity"
  | "scopeIntensity"
  | "selectedAddOns"
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

  return {
    serviceId: resolvedServiceId,
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
  const fields = parseIntakeFieldsFromSearchParams(searchParams);
  const partial: BookingFlowState = {
    ...fields,
    step: defaultBookingFlowState.step,
    customerName: "",
    customerEmail: "",
    schedulingBookingId: "",
    schedulingIntakeId: "",
    selectedTeamId: "",
    selectedTeamDisplayName: "",
    availableTeams: [],
    availableWindows: [],
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
    | "homeSize"
    | "bedrooms"
    | "bathrooms"
    | "pets"
    | "condition"
    | "problemAreas"
    | "surfaceComplexity"
    | "scopeIntensity"
    | "selectedAddOns"
    | "deepCleanFocus"
    | "transitionState"
    | "appliancePresence"
    | "frequency"
    | "preferredTime"
    | "deepCleanProgram"
  >,
  opts?: { maxHomeSizeChars?: number },
): void {
  const maxLen = opts?.maxHomeSizeChars ?? 180;
  const home = normalizeBookingHomeSizeParam(state.homeSize);
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
