import type {
  BookingDeepCleanProgramChoice,
  BookingFlowState,
  BookingFrequencyOption,
  BookingStepId,
  BookingTimeOption,
  RecurringCadence,
  RecurringIntent,
  RecurringSetupState,
  RecurringTimePreference,
} from "./bookingFlowTypes";
import { defaultBookingFlowState } from "./bookingFlowData";
import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";
import { isValidBookingServiceId } from "./bookingServiceCatalog";
import {
  DEFAULT_BOOKING_ESTIMATE_FACTORS,
  parseBookingEstimateFactorsFromUnknown,
} from "./bookingEstimateFactors";

const validSteps: BookingStepId[] = [
  "service",
  "home",
  "factors",
  "schedule",
  "review",
  "decision",
  "recurring_setup",
  "confirm",
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

function parseDeepCleanProgramParam(
  raw: string | null,
): BookingDeepCleanProgramChoice | "" {
  const v = (raw ?? "").trim();
  if (v === "phased_3_visit" || v === "phased") return "phased_3_visit";
  if (v === "single_visit" || v === "single") return "single_visit";
  return "";
}

function serializeEstimateFactorsParam(
  estimateFactors: BookingFlowState["estimateFactors"],
): string {
  try {
    return encodeURIComponent(JSON.stringify(estimateFactors));
  } catch {
    return "";
  }
}

function parseEstimateFactorsParam(raw: string | null) {
  if (!raw) return { ...DEFAULT_BOOKING_ESTIMATE_FACTORS };
  try {
    const decoded = decodeURIComponent(raw);
    return parseBookingEstimateFactorsFromUnknown(JSON.parse(decoded));
  } catch {
    return { ...DEFAULT_BOOKING_ESTIMATE_FACTORS };
  }
}

/** Canonical query keys for recurring vs one-time booking path (see BOOKING_PRODUCT_TRUTH.md). */
export const BOOKING_URL_PARAM_CADENCE = "cadence";
export const BOOKING_URL_PARAM_BOOKING_PATH = "bookingPath";
export const BOOKING_URL_PARAM_REC_ANCHOR = "recAnchor";
export const BOOKING_URL_PARAM_REC_TIME = "recTime";

/** Query keys fully owned by the booking serializer (extras like UTM are ignored). */
const BOOKING_OWNED_QUERY_KEYS: readonly string[] = [
  "step",
  "service",
  "homeSize",
  "bedrooms",
  "bathrooms",
  "pets",
  "frequency",
  "preferredTime",
  "dcProgram",
  "ef",
  BOOKING_URL_PARAM_CADENCE,
  BOOKING_URL_PARAM_BOOKING_PATH,
  BOOKING_URL_PARAM_REC_ANCHOR,
  BOOKING_URL_PARAM_REC_TIME,
];

export function cadenceToFrequencyLabel(
  cadence: RecurringCadence,
): BookingFrequencyOption {
  if (cadence === "weekly") return "Weekly";
  if (cadence === "biweekly") return "Bi-Weekly";
  return "Monthly";
}

export function frequencyLabelToCadence(
  label: BookingFrequencyOption | "",
): RecurringCadence | null {
  if (label === "Weekly") return "weekly";
  if (label === "Bi-Weekly") return "biweekly";
  if (label === "Monthly") return "monthly";
  return null;
}

function parseCadenceParam(raw: string | null): RecurringCadence | null {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "weekly") return "weekly";
  if (v === "biweekly" || v === "bi-weekly") return "biweekly";
  if (v === "monthly") return "monthly";
  return null;
}

function parseBookingPathParam(
  raw: string | null,
): "recurring" | "one_time" | null {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "recurring") return "recurring";
  if (v === "one_time" || v === "onetime" || v === "one-time") return "one_time";
  return null;
}

function parseRecTimeParam(raw: string | null): RecurringTimePreference | null {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "morning" || v === "midday" || v === "afternoon" || v === "anytime") {
    return v as RecurringTimePreference;
  }
  return null;
}

