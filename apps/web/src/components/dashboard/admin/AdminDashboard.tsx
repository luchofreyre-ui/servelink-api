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

function humanizeWorkboardLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function summarizeWorkboardValue(value: unknown): string {
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return value.trim() || "Not provided";
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (value && typeof value === "object") return "Available for operator review";
  return "Not available";
}

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
  const workboardRows = Object.entries(vm.workboard)
    .filter(([, value]) => value !== undefined)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Admin command center
        </p>
        <h1 className={`mt-2 text-2xl font-bold tracking-tight ${theme.accent}`}>
          Operations console
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold text-slate-900">Operator workboard</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              A summarized view of the operational fields available for review.
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {workboardRows.length} visible field{workboardRows.length === 1 ? "" : "s"}
          </span>
        </div>

        {workboardRows.length > 0 ? (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {workboardRows.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  {humanizeWorkboardLabel(key)}
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {summarizeWorkboardValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
            <p className="font-medium text-slate-800">No workboard items are available.</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Operational cards above remain the primary review surface.
            </p>
          </div>
        )}

        <details className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Diagnostic field names
          </summary>
          <ul className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
            {workboardRows.map(([key]) => (
              <li key={key} className="rounded-lg bg-slate-50 px-3 py-2">
                {humanizeWorkboardLabel(key)}
              </li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}
