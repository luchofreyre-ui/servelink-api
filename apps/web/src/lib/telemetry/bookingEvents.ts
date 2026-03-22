import { WEB_ENV } from "@/lib/env";

export function trackBookingUiEvent(
  event: string,
  payload?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  if (!WEB_ENV.enableBookingUiTelemetry) return;

  const next = {
    event,
    payload: payload ?? {},
    at: new Date().toISOString(),
  };

  const key = "servelink_booking_ui_events";

  try {
    const current = window.localStorage.getItem(key);
    const parsed = current ? (JSON.parse(current) as unknown[]) : [];
    parsed.push(next);
    window.localStorage.setItem(key, JSON.stringify(parsed.slice(-100)));
  } catch {
    // no-op
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[booking-ui-event]", next);
  }
}
