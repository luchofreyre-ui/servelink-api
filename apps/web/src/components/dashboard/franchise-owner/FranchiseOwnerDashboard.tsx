import type { RoleTheme } from "@/lib/role-theme";
import type { FranchiseOwnerDashboardViewModel } from "@/dashboard/franchise-owner/franchiseOwnerDashboardViewModel";
import type { PortfolioOperationalSnapshot } from "@/portfolio/portfolioOperationalSelectors";
import {
  buildFranchiseOwnerOperatingProfile,
  pickPrimaryFoId,
} from "@/portfolio/foOperatingProfileSelectors";
import { FranchiseOwnerOperatingProfileCard } from "@/components/portfolio/franchise-owner/FranchiseOwnerOperatingProfileCard";
import { FranchiseOwnerImprovementFocusCard } from "@/components/portfolio/franchise-owner/FranchiseOwnerImprovementFocusCard";

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

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600">
        <p className="font-medium text-slate-800">Summary (raw)</p>
        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(vm.counts, null, 2)}
        </pre>
      </section>
    </div>
  );
}
