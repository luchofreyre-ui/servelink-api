import type { BookingDirectionOutboundPayload } from "./bookingDirectionIntakeApi";
import type { BookingFlowState } from "./bookingFlowTypes";
import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";

export type BookingDirectionExtras = Pick<
  BookingDirectionOutboundPayload,
  "source" | "utm" | "customerName" | "customerEmail"
>;

/**
 * API-safe fields for preview + submit (no top-level `estimateFactors` on the wire).
 */
export function buildBaseBookingDirectionPayload(
  state: BookingFlowState,
  extras: BookingDirectionExtras,
): BookingDirectionOutboundPayload {
  return {
    serviceId: state.serviceId,
    homeSize: state.homeSize,
    bedrooms: state.bedrooms,
    bathrooms: state.bathrooms,
    pets: state.pets ?? "",
    frequency: state.frequency,
    preferredTime: state.preferredTime,
    ...(isDeepCleaningBookingServiceId(state.serviceId) &&
    state.deepCleanProgram
      ? { deepCleanProgram: state.deepCleanProgram }
      : {}),
    ...extras,
  };
}

export function buildPreviewBookingDirectionPayload(
  state: BookingFlowState,
  extras: BookingDirectionExtras,
): BookingDirectionOutboundPayload {
  return buildBaseBookingDirectionPayload(state, extras);
}

export function buildSubmitBookingDirectionPayload(
  state: BookingFlowState,
  extras: BookingDirectionExtras,
): BookingDirectionOutboundPayload {
  return buildBaseBookingDirectionPayload(state, extras);
}
