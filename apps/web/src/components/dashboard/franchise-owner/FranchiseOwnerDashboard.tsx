import type { RoleTheme } from "@/lib/role-theme";
import type { FranchiseOwnerDashboardViewModel } from "@/dashboard/franchise-owner/franchiseOwnerDashboardViewModel";
import type { PortfolioOperationalSnapshot } from "@/portfolio/portfolioOperationalSelectors";
import {
  buildFranchiseOwnerOperatingProfile,
  pickPrimaryFoId,
} from "@/portfolio/foOperatingProfileSelectors";
import { FranchiseOwnerOperatingProfileCard } from "@/components/portfolio/franchise-owner/FranchiseOwnerOperatingProfileCard";
import { FranchiseOwnerImprovementFocusCard } from "@/components/portfolio/franchise-owner/FranchiseOwnerImprovementFocusCard";

function humanizeCountLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

export function FranchiseOwnerDashboard({
  theme,
  vm,
  bookingScreens: _bookingScreens,
  portfolioSnapshot,
}: {
  theme: RoleTheme;
  vm: FranchiseOwnerDashboardViewModel;
  bookingScreens: unknown[];
  portfolioSnapshot: PortfolioOperationalSnapshot;
}) {
  const foId = pickPrimaryFoId(portfolioSnapshot.bookingSignals);
  const profile = buildFranchiseOwnerOperatingProfile(
    portfolioSnapshot.bookingSignals,
    foId,
  );
  const summaryRows = Object.entries(vm.counts)
    .filter(([, value]) => typeof value === "number" || typeof value === "string")
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Owner operations
        </p>
        <h1 className={`mt-2 text-2xl font-bold tracking-tight ${theme.accent}`}>My work</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          A focused view of today&apos;s work, service consistency, and the improvement signals that
          matter most for your portfolio.
        </p>
        <p className="mt-3 text-xs font-medium text-slate-500">
          {vm.queue.rows.length > 0
            ? `${vm.queue.rows.length} operational update${vm.queue.rows.length === 1 ? "" : "s"} ready for review`
            : "No operational updates need review right now"}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <FranchiseOwnerOperatingProfileCard profile={profile} />
        <FranchiseOwnerImprovementFocusCard profile={profile} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm sm:p-6">
        <p className="font-semibold text-slate-900">Work summary</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Key operating counts translated into a quick owner view.
        </p>
        {summaryRows.length > 0 ? (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {summaryRows.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  {humanizeCountLabel(key)}
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{String(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
            <p className="font-medium text-slate-800">No work summary is available yet.</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              When portfolio activity is available, this space will summarize it without exposing raw
              internal data.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
