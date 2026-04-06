"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthRoleGate } from "@/components/auth/AuthRoleGate";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import type { AdminPaymentOpsSummary, BookingRecord } from "@/lib/bookings/bookingApiTypes";
import { displayBookingPrice } from "@/lib/bookings/bookingDisplay";
import {
  getAdminPaymentOpsSummary,
  listAdminPaymentAnomalies,
  listBookings,
} from "@/lib/bookings/bookingStore";

function AdminDashboardContent() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paymentOps, setPaymentOps] = useState<AdminPaymentOpsSummary | null>(null);
  const [paymentOpsError, setPaymentOpsError] = useState<string | null>(null);
  const [latestAnomalies, setLatestAnomalies] = useState<
    { id: string; bookingId: string | null; kind: string; message: string; detectedAt: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    void listBookings({ view: "dispatch" })
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getAdminPaymentOpsSummary(), listAdminPaymentAnomalies()])
      .then(([summary, anomalies]) => {
        if (!cancelled) {
          setPaymentOps(summary);
          setLatestAnomalies(anomalies.slice(0, 5));
          setPaymentOpsError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setPaymentOpsError(e instanceof Error ? e.message : "Failed to load payment ops.");
          setPaymentOps(null);
          setLatestAnomalies([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen px-6 py-10">
      <h1 className="text-2xl font-semibold">
        Operations Control Center
      </h1>

      {loadError ? (
        <p className="mt-4 text-sm text-amber-700">{loadError}</p>
      ) : null}

      <section
        className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4"
        aria-label="Payment operations"
      >
        <h2 className="text-lg font-medium">Payment operations</h2>
        <p className="mt-1 text-sm text-slate-600">
          Single Stripe ingress (POST /api/v1/stripe/webhook): webhook health, anomalies, and stuck
          checkouts (read-only; computed on load). Older anomaly rows may reference legacy paths.
        </p>
        {paymentOpsError ? (
          <p className="mt-3 text-sm text-amber-700">{paymentOpsError}</p>
        ) : paymentOps ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Open anomalies</div>
              <div className="mt-1 font-semibold text-slate-900">{paymentOps.openAnomalyCount}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Webhook failures (24h)
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {paymentOps.recentWebhookFailureCount}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Stuck pending (&gt;30m)
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {paymentOps.stuckPendingPaymentShortCount}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Duplicate events (7d)
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {paymentOps.duplicateWebhookRecentCount}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Loading payment metrics…</p>
        )}
        {latestAnomalies.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-800">Latest open anomalies</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {latestAnomalies.map((a) => (
                <li key={a.id} className="flex flex-wrap gap-x-2 border-b border-slate-100 pb-2 last:border-0">
                  <span className="font-mono text-xs text-slate-500">{a.kind}</span>
                  {a.bookingId ? (
                    <Link
                      href={`/admin/bookings/${encodeURIComponent(a.bookingId)}`}
                      className="text-blue-700 underline"
                    >
                      {a.bookingId.slice(0, 12)}…
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                  <span className="text-slate-600">{a.message}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-medium">
          Recent Dispatch Exceptions
        </h2>

        <div className="mt-4 text-sm text-slate-600">
          No recent exceptions.
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Recent admin activity</h2>
        <div className="mt-4 text-sm text-slate-600">
          No recent activity.
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Recent Bookings</h2>

        <div className="mt-4 space-y-3">
          {bookings.length === 0 ? (
            <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
              No bookings recorded yet.
            </div>
          ) : (
            bookings.slice(0, 8).map((booking) => (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
              >
                <div>
                  <p className="font-medium">{booking.id}</p>
                  <p className="text-sm text-slate-600">
                    {booking.foId ? (
                      <>
                        FO {String(booking.foId).slice(0, 10)}
                        {String(booking.foId).length > 10 ? "…" : ""}
                      </>
                    ) : (
                      <span className="font-medium text-amber-800">Unassigned</span>
                    )}
                    {" · "}
                    {booking.customerId.slice(0, 8)}… · {displayBookingPrice(booking)}
                  </p>
                  {!booking.foId ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Open booking detail for ranked assignees and one-click assign.
                    </p>
                  ) : null}
                </div>
                <BookingStatusBadge status={booking.status} />
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

export default function AdminRootPage() {
  return (
    <AuthRoleGate role="admin">
      <AdminDashboardContent />
    </AuthRoleGate>
  );
}
