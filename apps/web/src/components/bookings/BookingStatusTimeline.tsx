import type { BookingStatusResponse } from "@/types/payments";

function getTimelineItems(booking: BookingStatusResponse) {
  return [
    {
      label: "Booked",
      value: booking.scheduledStart ? "Scheduled and received" : "Booking received",
      complete: true,
    },
    {
      label: "Quote",
      value:
        booking.paymentStatus === "none"
          ? "Preparing quote"
          : "Quote available",
      complete:
        booking.paymentStatus === "quote_ready" ||
        booking.paymentStatus === "requires_payment" ||
        booking.paymentStatus === "paid" ||
        booking.paymentStatus === "failed",
    },
    {
      label: "Payment",
      value:
        booking.paymentStatus === "paid"
          ? "Payment complete"
          : booking.paymentStatus === "requires_payment"
            ? "Waiting for payment"
            : booking.paymentStatus === "failed"
              ? "Payment issue"
              : "Not started",
      complete: booking.paymentStatus === "paid",
    },
    {
      label: "Service start",
      value: booking.startedAt ? "Job in progress" : "Waiting to begin",
      complete: Boolean(booking.startedAt),
    },
    {
      label: "Completion",
      value: booking.completedAt ? "Service completed" : "Pending completion",
      complete: Boolean(booking.completedAt),
    },
  ];
}

export function BookingStatusTimeline(props: {
  booking: BookingStatusResponse;
}) {
  const items = getTimelineItems(props.booking);

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-950/90 p-5 text-slate-50 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          Booking Progress
        </p>
        <h3 className="mt-1 text-xl font-semibold text-slate-50">
          Operational timeline
        </h3>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div
              className={`mb-3 h-2 w-10 rounded-full ${
                item.complete ? "bg-emerald-400" : "bg-slate-700"
              }`}
            />
            <p className="text-sm font-semibold text-slate-100">{item.label}</p>
            <p className="mt-1 text-sm text-slate-400">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
        Your booking updates here as payment is completed and service milestones are recorded.
      </div>
    </section>
  );
}
