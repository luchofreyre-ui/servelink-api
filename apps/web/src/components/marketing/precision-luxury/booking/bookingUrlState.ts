import type {
  BookingDeepCleanProgramChoice,
  BookingFlowState,
  BookingFrequencyOption,
  BookingStepId,
  BookingTimeOption,
} from "./bookingFlowTypes";
import { defaultBookingFlowState } from "./bookingFlowData";
import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";
import { isValidBookingServiceId } from "./bookingServiceCatalog";

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

export function buildBookingSearchParams(state: BookingFlowState) {
  const params = new URLSearchParams();

  params.set("step", state.step);
  params.set("service", state.serviceId);

  if (state.homeSize) params.set("homeSize", state.homeSize);
  if (state.bedrooms) params.set("bedrooms", state.bedrooms);
  if (state.bathrooms) params.set("bathrooms", state.bathrooms);
  if (state.pets) params.set("pets", state.pets);
  if (state.frequency) params.set("frequency", state.frequency);
  if (state.preferredTime) params.set("preferredTime", state.preferredTime);
  if (
    isDeepCleaningBookingServiceId(state.serviceId) &&
    state.deepCleanProgram
  ) {
    params.set("dcProgram", state.deepCleanProgram);
  }

  return params;
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

  return {
    step: isValidStep(step) ? step : defaultBookingFlowState.step,
    serviceId: resolvedServiceId,
    homeSize: getParamValue(searchParams, "homeSize"),
    bedrooms: getParamValue(searchParams, "bedrooms"),
    bathrooms: getParamValue(searchParams, "bathrooms"),
    pets: getParamValue(searchParams, "pets"),
    frequency: isValidFrequency(frequency) ? frequency : "",
    preferredTime: isValidTime(preferredTime) ? preferredTime : "",
    deepCleanProgram,
  };
}
