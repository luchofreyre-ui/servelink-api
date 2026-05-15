"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthRoleGate } from "@/components/auth/AuthRoleGate";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { getAuthUser } from "@/lib/auth/authClient";
import type { BookingRecord } from "@/lib/bookings/bookingApiTypes";
import { displayBookingPrice } from "@/lib/bookings/bookingDisplay";
import { listBookings } from "@/lib/bookings/bookingStore";
import { NU_STANDARD_OWNER_OPERATOR_SUMMARY } from "@/components/marketing/precision-luxury/content/nuStandardTrustPositioning";

function formatVisitScheduleLabel(iso?: string | null): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Your Nu Standard visits
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
        {NU_STANDARD_OWNER_OPERATOR_SUMMARY}
      </p>

      {loadError ? (
        <p className="mt-4 text-sm text-amber-700">{loadError}</p>
      ) : null}

      <div
        data-testid="customer-dashboard-knowledge-card"
        className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
      >
        <h2 className="text-lg font-medium text-slate-900">Between visits</h2>
        <p className="mt-1 text-sm text-slate-600">
          Practical guidance when you want it—separate from how your owner-led team executes each visit.
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link href="/search" className="text-sm font-medium text-teal-800 underline">
            Search guides
          </Link>
          <Link href="/encyclopedia" className="text-sm font-medium text-teal-800 underline">
            Browse encyclopedia
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
            <p className="text-sm font-medium text-slate-900">No visits on file yet.</p>
            <p className="mt-2 text-sm text-slate-600">
              When you book, your summary appears here with scheduling context and payment status.
            </p>
            <Link
              href="/book"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-[#0D9488] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Reserve a visit
            </Link>
          </div>
        ) : (
          bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/customer/bookings/${booking.id}`}
              className="flex min-h-[52px] items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50/80"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">
                  {formatVisitScheduleLabel(booking.scheduledStart) ?? "Visit scheduling"}
                </p>
                <p className="mt-1 truncate text-sm text-slate-600">
                  {displayBookingPrice(booking)} · Owner-led Nu Standard team
                  {booking.id.length > 6 ? ` · Ref …${booking.id.slice(-6)}` : ""}
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
