import type { AdminBookingDispatchSummary } from "@/operations/adminBookingDispatch/adminBookingDispatchDetailModel";

function toneClasses(signalCount: number) {
  if (signalCount >= 3) {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }
  if (signalCount >= 1) {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-900";
}

export default function AdminBookingDispatchHeaderCard({
  summary,
}: {
  summary: AdminBookingDispatchSummary;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Booking Dispatch Detail
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              {summary.serviceLabel}
            </h1>
          </div>

          <p className="max-w-3xl text-sm leading-6 text-slate-700">
            {summary.dispatchHeadline}
          </p>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Booking</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{summary.bookingId}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Customer</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{summary.customerName}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Location</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{summary.locationLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Scheduled Start</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{summary.scheduledStartLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{summary.statusLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assigned FO</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {summary.assignedFoLabel ?? "Not assigned"}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`min-w-[260px] rounded-3xl border px-5 py-4 ${toneClasses(
            summary.signalFlags.length,
          )}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em]">
            Portfolio Signal Pressure
          </p>
          <p className="mt-2 text-3xl font-semibold">{summary.signalFlags.length}</p>
          <p className="mt-1 text-sm">
            {summary.signalFlags.length === 0
              ? "No active signal pressure."
              : "Active execution or governance signals are affecting this dispatch path."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {summary.signalFlags.length === 0 ? (
              <span className="rounded-full border border-emerald-300 bg-white/70 px-3 py-1 text-xs font-medium">
                Stable path
              </span>
            ) : (
              summary.signalFlags.map((flag) => (
                <span
                  key={flag}
                  className="rounded-full border border-current/25 bg-white/70 px-3 py-1 text-xs font-medium"
                >
                  {flag}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
