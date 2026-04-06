import { WEB_ENV } from "@/lib/env";

type BookingUiEventRow = {
  event: string;
  payload: Record<string, unknown>;
  at: string;
};

const bookingUiEventBuffer: BookingUiEventRow[] = [];

/** Clears the in-memory buffer (used by unit tests). */
export function clearBookingUiTelemetryBufferForTests() {
  bookingUiEventBuffer.length = 0;
}

export function getBookingUiTelemetrySnapshot(): BookingUiEventRow[] {
  return [...bookingUiEventBuffer].reverse().slice(0, 20);
}

export function trackBookingUiEvent(
  event: string,
  payload?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  if (!WEB_ENV.enableBookingUiTelemetry) return;

  const next: BookingUiEventRow = {
    event,
    payload: payload ?? {},
    at: new Date().toISOString(),
  };

  bookingUiEventBuffer.push(next);
  if (bookingUiEventBuffer.length > 100) {
    bookingUiEventBuffer.splice(0, bookingUiEventBuffer.length - 100);
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[booking-ui-event]", next);
  }
}
