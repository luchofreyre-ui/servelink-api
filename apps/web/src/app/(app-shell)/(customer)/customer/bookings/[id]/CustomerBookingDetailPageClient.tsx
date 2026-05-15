"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { BOOKING_CONFIRMATION_TEAM_PREP_TITLE } from "@/components/marketing/precision-luxury/booking/bookingPublicSurfaceCopy";
import type { BookingRecord } from "@/lib/bookings/bookingApiTypes";
import {
  describePaymentStatusForCustomer,
  displayBookingPrice,
  displayCustomerSafeBookingNotesLines,
  extractCustomerTeamPrepFromBookingNotes,
  formatBookingReferenceLabel,
  formatVisitScheduleHeading,
} from "@/lib/bookings/bookingDisplay";
import { getBookingById } from "@/lib/bookings/bookingStore";

const subtleLink =
  "inline-flex min-h-[44px] items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50";

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

  const assignedLabel =
    booking?.fo?.displayName?.trim() ||
    (booking?.foId ? "Professional cleaner assigning shortly" : "Assignment pending");

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      {loading ? (
        <>
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
          <p className="mt-6 text-slate-600">Loading your visit…</p>
        </>
      ) : booking ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Your visit with Nu Standard
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {formatVisitScheduleHeading(booking.scheduledStart)}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{formatBookingReferenceLabel(booking.id)}</p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Quote on file
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {displayBookingPrice(booking)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Deposit & payment
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {describePaymentStatusForCustomer(booking.paymentStatus)}
                  </p>
                  {booking.paymentStatus === "failed" ? (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      Something interrupted checkout. When you retry below, we&apos;ll pick up where you left
                      off — your confirmation email stays the source of truth once payment clears.
                    </p>
                  ) : null}
                  {showContinuePayment && booking.paymentCheckoutUrl ? (
                    <p className="mt-4">
                      {booking.paymentCheckoutUrl.startsWith("http") ? (
                        <a
                          href={booking.paymentCheckoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                        >
                          Continue secure checkout
                        </a>
                      ) : (
                        <Link
                          href={booking.paymentCheckoutUrl}
                          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                        >
                          Continue secure checkout
                        </Link>
                      )}
                    </p>
                  ) : null}
                  {!booking.paymentCheckoutUrl &&
                  (booking.paymentStatus === "unpaid" || booking.paymentStatus === undefined) ? (
                    <p className="mt-2 text-sm text-slate-600">
                      We&apos;re preparing checkout details — refresh shortly or watch your inbox for the secure
                      link.
                    </p>
                  ) : null}
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Your cleaning partner
                  </p>
                  <p className="mt-1 text-sm text-slate-800">{assignedLabel}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Visits are delivered by owner-led Nu Standard teams—accountability stays with the crew that
                    serves your home, not a faceless dispatch queue.
                  </p>
                </div>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-relaxed text-slate-700">
            <strong className="font-semibold text-slate-900">What happens next:</strong> we&apos;ll email any
            scheduling updates and reminders from the address you used at booking. Reply directly to that thread
            for fastest help — no need to repeat details here.
          </div>

          {teamPrepDetails ? (
            <div
              data-testid="customer-booking-team-prep"
              className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5"
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
            className="mt-6 rounded-xl border border-slate-200 p-4 sm:p-5"
          >
            <h2 className="text-lg font-medium text-slate-900">Between visits</h2>
            <p className="mt-2 text-sm text-slate-600">
              Explore Nu Standard cleaning guides tailored to luxury finishes.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/search" className={subtleLink}>
                Search guides
              </Link>
              <Link href="/encyclopedia" className={subtleLink}>
                Browse encyclopedia
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 p-4 sm:p-5">
            <h2 className="text-lg font-medium text-slate-900">Visit timeline</h2>
            <div className="mt-3 space-y-2">
              {noteLines.length === 0 ? (
                <div className="text-sm text-slate-600">Updates will appear here as your visit progresses.</div>
              ) : (
                noteLines.map((note, index) => (
                  <div
                    key={`${booking.id}-note-${index}`}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm leading-relaxed"
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
          <h1 className="text-2xl font-semibold text-slate-900">We couldn&apos;t open this visit</h1>
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
            {error ?? "Booking not found."}
          </div>

          {id ? (
            <div
              data-testid="customer-booking-knowledge-card"
              className="mt-6 rounded-xl border border-slate-200 p-4 sm:p-5"
            >
              <h2 className="text-lg font-medium text-slate-900">Cleaning guidance</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/search" className={subtleLink}>
                  Search guides
                </Link>
                <Link href="/encyclopedia" className={subtleLink}>
                  Browse encyclopedia
                </Link>
              </div>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
