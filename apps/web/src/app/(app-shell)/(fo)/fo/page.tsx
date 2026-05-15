"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthRoleGate } from "@/components/auth/AuthRoleGate";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import type { BookingRecord } from "@/lib/bookings/bookingApiTypes";
import {
  displayBookingPrice,
  formatBookingReferenceLabel,
  formatVisitScheduleHeading,
} from "@/lib/bookings/bookingDisplay";
import { getAuthUser } from "@/lib/auth/authClient";
import { listBookings } from "@/lib/bookings/bookingStore";

function FOHomeContent() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const user = getAuthUser();
    void listBookings({
      view: "fo",
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
          setLoadError(e instanceof Error ? e.message : "Failed to load queue.");
          setBookings([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Nu Standard · Partner queue
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Today&apos;s visits</h1>
      <p className="mt-2 text-sm text-slate-600">
        {bookings.length === 0
          ? "No assignments yet — new visits appear automatically when dispatch routes them to you."
          : `${bookings.length} active assignment${bookings.length === 1 ? "" : "s"} ready for prep.`}
      </p>

      {loadError ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {loadError}
        </p>
      ) : null}

      <div className="mt-8 space-y-4">
        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <p className="text-base font-medium text-slate-900">You&apos;re caught up</p>
            <p className="mt-2 text-sm text-slate-600">
              Refresh after dispatch assigns the next visit — everything routes here in real time.
            </p>
          </div>
        ) : (
          bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/fo/bookings/${booking.id}`}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-lg font-semibold text-slate-900">
                  {formatVisitScheduleHeading(booking.scheduledStart)}
                </p>
                <p className="text-sm text-slate-600">
                  {displayBookingPrice(booking)}
                  {booking.customer?.email ? ` · ${booking.customer.email}` : ""}
                </p>
                <p className="text-xs text-slate-500">{formatBookingReferenceLabel(booking.id)}</p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </Link>
          ))
        )}
      </div>
    </main>
  );
}

export default function FOPage() {
  return (
    <AuthRoleGate role="fo">
      <FOHomeContent />
    </AuthRoleGate>
  );
}
