import type { BookingEvent } from "@/lib/bookings/bookingApiTypes";

/** Aligned with Prisma `BookingEventType` — human labels for UI and future orchestration. */
export const OPERATIONAL_BOOKING_EVENT_LABELS: Record<string, string> = {
  CREATED: "Booking created",
  STATUS_CHANGED: "Status changed",
  BOOKING_ASSIGNED: "Assignment recorded",
  BOOKING_HOLD: "Hold applied",
  PAYMENT_CHECKOUT_CREATED: "Checkout session created",
  PAYMENT_STATUS_CHANGED: "Payment status changed",
  PAYMENT_ADMIN_OVERRIDE: "Payment adjusted (admin)",
  NOTE: "Note added",
  DISPATCH_STARTED: "Dispatch started",
  OFFER_CREATED: "Offer sent",
  OFFER_ACCEPTED: "Offer accepted",
  OFFER_REJECTED: "Offer rejected",
  OFFER_EXPIRED: "Offer expired",
  DISPATCH_EXHAUSTED: "Dispatch exhausted candidates",
  CONTROLLED_COMPLETION_AUDIT: "Controlled completion audit",
  PAYMENT_RECONCILIATION_APPLIED: "Payment reconciliation applied",
};

export type OperationalBookingEventCategory =
  | "lifecycle"
  | "payment"
  | "dispatch"
  | "assignment"
  | "offer"
  | "audit"
  | "other";

export const OPERATIONAL_EVENT_CATEGORY_ORDER: OperationalBookingEventCategory[] =
  [
    "lifecycle",
    "payment",
    "dispatch",
    "assignment",
    "offer",
    "audit",
    "other",
  ];

export function labelOperationalEventCategory(
  cat: OperationalBookingEventCategory,
): string {
  switch (cat) {
    case "lifecycle":
      return "Lifecycle";
    case "payment":
      return "Payment";
    case "dispatch":
      return "Dispatch";
    case "assignment":
      return "Assignment & holds";
    case "offer":
      return "Offers";
    case "audit":
      return "Audit";
    default:
      return "Other";
  }
}

export function countOperationalBookingEventsByCategory(
  events: BookingEvent[] | undefined | null,
): Record<OperationalBookingEventCategory, number> {
  const out: Record<OperationalBookingEventCategory, number> = {
    lifecycle: 0,
    payment: 0,
    dispatch: 0,
    assignment: 0,
    offer: 0,
    audit: 0,
    other: 0,
  };
  for (const ev of events ?? []) {
    out[categorizeOperationalBookingEventType(ev.type)] += 1;
  }
  return out;
}

/**
 * Groups persisted booking events for observability surfaces — ordering within each bucket is chronological.
 */
export function groupBookingEventsByOperationalCategory(
  events: BookingEvent[] | undefined | null,
): Record<OperationalBookingEventCategory, BookingEvent[]> {
  const buckets: Record<OperationalBookingEventCategory, BookingEvent[]> = {
    lifecycle: [],
    payment: [],
    dispatch: [],
    assignment: [],
    offer: [],
    audit: [],
    other: [],
  };
  for (const ev of events ?? []) {
    buckets[categorizeOperationalBookingEventType(ev.type)].push(ev);
  }
  return buckets;
}

export function labelOperationalBookingEventType(
  type: string | null | undefined,
): string {
  if (!type) return "Booking update";
  return (
    OPERATIONAL_BOOKING_EVENT_LABELS[type] ??
    type.replace(/_/g, " ").toLowerCase()
  );
}

export function categorizeOperationalBookingEventType(
  type: string | null | undefined,
): OperationalBookingEventCategory {
  switch (type) {
    case "CREATED":
    case "STATUS_CHANGED":
    case "NOTE":
      return "lifecycle";
    case "PAYMENT_CHECKOUT_CREATED":
    case "PAYMENT_STATUS_CHANGED":
    case "PAYMENT_ADMIN_OVERRIDE":
    case "PAYMENT_RECONCILIATION_APPLIED":
      return "payment";
    case "DISPATCH_STARTED":
    case "DISPATCH_EXHAUSTED":
      return "dispatch";
    case "BOOKING_ASSIGNED":
    case "BOOKING_HOLD":
      return "assignment";
    case "OFFER_CREATED":
    case "OFFER_ACCEPTED":
    case "OFFER_REJECTED":
    case "OFFER_EXPIRED":
      return "offer";
    case "CONTROLLED_COMPLETION_AUDIT":
      return "audit";
    default:
      return "other";
  }
}

/** Single-line summary for timelines and support surfaces. */
export function formatOperationalBookingEventHeadline(ev: BookingEvent): string {
  const label = labelOperationalBookingEventType(ev.type);
  const transition =
    ev.fromStatus != null && ev.toStatus != null
      ? ` (${ev.fromStatus} → ${ev.toStatus})`
      : "";
  return `${label}${transition}`;
}
