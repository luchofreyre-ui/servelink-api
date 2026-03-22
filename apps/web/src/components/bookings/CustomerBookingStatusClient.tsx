"use client";

import { BookingPaymentPanel } from "@/components/bookings/BookingPaymentPanel";
import { BookingStatusTimeline } from "@/components/bookings/BookingStatusTimeline";
import { useBookingStatus } from "@/features/bookings/useBookingStatus";

export function CustomerBookingStatusClient(props: { bookingId: string }) {
  const { data, isLoading, error, reload } = useBookingStatus(props.bookingId);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
        Loading booking status...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        {error ?? "Booking status unavailable"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          Booking status
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-50">
          Track your booking and payment in one place
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Review your quote, complete payment securely, and follow the job from scheduling through
          completion.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Booking</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">{data.status}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Payment</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">
            {data.paymentStatus ?? "none"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Quoted total</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">
            {data.quotedTotal != null
              ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(data.quotedTotal)
              : "—"}
          </p>
        </div>
      </div>

      <BookingStatusTimeline booking={data} />
      <BookingPaymentPanel booking={data} onReload={reload} />
    </div>
  );
}
