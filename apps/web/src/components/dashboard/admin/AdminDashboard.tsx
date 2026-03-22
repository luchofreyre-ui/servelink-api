import type { RoleTheme } from "@/lib/role-theme";
import type { AdminDashboardViewModel } from "@/dashboard/admin/adminDashboardViewModel";
import type { PortfolioOperationalSnapshot } from "@/portfolio/portfolioOperationalSelectors";
import { AdminPortfolioHealthPanel } from "@/components/portfolio/admin/AdminPortfolioHealthPanel";
import { AdminDecisionStandardsPanel } from "@/components/portfolio/admin/AdminDecisionStandardsPanel";
import { AdminConsistencyQueueCard } from "@/components/portfolio/admin/AdminConsistencyQueueCard";
import { AdminGovernanceSummaryCard } from "@/components/portfolio/admin/AdminGovernanceSummaryCard";
import { AdminExecutiveSummaryCard } from "@/components/portfolio/admin/AdminExecutiveSummaryCard";
import { AdminFleetRiskSummaryCard } from "@/components/portfolio/admin/AdminFleetRiskSummaryCard";
import { AdminImprovementSignalsCard } from "@/components/portfolio/admin/AdminImprovementSignalsCard";
import { AdminPortfolioHistoryPanel } from "@/components/portfolio/admin/AdminPortfolioHistoryPanel";

export function AdminDashboard({
  theme,
  vm,
  escalationLevel: _escalationLevel,
  bookingScreens: _bookingScreens,
  portfolioSnapshot,
}: {
  theme: RoleTheme;
  vm: AdminDashboardViewModel;
  escalationLevel: "none" | "watch" | "warning" | "critical";
  bookingScreens: unknown[];
  portfolioSnapshot: PortfolioOperationalSnapshot;
}) {
  const hero = vm.hero;
  return (
    <div className="space-y-6">
      <header>
        <h1 className={`text-xl font-bold ${theme.accent}`}>Operations console</h1>
        <p className="mt-1 text-sm text-slate-600">
          Payment actions: {String(hero.paymentActionRequired ?? 0)} · Capture failed:{" "}
          {String(hero.captureFailed ?? 0)}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminExecutiveSummaryCard snapshot={portfolioSnapshot} />
        <AdminFleetRiskSummaryCard snapshot={portfolioSnapshot} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminGovernanceSummaryCard findings={portfolioSnapshot.consistencyModel.queue} />
        <AdminConsistencyQueueCard findings={portfolioSnapshot.consistencyModel.queue} />
      </div>

      <AdminPortfolioHealthPanel model={portfolioSnapshot.healthModel} />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminImprovementSignalsCard model={portfolioSnapshot.healthModel} />
        <AdminDecisionStandardsPanel />
      </div>

      <AdminPortfolioHistoryPanel events={portfolioSnapshot.historyRollup.events} />

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600">
        <p className="font-medium text-slate-800">Workboard (raw)</p>
        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(vm.workboard, null, 2)}
        </pre>
      </section>
    </div>
  );
}
