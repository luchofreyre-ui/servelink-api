"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { BOOKING_CONFIRMATION_TEAM_PREP_TITLE } from "@/components/marketing/precision-luxury/booking/bookingPublicSurfaceCopy";
import type { BookingRecord } from "@/lib/bookings/bookingApiTypes";
import {
  displayBookingPrice,
  displayCustomerSafeBookingNotesLines,
  extractCustomerTeamPrepFromBookingNotes,
} from "@/lib/bookings/bookingDisplay";
import { getBookingById } from "@/lib/bookings/bookingStore";

export function CustomerBookingDetailPageContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setBooking(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void getBookingById(id)
      .then((b) => {
        if (!cancelled) {
          setBooking(b);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setBooking(null);
          setError(e instanceof Error ? e.message : "Booking not found.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      void getBookingById(id)
        .then((b) => setBooking(b))
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [id]);

  const noteLines = booking
    ? displayCustomerSafeBookingNotesLines(booking.notes)
    : [];
  const teamPrepDetails = booking
    ? extractCustomerTeamPrepFromBookingNotes(booking.notes)
    : null;

  const ps = booking?.paymentStatus;
  const paymentConfirmed =
    ps === "paid" || ps === "authorized" || ps === "waived";
  const showContinuePayment =
    Boolean(booking?.paymentCheckoutUrl) &&
    !paymentConfirmed &&
    (ps === "checkout_created" ||
      ps === "payment_pending" ||
      ps === "unpaid" ||
      ps === undefined);

  return (
    <main className="min-h-screen px-6 py-10">
      <h1 className="text-2xl font-semibold">Booking Detail</h1>

      {loading ? (
        <p className="mt-6 text-slate-600">Loading…</p>
      ) : booking ? (
        <>
          <div className="mt-6 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p><strong>ID:</strong> {booking.id}</p>
                <p className="mt-2">
                  <strong>Total on file:</strong> {displayBookingPrice(booking)}
                </p>
                <p className="mt-2">
                  <strong>Payment:</strong> {String(booking.paymentStatus ?? "—")}
                </p>
                {booking.paymentStatus === "failed" ? (
                  <p className="mt-2 text-sm text-slate-600">
                    Payment failed. If checkout is still available below, you can try again — confirmation
                    always follows the server payment status, not this page alone.
                  </p>
                ) : null}
                {showContinuePayment && booking.paymentCheckoutUrl ? (
                  <p className="mt-2">
                    {booking.paymentCheckoutUrl.startsWith("http") ? (
                      <a
                        href={booking.paymentCheckoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-slate-900 underline"
                      >
                        Continue payment (Stripe Checkout)
                      </a>
                    ) : (
                      <Link
                        href={booking.paymentCheckoutUrl}
                        className="font-medium text-slate-900 underline"
                      >
                        Continue payment
                      </Link>
                    )}
                  </p>
                ) : null}
                {!booking.paymentCheckoutUrl &&
                (booking.paymentStatus === "unpaid" ||
                  booking.paymentStatus === undefined) ? (
                  <p className="mt-2 text-sm text-slate-600">
                    Payment pending setup.
                  </p>
                ) : null}
                <p className="mt-2">
                  <strong>Franchise owner:</strong> {booking.foId ?? "Unassigned"}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
          </div>

          {teamPrepDetails ? (
            <div
              data-testid="customer-booking-team-prep"
              className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4"
            >
              <h2 className="text-lg font-medium text-slate-900">
                {BOOKING_CONFIRMATION_TEAM_PREP_TITLE}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {teamPrepDetails}
              </p>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                For your crew on arrival — not used to change your quoted visit total.
              </p>
            </div>
          ) : null}

          <div
            data-testid="customer-booking-knowledge-card"
            className="mt-6 rounded-xl border border-slate-200 p-4"
          >
            <h2 className="text-lg font-medium">Need cleaning guidance?</h2>
            <div className="mt-3 flex gap-3">
              <Link href="/search">Search</Link>
              <Link href="/encyclopedia">Browse</Link>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 p-4">
            <h2 className="text-lg font-medium">Booking Timeline</h2>
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
            {error ?? "Booking not found."}
          </div>

          {id ? (
            <div
              data-testid="customer-booking-knowledge-card"
              className="mt-6 rounded-xl border border-slate-200 p-4"
            >
              <h2 className="text-lg font-medium">Need cleaning guidance?</h2>
              <div className="mt-3 flex gap-3">
                <Link href="/search">Search</Link>
                <Link href="/encyclopedia">Browse</Link>
              </div>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
