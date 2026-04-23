import type { BookingPublicPath } from "./bookingFlowTypes";

/** Internal catalog slugs mapped from public booking cards (legacy IDs unchanged). */
export const PUBLIC_BOOK_INTERNAL_FIRST_TIME = "deep-cleaning";
export const PUBLIC_BOOK_INTERNAL_MOVE = "move-in-move-out";
export const PUBLIC_BOOK_INTERNAL_RECURRING = "recurring-home-cleaning";

export function isPublicAnonymousBookingServiceId(serviceId: string): boolean {
  const id = String(serviceId ?? "").trim();
  return id === PUBLIC_BOOK_INTERNAL_FIRST_TIME || id === PUBLIC_BOOK_INTERNAL_MOVE;
}

export function isAnonymousBookingPublicPath(path: BookingPublicPath): boolean {
  return (
    path === "one_time_cleaning" ||
    path === "first_time_with_recurring" ||
    path === "move_transition"
  );
}

/** Serialized in `pubPath` query key (stable tokens). */
export const BOOKING_URL_PUBLIC_PATH_ONE_TIME = "one_time";
export const BOOKING_URL_PUBLIC_PATH_FIRST_RECURRING = "first_time_recurring";
export const BOOKING_URL_PUBLIC_PATH_RECURRING_GATE = "recurring_gate";

export function getPublicBookingMarketingTitle(
  bookingPublicPath: BookingPublicPath,
): string {
  switch (bookingPublicPath) {
    case "move_transition":
      return "Move-In / Move-Out Cleaning";
    case "recurring_auth_gate":
      return "Recurring Service";
    case "first_time_with_recurring":
      return "First-Time Cleaning With Recurring Service";
    case "one_time_cleaning":
    default:
      return "One-Time Cleaning";
  }
}
