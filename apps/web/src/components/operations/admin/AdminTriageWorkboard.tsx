import type { PortfolioOperationalSnapshot } from "@/portfolio/portfolioOperationalSelectors";
import { buildAdminWatchlistBuckets } from "@/portfolio/portfolioWatchlistSelectors";

export function AdminTriageWorkboard({
  bookingScreens: _bookingScreens,
  portfolioSnapshot,
}: {
  bookingScreens: unknown[];
  portfolioSnapshot: PortfolioOperationalSnapshot;
}) {
  const buckets = buildAdminWatchlistBuckets(portfolioSnapshot);
  return (
    <section className="mt-8 rounded-xl border border-slate-300 bg-slate-50 p-4">
      <h2 className="text-sm font-semibold text-slate-900">Triage & watchlists (governance-aware)</h2>
      <p className="mt-1 text-xs text-slate-600">
        Buckets tie live booking signals to standards drift, follow-up discipline, and overload risk.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {buckets.map((b) => (
          <div key={b.category} className="rounded-lg border border-white bg-white p-3 text-xs shadow-sm">
            <p className="font-medium text-slate-900">{b.title}</p>
            <p className="mt-1 text-slate-600">{b.managementCue}</p>
            <p className="mt-2 font-mono text-[11px] text-slate-500">
              {b.bookingIds.length ? b.bookingIds.join(", ") : "—"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
