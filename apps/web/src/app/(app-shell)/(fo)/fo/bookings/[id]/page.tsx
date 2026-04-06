"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthRoleGate } from "@/components/auth/AuthRoleGate";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import type { BookingRecord } from "@/lib/bookings/bookingApiTypes";
import { displayBookingNotesLines, displayBookingPrice } from "@/lib/bookings/bookingDisplay";
import { getBookingById, transitionBooking } from "@/lib/bookings/bookingStore";

function FOBookingDetailContent() {
  const params = useParams<{ id: string }>();
  const bookingId = params?.id ?? "";

  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setBooking(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void getBookingById(bookingId)
      .then((b) => {
        if (!cancelled) setBooking(b);
      })
      .catch(() => {
        if (!cancelled) setBooking(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  async function updateStatus(action: "start" | "complete") {
    if (!booking) return;

    try {
      const updated = await transitionBooking(booking.id, {
        transition: action,
        note: action === "start" ? "FO started work" : "FO completed work",
      });
      setBooking(updated);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to update booking.");
    }
  }

  const linkBookingId = booking?.id ?? bookingId;
  const noteLines = booking ? displayBookingNotesLines(booking) : [];

  return (
    <main data-testid="fo-booking-detail-shell" className="min-h-screen px-6 py-10">
      <h1 className="text-2xl font-semibold">FO Booking Detail</h1>

      {loading ? (
        <p className="mt-6 text-slate-600">Loading…</p>
      ) : booking ? (
        <>
          <div className="mt-6 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p><strong>ID:</strong> {booking.id}</p>
                <p className="mt-2"><strong>Customer:</strong> {booking.customerId}</p>
                <p className="mt-2"><strong>Estimate:</strong> {displayBookingPrice(booking)}</p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => void updateStatus("start")}
                className="rounded-xl border border-slate-300 px-4 py-2"
              >
                Start Job
              </button>
              <button
                type="button"
                onClick={() => void updateStatus("complete")}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-white"
              >
                Mark Complete
              </button>
            </div>
          </div>

          <div data-testid="fo-booking-knowledge-guidance" className="mt-6 rounded-xl border border-slate-200 p-4">
            <h2 className="text-lg font-medium">Knowledge Guidance</h2>

            <div data-testid="fo-booking-knowledge-actions" className="mt-3 flex gap-3">
              <Link
                data-testid="fo-booking-open-quick-solve"
                href={`/fo/knowledge?focusQuickSolve=1&surfaceId=glass_shower_door&problemId=soap_scum&severity=heavy&bookingId=${linkBookingId}`}
              >
                Open Quick Solve
              </Link>

              <Link
                data-testid="fo-booking-search-knowledge"
                href={`/fo/knowledge?bookingId=${linkBookingId}&query=${encodeURIComponent("soap scum glass shower door")}`}
              >
                Search Knowledge
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 p-4">
            <h2 className="text-lg font-medium">Timeline</h2>
            <div className="mt-3 space-y-2">
              {noteLines.length === 0 ? (
                <div className="text-sm text-slate-600">No updates yet.</div>
              ) : (
                noteLines.map((note, index) => (
                  <div
                    key={`${booking.id}-note-${index}`}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm"
                  >
                    {note}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            Booking not found.
          </div>

          {bookingId ? (
            <div data-testid="fo-booking-knowledge-guidance" className="mt-6 rounded-xl border border-slate-200 p-4">
              <h2 className="text-lg font-medium">Knowledge Guidance</h2>

              <div data-testid="fo-booking-knowledge-actions" className="mt-3 flex gap-3">
                <Link
                  data-testid="fo-booking-open-quick-solve"
                  href={`/fo/knowledge?focusQuickSolve=1&surfaceId=glass_shower_door&problemId=soap_scum&severity=heavy&bookingId=${linkBookingId}`}
                >
                  Open Quick Solve
                </Link>

                <Link
                  data-testid="fo-booking-search-knowledge"
                  href={`/fo/knowledge?bookingId=${linkBookingId}&query=${encodeURIComponent("soap scum glass shower door")}`}
                >
                  Search Knowledge
                </Link>
              </div>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}

export default function FOBookingDetailPage() {
  return (
    <AuthRoleGate role="fo">
      <FOBookingDetailContent />
    </AuthRoleGate>
  );
}
