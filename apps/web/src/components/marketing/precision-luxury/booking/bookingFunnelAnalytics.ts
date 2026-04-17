/**
 * Lightweight public booking funnel signals for observability (console, dataLayer, gtag).
 * No network I/O — safe to call from the client bundle.
 */

export type BookingFunnelEventName =
  | "review_viewed"
  | "review_continue_clicked"
  | "teams_loaded"
  | "team_selected"
  | "slots_loaded"
  | "slot_selected"
  | "confirm_clicked"
  | "booking_confirmed"
  | "hold_failed"
  | "confirm_failed"
  | "no_teams_available"
  | "no_slots_available"
  | "abandoned_after_review"
  | "abandoned_after_team_select"
  | "booking_unfinished_after_review";

export type BookingFunnelEventPayload = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function emitBookingFunnelEvent(
  name: BookingFunnelEventName,
  payload: BookingFunnelEventPayload = {},
): void {
  const body = { event: name, ...payload, ts: Date.now() };

  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push(body);
    if (typeof window.gtag === "function") {
      try {
        window.gtag("event", name, payload);
      } catch {
        /* ignore */
      }
    }
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[booking_funnel]", name, payload);
  }
}
