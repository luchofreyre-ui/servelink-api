import type { PortfolioOperationalSnapshot } from "@/portfolio/portfolioOperationalSelectors";

export function AdminFleetRiskSummaryCard({
  snapshot,
}: {
  snapshot: PortfolioOperationalSnapshot;
}) {
  const f = snapshot.fleetRollup;
  const n = Math.max(f.totalBookings, 1);
  const pct = (c: number) => Math.round((c / n) * 100);

  return (
    <section className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Fleet risk snapshot</h2>
      <ul className="mt-3 grid gap-2 text-xs text-slate-800 sm:grid-cols-2">
        <li className="rounded-lg bg-white p-2 ring-1 ring-rose-100">
          No acceptance: {pct(f.noAcceptanceCount)}%
        </li>
        <li className="rounded-lg bg-white p-2 ring-1 ring-rose-100">
          SLA miss: {pct(f.slaMissCount)}%
        </li>
        <li className="rounded-lg bg-white p-2 ring-1 ring-rose-100">
          Offer expired: {pct(f.offerExpiredCount)}%
        </li>
        <li className="rounded-lg bg-white p-2 ring-1 ring-rose-100">
          Overload risk: {pct(f.overloadRiskCount)}%
        </li>
      </ul>
      <p className="mt-3 text-xs text-slate-600">
        Flagged bookings: {f.flaggedBookings} of {f.totalBookings} in view (normalized operational
        contract).
      </p>
    </section>
  );
}