function resolveRecurringIntentFromSearchParams(
  searchParams: URLSearchParams,
  frequencyParam: BookingFrequencyOption | "",
): RecurringIntent | undefined {
  const cadenceRaw = searchParams.get(BOOKING_URL_PARAM_CADENCE);
  const cadenceFromParam = parseCadenceParam(cadenceRaw);
  const bookingPath = parseBookingPathParam(
    searchParams.get(BOOKING_URL_PARAM_BOOKING_PATH),
  );

  if (cadenceFromParam) {
    return { type: "recurring", cadence: cadenceFromParam };
  }

  if (bookingPath === "one_time") {
    return { type: "one_time" };
  }

  if (bookingPath === "recurring") {
    const fromFreq = frequencyLabelToCadence(frequencyParam);
    return {
      type: "recurring",
      cadence: fromFreq ?? "weekly",
    };
  }

  return undefined;
}

/**
 * `frequency` in funnel state is the schedule row from the questionnaire (preview/submit payload).
 * The URL may carry a canonical cadence label for recurring; when it contradicts explicit recurring
 * markers (stale `frequency=One-Time`), return "" so URL hydration can preserve the prior row.
 */
function inferScheduleRowFrequency(
  searchParams: URLSearchParams,
  frequencyFromQuery: BookingFrequencyOption | "",
  recurringIntent: RecurringIntent | undefined,
): BookingFrequencyOption | "" {
  const cadenceFromParam = parseCadenceParam(
    searchParams.get(BOOKING_URL_PARAM_CADENCE),
  );
  const bookingPath = parseBookingPathParam(
    searchParams.get(BOOKING_URL_PARAM_BOOKING_PATH),
  );

  if (recurringIntent?.type === "recurring") {
    const explicitRecurring =
      Boolean(cadenceFromParam) || bookingPath === "recurring";
    if (frequencyFromQuery === "One-Time" && explicitRecurring) {
      return "";
    }
  }

  if (frequencyFromQuery) return frequencyFromQuery;

  if (recurringIntent?.type === "recurring") {
    return cadenceToFrequencyLabel(recurringIntent.cadence);
  }

  return "";
}

function parseRecurringSetupFromSearchParams(
  searchParams: URLSearchParams,
  addonIds: string[],
): RecurringSetupState | undefined {
  const anchor = (searchParams.get(BOOKING_URL_PARAM_REC_ANCHOR) ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor)) return undefined;
  const time =
    parseRecTimeParam(searchParams.get(BOOKING_URL_PARAM_REC_TIME)) ?? "anytime";
  return {
    nextAnchorDate: anchor,
    timePreference: time,
    preferredFoId: undefined,
    bookingNotes: undefined,
    addonIds: [...addonIds],
  };
}

/** Frequency shown in the `frequency` query param (path truth for recurring vs schedule row). */
export function canonicalBookingUrlFrequency(state: BookingFlowState): BookingFrequencyOption | "" {
  if (state.recurringIntent?.type === "recurring") {
    return cadenceToFrequencyLabel(state.recurringIntent.cadence);
  }
  return state.frequency;
}

export function buildBookingSearchParams(state: BookingFlowState) {
  const params = new URLSearchParams();

  params.set("step", state.step);
  params.set("service", state.serviceId);

  if (state.homeSize) params.set("homeSize", state.homeSize);
  if (state.bedrooms) params.set("bedrooms", state.bedrooms);
  if (state.bathrooms) params.set("bathrooms", state.bathrooms);
  if (state.pets) params.set("pets", state.pets);

  const urlFreq = canonicalBookingUrlFrequency(state);
  if (urlFreq) params.set("frequency", urlFreq);

  if (state.recurringIntent?.type === "recurring") {
    params.set(BOOKING_URL_PARAM_BOOKING_PATH, "recurring");
    params.set(
      BOOKING_URL_PARAM_CADENCE,
      state.recurringIntent.cadence,
    );
    const rs = state.recurringSetup;
    if (rs?.nextAnchorDate?.trim()) {
      params.set(BOOKING_URL_PARAM_REC_ANCHOR, rs.nextAnchorDate.trim());
      params.set(BOOKING_URL_PARAM_REC_TIME, rs.timePreference);
    }
  } else if (state.recurringIntent?.type === "one_time") {
    params.set(BOOKING_URL_PARAM_BOOKING_PATH, "one_time");
  }

  if (state.preferredTime) params.set("preferredTime", state.preferredTime);
  if (
    isDeepCleaningBookingServiceId(state.serviceId) &&
    state.deepCleanProgram
  ) {
    params.set("dcProgram", state.deepCleanProgram);
  }

  const ef = serializeEstimateFactorsParam(state.estimateFactors);
  if (ef) params.set("ef", ef);

  return params;
}

