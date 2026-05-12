/**
 * Labels for API `transitionType` values (`booking-mutation-envelope.ts` on the server).
 * Keeps UI and future automation aligned with mutation envelopes without DB coupling.
 */
export const BOOKING_API_MUTATION_TRANSITION_LABELS: Record<string, string> = {
  BOOKING_ASSIGN: "Booking assigned",
  BOOKING_ASSIGN_RECOMMENDED: "Booking assigned (recommended)",
  SEGMENT_SCHEDULE: "Visit scheduled",
  SEGMENT_START: "Visit started",
  SEGMENT_COMPLETE: "Visit completed",
  SEGMENT_CANCEL: "Visit canceled",
  SEGMENT_REOPEN: "Visit reopened",
  BOOKING_MAIN_TRANSITION: "Status transition",
  PAYMENT_STATUS_UPDATE: "Payment status updated",
  PAYMENT_CHECKOUT_CREATE: "Checkout created",
  BOOKING_HOLD: "Operational hold",
  BOOKING_PATCH: "Booking updated",
};

export function labelBookingApiMutationTransition(
  type: string | null | undefined,
): string {
  if (!type) return "Booking mutation";
  return (
    BOOKING_API_MUTATION_TRANSITION_LABELS[type] ??
    type.replace(/_/g, " ").toLowerCase()
  );
}
