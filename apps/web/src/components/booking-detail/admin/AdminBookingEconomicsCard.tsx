import type { AdminBookingDispatchEconomics } from "@/operations/adminBookingDispatch/adminBookingDispatchDetailModel";

function formatMoney(value?: number): string {
  if (value === undefined) return "Unknown";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value?: number): string {
  if (value === undefined) return "Unknown";
  return `${Math.round(value)}%`;
}

function bandClasses(band: AdminBookingDispatchEconomics["economicsBand"]): string {
  if (band === "strong") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (band === "acceptable") return "border-blue-200 bg-blue-50 text-blue-900";
  if (band === "thin") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-900";
}

export default function AdminBookingEconomicsCard({
  economics,
}: {
  economics: AdminBookingDispatchEconomics;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Economics
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Money impact of the dispatch decision
          </h2>
        </div>
        <div
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${bandClasses(economics.economicsBand)}`}
        >
          {economics.economicsBand === "unknown"
            ? "Unknown economics"
            : `${economics.economicsBand[0].toUpperCase()}${economics.economicsBand.slice(1)} economics`}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-700">{economics.headline}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Customer Total</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {formatMoney(economics.customerTotal)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">FO Payout</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {formatMoney(economics.franchiseOwnerPayout)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cleaner Payout</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {formatMoney(economics.cleanerPayout)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Platform Revenue</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {formatMoney(economics.platformRevenue)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Margin</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {formatPercent(economics.marginPercent)}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Operating notes
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {economics.notes.length > 0 ? (
            economics.notes.map((note) => (
              <span
                key={note}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700"
              >
                {note}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">No economics notes available.</span>
          )}
        </div>
      </div>
    </section>
  );
}
