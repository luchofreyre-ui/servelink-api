"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthRoleGate } from "@/components/auth/AuthRoleGate";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { getAuthUser } from "@/lib/auth/authClient";
import type { BookingRecord } from "@/lib/bookings/bookingApiTypes";
import {
  displayBookingPrice,
  formatBookingReferenceLabel,
  formatVisitScheduleHeading,
} from "@/lib/bookings/bookingDisplay";
import { listBookings } from "@/lib/bookings/bookingStore";
import { NU_STANDARD_OWNER_OPERATOR_SUMMARY } from "@/components/marketing/precision-luxury/content/nuStandardTrustPositioning";

function CustomerDashboardContent() {
  const user = typeof window !== "undefined" ? getAuthUser() : null;

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) {
      setBookings([]);
      return;
    }
    let cancelled = false;
    void listBookings({
      view: "customer",
      userId: user?.id,
    })
      .then((rows) => {
        if (!cancelled) {
          setBookings(rows);
          setLoadError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load bookings.");
          setBookings([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Nu Standard · Customer home
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Your visits</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Every reservation lives here — schedules, deposits, and concierge notes stay in sync with what our team sees.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
        {NU_STANDARD_OWNER_OPERATOR_SUMMARY}
      </p>

      {loadError ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {loadError}
        </p>
      ) : null}

      <div
        data-testid="customer-dashboard-knowledge-card"
        className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm sm:p-6"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Nu Standard library</h2>
        <p className="mt-2 text-sm text-slate-600">
          Prefer to prep before we arrive? Browse trusted cleaning guidance written for fine homes.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/search"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white"
          >
            Search guides
          </Link>
          <Link
            href="/encyclopedia"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white"
          >
            Browse encyclopedia
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
            <p className="text-base font-medium text-slate-900">No visits booked yet</p>
            <p className="mt-2 text-sm text-slate-600">
              Ready when you are — booking takes just a few calm minutes.
            </p>
            <Link
              href="/book"
              className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Start a booking
            </Link>
          </div>
        ) : (
          bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/customer/bookings/${booking.id}`}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-lg font-semibold text-slate-900">
                  {formatVisitScheduleHeading(booking.scheduledStart)}
                </p>
                <p className="text-sm text-slate-600">
                  {displayBookingPrice(booking)} · {formatBookingReferenceLabel(booking.id)}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </Link>
          ))
        )}
      </div>

      <p className="mt-10 text-center text-xs text-slate-500">
        Need help with billing or scheduling? Reply to your Nu Standard confirmation email — our concierge monitors
        that thread first.
      </p>
    </main>
  );
}

export default function CustomerPage() {
  return (
    <AuthRoleGate role="customer">
      <CustomerDashboardContent />
    </AuthRoleGate>
  );
}
