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
      <header>
        <h1 className={`text-xl font-bold ${theme.accent}`}>My work</h1>
        <p className="mt-1 text-sm text-slate-600">
          Queue rows: {vm.queue.rows.length} · Internal portfolio signals are not shown here.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <FranchiseOwnerOperatingProfileCard profile={profile} />
        <FranchiseOwnerImprovementFocusCard profile={profile} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-800">Work summary</p>
        {summaryRows.length > 0 ? (
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            {summaryRows.map(([key, value]) => (
              <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  {humanizeCountLabel(key)}
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">{String(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-2">No work summary is available yet.</p>
        )}
      </section>
    </div>
  );
}
