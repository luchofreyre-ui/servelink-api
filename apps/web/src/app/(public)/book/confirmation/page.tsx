"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchPublicBookingConfirmation } from "@/lib/api/bookings";

function BookingConfirmationInner() {
  const searchParams = useSearchParams();
  const bookingId = searchParams?.get("bookingId") ?? undefined;

  const [remote, setRemote] = useState<Awaited<
    ReturnType<typeof fetchPublicBookingConfirmation>
  > | null>(null);
  const [loading, setLoading] = useState(Boolean(bookingId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setRemote(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchPublicBookingConfirmation(bookingId)
      .then((r) => {
        if (!cancelled) {
          setRemote(r);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setRemote(null);
          setError(e instanceof Error ? e.message : "Could not load booking.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const priceCents = remote?.estimateSnapshot?.estimatedPriceCents;
  const priceLabel =
    typeof priceCents === "number" && Number.isFinite(priceCents)
      ? `$${(priceCents / 100).toFixed(0)}`
      : "—";

  return (
    <main className="min-h-screen px-6 py-10">
      <h1 className="text-2xl font-semibold">Booking Submitted</h1>

      {loading ? (
        <p className="mt-6 text-slate-600">Loading…</p>
      ) : bookingId && remote ? (
        <div className="mt-6 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p>
            <strong>Booking ID:</strong> {remote.bookingId}
          </p>
          <p className="mt-2">
            <strong>Status:</strong>{" "}
            {remote.estimateSnapshot ? "quoted" : "pending"}
          </p>
          <p className="mt-2">
            <strong>Estimate:</strong> {priceLabel}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/customer"
              className="rounded-xl bg-slate-900 px-4 py-3 text-white"
            >
              Go to customer dashboard
            </Link>
            <Link
              href="/book"
              className="rounded-xl border border-slate-300 px-4 py-3"
            >
              Create another booking
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
          {error ?? "Booking confirmation loaded without a booking record."}
        </div>
      )}
    </main>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-6 py-10">
          <h1 className="text-2xl font-semibold">Booking Submitted</h1>
          <p className="mt-4 text-slate-600">Loading…</p>
        </main>
      }
    >
      <BookingConfirmationInner />
    </Suspense>
  );
}
