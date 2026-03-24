import type { DeepCleanEstimatorDecisionDashboard } from "@/analytics/deep-clean/deepCleanEstimatorDecisionSelectors";
import type { DeepCleanEstimatorVersionHistoryRowApi } from "@/types/deepCleanEstimatorGovernance";

export function DeepCleanEstimatorDecisionSummary({
  dashboard,
  governanceRows: _governanceRows,
}: {
  dashboard: DeepCleanEstimatorDecisionDashboard;
  governanceRows: DeepCleanEstimatorVersionHistoryRowApi[];
}) {
  const active =
    dashboard.activeVersion != null
      ? `v${dashboard.activeVersion}${dashboard.activeLabel ? ` · ${dashboard.activeLabel}` : ""}`
      : "—";

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      data-testid="deep-clean-estimator-decision-summary"
    >
      <h2 className="text-lg font-semibold text-slate-900">Decision intelligence</h2>
      <p className="mt-1 text-sm text-slate-600">
        Snapshot from published estimator versions and impact aggregates (deterministic ordering).
      </p>
      <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-slate-500">Active (governance)</dt>
          <dd className="mt-0.5 font-medium text-slate-900">{active}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Impact rows loaded</dt>
          <dd className="mt-0.5 font-medium text-slate-900">{dashboard.impactRowCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Closest to target variance %</dt>
          <dd className="mt-0.5">{dashboard.bestVarianceVersionLabel ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Furthest from target variance %</dt>
          <dd className="mt-0.5">{dashboard.worstVarianceVersionLabel ?? "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-slate-500">Latest version with impact data</dt>
          <dd className="mt-0.5">{dashboard.latestImpactVersionLabel ?? "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
