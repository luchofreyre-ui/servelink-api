import type { BookingRecord } from "@/lib/bookings/bookingApiTypes";
import { formatOperationalBookingEventHeadline } from "@/lib/operational/operationalBookingEvents";
import { isPaymentAttentionStatus } from "@/lib/operational/paymentAttention";

/**
 * Short trust rails for customer/FO lifecycle cards — authoritative-record framing,
 * no ticketing or outbound messaging.
 */
export function buildSupportOperationalTrustLines(booking: BookingRecord): string[] {
  const lines: string[] = [];
  const ps = booking.paymentStatus;

  if (ps != null && isPaymentAttentionStatus(ps)) {
    lines.push(
      "Payment attention is recorded on this booking — resolve via Stripe checkout or an authorized adjustment before treating the visit as commercially closed.",
    );
  }

  const terminal =
    booking.status === "completed" ||
    booking.status === "canceled" ||
    booking.status === "cancelled";

  if (!terminal && booking.status === "pending_payment") {
    lines.push(
      "Scheduling and dispatch unlock after payment is authorized, captured, or waived on this record.",
    );
  }

  const recurringPlan = (
    booking as BookingRecord & {
      recurringPlan?: { status?: string } | null;
    }
  ).recurringPlan;
  if (recurringPlan?.status === "active") {
    lines.push(
      "Recurring cadence reflects the latest plan row linked to this booking — operational transitions do not imply schedule edits elsewhere.",
    );
  }

  return lines;
}

/** Event-grounded line for support rails — no delivery, interpretation only. */
export function buildSupportInterpretationFromLatestEvent(
  booking: BookingRecord,
): string | null {
  const evs = booking.events;
  if (!evs?.length) return null;
  const last = evs[evs.length - 1];
  return `Latest persisted operational signal: ${formatOperationalBookingEventHeadline(last)}.`;
}