export type BookingUrlSerializationDebug = {
  serializedFrequency: string;
  serializedBookingPath: string;
  serializedCadence: string;
  serializedRecAnchor: string;
  serializedRecTime: string;
};

export function readBookingUrlSerializationDebug(
  searchParams: URLSearchParams,
): BookingUrlSerializationDebug {
  return {
    serializedFrequency: searchParams.get("frequency") ?? "",
    serializedBookingPath: searchParams.get(BOOKING_URL_PARAM_BOOKING_PATH) ?? "",
    serializedCadence: searchParams.get(BOOKING_URL_PARAM_CADENCE) ?? "",
    serializedRecAnchor: searchParams.get(BOOKING_URL_PARAM_REC_ANCHOR) ?? "",
    serializedRecTime: searchParams.get(BOOKING_URL_PARAM_REC_TIME) ?? "",
  };
}

export function isBookingUrlSerializationConsistent(
  state: BookingFlowState,
  searchParams: URLSearchParams,
): boolean {
  const expected = buildBookingSearchParams(state);
  for (const key of expected.keys()) {
    if (expected.get(key) !== searchParams.get(key)) return false;
  }
  for (const key of BOOKING_OWNED_QUERY_KEYS) {
    if (!expected.has(key) && searchParams.has(key)) return false;
  }
  return true;
}

export function parseBookingSearchParams(
  searchParams: URLSearchParams,
): BookingFlowState {
  const step = searchParams.get("step");
  const frequency = searchParams.get("frequency");
  const preferredTime = searchParams.get("preferredTime");
  const serviceId = searchParams.get("service");
  const resolvedServiceId = isValidBookingServiceId(serviceId)
    ? serviceId
    : defaultBookingFlowState.serviceId;

  let deepCleanProgram = parseDeepCleanProgramParam(
    searchParams.get("dcProgram"),
  );
  if (isDeepCleaningBookingServiceId(resolvedServiceId)) {
    if (!deepCleanProgram) deepCleanProgram = "single_visit";
  } else {
    deepCleanProgram = "";
  }

  const estimateFactors = parseEstimateFactorsParam(searchParams.get("ef"));

  const frequencyParsed: BookingFrequencyOption | "" = isValidFrequency(frequency)
    ? frequency
    : "";

  const recurringIntent = resolveRecurringIntentFromSearchParams(
    searchParams,
    frequencyParsed,
  );

  const scheduleRowFrequency = inferScheduleRowFrequency(
    searchParams,
    frequencyParsed,
    recurringIntent,
  );

  const recurringSetup = parseRecurringSetupFromSearchParams(
    searchParams,
    estimateFactors.addonIds ?? [],
  );

  return {
    step: isValidStep(step) ? step : defaultBookingFlowState.step,
    serviceId: resolvedServiceId,
    homeSize: getParamValue(searchParams, "homeSize"),
    bedrooms: getParamValue(searchParams, "bedrooms"),
    bathrooms: getParamValue(searchParams, "bathrooms"),
    pets: getParamValue(searchParams, "pets"),
    estimateFactors,
    frequency: scheduleRowFrequency,
    preferredTime: isValidTime(preferredTime) ? preferredTime : "",
    deepCleanProgram,
    customerName: "",
    customerEmail: "",
    recurringIntent,
    recurringSetup,
    estimateSnapshot: null,
  };
}

/** Fields that drive preview-estimate; used to detect URL vs in-memory drift without expanding the URL. */
export function buildBookingEstimateDrivingSignature(state: BookingFlowState): string {
  return JSON.stringify({
    serviceId: state.serviceId,
    homeSize: state.homeSize,
    bedrooms: state.bedrooms,
    bathrooms: state.bathrooms,
    pets: state.pets,
    frequency: state.frequency,
    preferredTime: state.preferredTime,
    deepCleanProgram: state.deepCleanProgram,
    estimateFactors: state.estimateFactors,
    customerName: state.customerName.trim(),
    customerEmail: state.customerEmail.trim(),
  });
}

export function buildBookingPreviewRequestKey(
  state: BookingFlowState,
  attributionQueryKey: string,
): string {
  return `${buildBookingEstimateDrivingSignature(state)}|${attributionQueryKey}`;
}
