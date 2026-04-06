"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthRoleGate } from "@/components/auth/AuthRoleGate";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { getAuthUser } from "@/lib/auth/authClient";
import type { BookingRecord } from "@/lib/bookings/bookingApiTypes";
import { displayBookingPrice } from "@/lib/bookings/bookingDisplay";
import { listBookings } from "@/lib/bookings/bookingStore";

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
    <main className="min-h-screen px-6 py-10">
      <h1 className="text-2xl font-semibold">Your Bookings</h1>
      <p className="text-sm text-slate-600">Customer-safe view</p>

      {loadError ? (
        <p className="mt-4 text-sm text-amber-700">{loadError}</p>
      ) : null}

      <div
        data-testid="customer-dashboard-knowledge-card"
        className="mt-6 rounded-xl border border-slate-200 p-4"
      >
        <h2 className="text-lg font-medium">Cleaning Encyclopedia</h2>
        <div className="mt-3 flex gap-3">
          <Link href="/search">Search</Link>
          <Link href="/encyclopedia">Browse</Link>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {bookings.length === 0 ? (
          <div className="rounded-xl border border-slate-200 p-4">
            No bookings yet.
          </div>
        ) : (
          bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/customer/bookings/${booking.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
            >
              <div>
                <p className="font-medium">{booking.id}</p>
                <p className="text-sm text-slate-600">
                  {displayBookingPrice(booking)} · FO {booking.foId ?? "Unassigned"}
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

export default function CustomerPage() {
  return (
    <AuthRoleGate role="customer">
      <CustomerDashboardContent />
    </AuthRoleGate>
  );
}
