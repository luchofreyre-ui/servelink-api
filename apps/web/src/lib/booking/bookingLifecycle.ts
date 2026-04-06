/**
 * UI-only helpers for booking status presentation (no persistence).
 */
import type { BookingStatus } from "@/lib/bookings/bookingApiTypes";

const BOOKING_STATUS_LABELS: Partial<Record<BookingStatus, string>> = {
  pending_payment: "Pending payment",
  pending_dispatch: "Pending dispatch",
  hold: "Hold",
  review: "Review",
  offered: "Offered",
  assigned: "Assigned",
  accepted: "Accepted",
  en_route: "En route",
  active: "Active",
  in_progress: "In progress",
  completed: "Completed",
  canceled: "Canceled",
  cancelled: "Cancelled",
  exception: "Exception",
};

export function formatBookingStatusLabel(status: BookingStatus): string {
  return BOOKING_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}
