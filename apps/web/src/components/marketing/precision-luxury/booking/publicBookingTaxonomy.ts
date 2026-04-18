import type { BookingPublicPath } from "./bookingFlowTypes";

/** Internal catalog slugs mapped from public booking cards (legacy IDs unchanged). */
export const PUBLIC_BOOK_INTERNAL_FIRST_TIME = "deep-cleaning";
export const PUBLIC_BOOK_INTERNAL_MOVE = "move-in-move-out";
export const PUBLIC_BOOK_INTERNAL_RECURRING = "recurring-home-cleaning";

export function isPublicAnonymousBookingServiceId(serviceId: string): boolean {
  const id = String(serviceId ?? "").trim();
  return id === PUBLIC_BOOK_INTERNAL_FIRST_TIME || id === PUBLIC_BOOK_INTERNAL_MOVE;
}

export function getPublicBookingMarketingTitle(
  bookingPublicPath: BookingPublicPath,
): string {
  switch (bookingPublicPath) {
    case "move_transition":
      return "Move-In / Move-Out Cleaning";
    case "recurring_auth_gate":
      return "Recurring Cleaning";
    case "first_time":
    default:
      return "First-Time Cleaning";
  }
}
