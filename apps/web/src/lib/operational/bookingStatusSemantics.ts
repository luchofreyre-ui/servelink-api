import type { BookingStatus } from "@/lib/bookings/bookingApiTypes";

/**
 * Mirrors `CUSTOMER_COMPLETION_READY_STATUS` in `booking-screen.service.ts`
 * (customer operational counts / snapshot semantics).
 */
export const CUSTOMER_VISIT_IN_MOTION_STATUSES: ReadonlySet<BookingStatus> = new Set([
  "assigned",
  "accepted",
  "en_route",
  "active",
  "in_progress",
]);

export function isCustomerVisitInMotionStatus(status: BookingStatus): boolean {
  return CUSTOMER_VISIT_IN_MOTION_STATUSES.has(status);
}

/**
 * Mirrors `FO_COMPLETION_READY_STATUS` in `booking-screen.service.ts`.
 */
export const FO_COMPLETION_READY_STATUSES: ReadonlySet<BookingStatus> = new Set([
  "active",
  "in_progress",
]);

export function isFoCompletionReadyStatus(status: BookingStatus): boolean {
  return FO_COMPLETION_READY_STATUSES.has(status);
}
