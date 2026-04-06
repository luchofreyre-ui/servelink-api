"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthRoleGate } from "@/components/auth/AuthRoleGate";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import type { BookingRecord } from "@/lib/bookings/bookingApiTypes";
import { displayBookingPrice } from "@/lib/bookings/bookingDisplay";
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
    <main className="min-h-screen px-6 py-10">
      <h1 className="text-2xl font-semibold">My Work</h1>
      <p>Queue rows: {bookings.length}</p>

      {loadError ? (
        <p className="mt-4 text-sm text-amber-700">{loadError}</p>
      ) : null}

      <div className="mt-8 space-y-4">
        {bookings.length === 0 ? (
          <div className="rounded-xl border border-slate-200 p-4">
            No assigned bookings yet.
          </div>
        ) : (
          bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/fo/bookings/${booking.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
            >
              <div>
                <p className="font-medium">{booking.id}</p>
                <p className="text-sm text-slate-600">
                  {displayBookingPrice(booking)} · customer {booking.customerId.slice(0, 8)}…
                </p>
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
