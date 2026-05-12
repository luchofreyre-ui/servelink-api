import type { BookingRecord } from "@/lib/bookings/bookingApiTypes";
import {
  categorizeOperationalBookingEventType,
  formatOperationalBookingEventHeadline,
  type OperationalBookingEventCategory,
} from "@/lib/operational/operationalBookingEvents";

/** Rows suitable for sorted/support timelines — derived only from persisted events. */
export type OperationalTraceTimelineRow = {
  id: string;
  category: OperationalBookingEventCategory;
  headline: string;
};

export function buildOperationalTraceTimeline(
  booking: BookingRecord,
): OperationalTraceTimelineRow[] {
  return (booking.events ?? []).map((ev) => ({
    id: ev.id,
    category: categorizeOperationalBookingEventType(ev.type),
    headline: formatOperationalBookingEventHeadline(ev),
  }));
}