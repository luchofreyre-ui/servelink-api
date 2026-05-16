import { API_BASE_URL } from "@/lib/api";

/** Mirrors `PUBLIC_BOOKING_FUNNEL_MILESTONE_KEYS` on the API (minus server-only kinds clients must not send). */
export type PublicBookingFunnelMilestoneClientKey =
  | "REVIEW_VIEWED"
  | "REVIEW_SUBMITTED"
  | "SCHEDULE_REACHED"
  | "TEAM_SELECTED"
  | "SLOT_SELECTED"
  | "HOLD_CREATED"
  | "HOLD_FAILED"
  | "CONFIRM_FAILED"
  | "BOOKING_CONFIRMED"
  | "REVIEW_ABANDONED"
  | "DEPOSIT_SUBMIT_INITIATED"
  | "BOOKING_REENTRY"
  | "RECURRING_CADENCE_SELECTED";

export type PublicBookingFunnelMilestonePayload = {
  cadence?: string;
  surface?: string;
  paymentSessionKey?: string;
  teamId?: string;
  slotId?: string;
  holdId?: string;
  reasonCode?: string;
  phase?: string;
};

/**
 * Fire-and-forget durable funnel echo to operational storage (`BookingEvent` / intake snapshot).
 * Never throws to the caller — failures are intentionally silent for UX.
 */
export function postPublicBookingFunnelMilestone(body: {
  milestone: PublicBookingFunnelMilestoneClientKey;
  bookingId?: string;
  intakeId?: string;
  payload?: PublicBookingFunnelMilestonePayload;
}): void {
  const bookingId = body.bookingId?.trim() || "";
  const intakeId = body.intakeId?.trim() || "";
  if (!bookingId && !intakeId) {
    return;
  }

  void fetch(`${API_BASE_URL}/public-booking/funnel-milestone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      milestone: body.milestone,
      ...(bookingId ? { bookingId } : {}),
      ...(intakeId ? { intakeId } : {}),
      ...(body.payload && Object.keys(body.payload).length > 0
        ? { payload: body.payload }
        : {}),
    }),
    cache: "no-store",
  }).catch(() => {
    /* intentionally ignored */
  });
}
