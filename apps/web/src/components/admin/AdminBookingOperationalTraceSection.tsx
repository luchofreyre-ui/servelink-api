"use client";

import type { BookingRecord } from "@/lib/bookings/bookingApiTypes";
import {
  countOperationalBookingEventsByCategory,
  formatOperationalBookingEventHeadline,
  groupBookingEventsByOperationalCategory,
  labelOperationalEventCategory,
  OPERATIONAL_EVENT_CATEGORY_ORDER,
} from "@/lib/operational/operationalBookingEvents";
import { buildSupportInterpretationFromLatestEvent } from "@/lib/operational/supportOperationalNarrative";

type Props = {
  booking: BookingRecord;
};

/**
 * Dark-themed operational trace aligned with customer/FO helpers — dispatch timeline stays separate.
 */
export function AdminBookingOperationalTraceSection({ booking }: Props) {
  const counts = countOperationalBookingEventsByCategory(booking.events);
  const grouped = groupBookingEventsByOperationalCategory(booking.events);
  const total = booking.events?.length ?? 0;
  const summary = OPERATIONAL_EVENT_CATEGORY_ORDER.filter((c) => counts[c] > 0)
    .map((c) => `${labelOperationalEventCategory(c)}: ${counts[c]}`)
    .join(" · ");
  const supportLine = buildSupportInterpretationFromLatestEvent(booking);

  return (
    <section
      data-testid="admin-booking-operational-trace"
      className="rounded-[28px] border border-white/10 bg-white/5 p-6"
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Operational trace (booking events)</h2>
        <p className="mt-1 text-sm text-white/60">
          Same category buckets and headlines as customer/FO portals — grouped for operator review. Dispatch machine timeline remains in &ldquo;Dispatch timeline&rdquo; below.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-white/45">Booking status</div>
          <div className="mt-2 text-sm font-semibold text-white">{booking.status}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-white/45">Payment status</div>
          <div className="mt-2 text-sm font-semibold text-white">
            {String(booking.paymentStatus ?? "—")}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-white/45">Events loaded</div>
          <div className="mt-2 text-sm font-semibold text-white">{total}</div>
        </div>
      </div>

      {summary ? (
        <p className="mt-4 text-xs leading-5 text-white/55">{summary}</p>
      ) : (
        <p className="mt-4 text-xs leading-5 text-white/55">
          No booking events on this payload — confirm GET uses <code className="rounded bg-black/50 px-1">includeEvents=true</code>.
        </p>
      )}

      {supportLine ? (
        <p className="mt-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs leading-5 text-white/70">
          {supportLine}
        </p>
      ) : null}

      {total > 0 ? (
        <div className="mt-6 space-y-5 border-t border-white/10 pt-5">
          <h3 className="text-sm font-semibold text-white">By category</h3>
          {OPERATIONAL_EVENT_CATEGORY_ORDER.map((cat) => {
            const rows = grouped[cat];
            if (!rows.length) return null;
            const tail = rows.slice(-10);
            return (
              <div key={cat}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-white/45">
                  {labelOperationalEventCategory(cat)}
                </h4>
                <ul className="mt-2 space-y-2 text-sm text-white/80">
                  {tail.map((ev) => (
                    <li
                      key={ev.id}
                      className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                    >
                      {formatOperationalBookingEventHeadline(ev)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
