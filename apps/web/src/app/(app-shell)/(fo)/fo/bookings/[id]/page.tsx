"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthRoleGate } from "@/components/auth/AuthRoleGate";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { OpsCustomerTeamPrepSection } from "@/components/booking-detail/ops/OpsCustomerTeamPrepSection";
import type { BookingRecord } from "@/lib/bookings/bookingApiTypes";
import {
  displayBookingPrice,
  displayOpsBookingNotesLines,
  extractTeamPrepFromBookingNotes,
  formatBookingReferenceLabel,
  formatVisitScheduleHeading,
} from "@/lib/bookings/bookingDisplay";
import { getBookingById, transitionBooking } from "@/lib/bookings/bookingStore";

function FOBookingDetailContent() {
  const params = useParams<{ id: string }>();
  const bookingId = params?.id ?? "";

  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitionError, setTransitionError] = useState<string | null>(null);

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
    setTransitionError(null);
    try {
      const updated = await transitionBooking(booking.id, {
        transition: action,
        note: action === "start" ? "FO started work" : "FO completed work",
      });
      setBooking(updated);
    } catch (error) {
      setTransitionError(
        error instanceof Error ? error.message : "Unable to update booking.",
      );
    }
  }

  const linkBookingId = booking?.id ?? bookingId;
  const teamPrepDetails = booking ? extractTeamPrepFromBookingNotes(booking.notes) : null;
  const noteLines = booking ? displayOpsBookingNotesLines(booking.notes) : [];

  return (
    <main data-testid="fo-booking-detail-shell" className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Nu Standard · Partner workspace
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        Visit detail
      </h1>

      {loading ? (
        <p className="mt-6 text-slate-600">Loading booking…</p>
      ) : booking ? (
        <>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="text-lg font-semibold text-slate-900">
                  {formatVisitScheduleHeading(booking.scheduledStart)}
                </p>
                <p className="text-sm text-slate-600">{formatBookingReferenceLabel(booking.id)}</p>
                <p className="text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Estimate:</span>{" "}
                  {displayBookingPrice(booking)}
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Guest:</span>{" "}
                  {booking.customer?.email ??
                    (booking.customerId ? `Account ${booking.customerId.slice(0, 6)}…` : "—")}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void updateStatus("start")}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Start on-site work
              </button>
              <button
                type="button"
                onClick={() => void updateStatus("complete")}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Mark visit complete
              </button>
            </div>

            {transitionError ? (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
              >
                {transitionError}
              </div>
            ) : null}
          </div>

          {teamPrepDetails ? (
            <div className="mt-6">
              <OpsCustomerTeamPrepSection
                variant="light"
                teamPrepDetails={teamPrepDetails}
                testId="fo-booking-team-prep"
              />
            </div>
          ) : null}

          <div data-testid="fo-booking-knowledge-guidance" className="mt-6 rounded-xl border border-slate-200 p-4 sm:p-5">
            <h2 className="text-lg font-medium text-slate-900">Knowledge shortcuts</h2>

            <div data-testid="fo-booking-knowledge-actions" className="mt-4 flex flex-wrap gap-3">
              <Link
                data-testid="fo-booking-open-quick-solve"
                href={`/fo/knowledge?focusQuickSolve=1&surfaceId=glass_shower_door&problemId=soap_scum&severity=heavy&bookingId=${linkBookingId}`}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                Open Quick Solve
              </Link>

              <Link
                data-testid="fo-booking-search-knowledge"
                href={`/fo/knowledge?bookingId=${linkBookingId}&query=${encodeURIComponent("soap scum glass shower door")}`}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                Search Knowledge
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 p-4 sm:p-5">
            <h2 className="text-lg font-medium text-slate-900">Timeline</h2>
            <div className="mt-3 space-y-2">
              {noteLines.length === 0 ? (
                <div className="text-sm text-slate-600">No updates yet.</div>
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
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
            Booking not found.
          </div>

          {bookingId ? (
            <div data-testid="fo-booking-knowledge-guidance" className="mt-6 rounded-xl border border-slate-200 p-4 sm:p-5">
              <h2 className="text-lg font-medium text-slate-900">Knowledge Guidance</h2>

              <div data-testid="fo-booking-knowledge-actions" className="mt-4 flex flex-wrap gap-3">
                <Link
                  data-testid="fo-booking-open-quick-solve"
                  href={`/fo/knowledge?focusQuickSolve=1&surfaceId=glass_shower_door&problemId=soap_scum&severity=heavy&bookingId=${linkBookingId}`}
                  className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                >
                  Open Quick Solve
                </Link>

                <Link
                  data-testid="fo-booking-search-knowledge"
                  href={`/fo/knowledge?bookingId=${linkBookingId}&query=${encodeURIComponent("soap scum glass shower door")}`}
                  className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
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
