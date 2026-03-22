import type {
  BookingFlowState,
  BookingFrequencyOption,
  BookingStepId,
  BookingTimeOption,
} from "./bookingFlowTypes";
import { defaultBookingFlowState } from "./bookingFlowData";
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

export function buildBookingSearchParams(state: BookingFlowState) {
  const params = new URLSearchParams();

  params.set("step", state.step);
  params.set("service", state.serviceId);
  params.set("homeSize", state.homeSize);
  params.set("bedrooms", state.bedrooms);
  params.set("bathrooms", state.bathrooms);
  params.set("pets", state.pets);
  params.set("frequency", state.frequency);
  params.set("preferredTime", state.preferredTime);

  return params;
}

export function parseBookingSearchParams(
  searchParams: URLSearchParams,
): BookingFlowState {
  const step = searchParams.get("step");
  const frequency = searchParams.get("frequency");
  const preferredTime = searchParams.get("preferredTime");
  const serviceId = searchParams.get("service");

  return {
    step: isValidStep(step) ? step : defaultBookingFlowState.step,
    serviceId: isValidBookingServiceId(serviceId)
      ? serviceId
      : defaultBookingFlowState.serviceId,
    homeSize:
      searchParams.get("homeSize") ?? defaultBookingFlowState.homeSize,
    bedrooms:
      searchParams.get("bedrooms") ?? defaultBookingFlowState.bedrooms,
    bathrooms:
      searchParams.get("bathrooms") ?? defaultBookingFlowState.bathrooms,
    pets: searchParams.get("pets") ?? defaultBookingFlowState.pets,
    frequency: isValidFrequency(frequency)
      ? frequency
      : defaultBookingFlowState.frequency,
    preferredTime: isValidTime(preferredTime)
      ? preferredTime
      : defaultBookingFlowState.preferredTime,
  };
}
