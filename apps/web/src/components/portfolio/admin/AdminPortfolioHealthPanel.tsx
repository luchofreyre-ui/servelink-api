import type { PortfolioHealthModel } from "@/portfolio/portfolioHealthModel";
import type { PortfolioHealthDomainKey } from "@/portfolio/portfolioHealthModel";

const ORDER: PortfolioHealthDomainKey[] = [
  "operationsHealth",
  "executionHealth",
  "outcomeHealth",
  "communicationHealth",
  "capacityHealth",
  "economicsHealth",
  "policyDiscipline",
  "adminInterventionHealth",
];

export function AdminPortfolioHealthPanel({
  model,
}: {
  model: PortfolioHealthModel;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Portfolio health by domain</h2>
      <p className="mt-1 text-xs text-slate-600">{model.portfolioHeadline}</p>
      <p className="mt-2 text-xs font-medium text-slate-700">{model.fleetAttentionSummary}</p>
      <ul className="mt-4 space-y-3">
        {ORDER.map((key) => {
          const d = model.domains[key];
          return (
            <li
              key={key}
              className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-slate-900">{d.label}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
                  {d.band} · {d.score}
                </span>
              </div>
              <p className="mt-1 text-slate-600">Trend: {d.trend}</p>
              <p className="mt-1 text-slate-700">
                <span className="font-medium text-slate-800">Drags: </span>
                {d.topDegraders.join(" · ")}
              </p>
              <p className="mt-1 text-slate-700">
                <span className="font-medium text-slate-800">Improvers: </span>
                {d.topImprovers.join(" · ")}
              </p>
              <p className="mt-1 text-slate-700">{d.recommendedManagementAction}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Next actor: {d.whoShouldActNext.replace(/_/g, " ")}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
