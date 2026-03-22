import type { PortfolioHealthModel } from "@/portfolio/portfolioHealthModel";

export function AdminImprovementSignalsCard({
  model,
}: {
  model: PortfolioHealthModel;
}) {
  const domains = Object.values(model.domains)
    .filter((d) => d.trend === "improving" || d.score >= 78)
    .slice(0, 4);
  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Improvement signals</h2>
      <p className="mt-1 text-xs text-slate-600">
        Domains trending positively or holding strong — reinforce these behaviors in coaching.
      </p>
      <ul className="mt-3 space-y-2 text-xs">
        {domains.map((d) => (
          <li key={d.domainKey} className="rounded-lg bg-white p-2 ring-1 ring-emerald-100">
            <p className="font-medium text-slate-900">
              {d.label}{" "}
              <span className="text-slate-500">
                score {d.score} · {d.trend}
              </span>
            </p>
            <p className="mt-1 text-slate-700">{d.topImprovers.join(" · ")}</p>
          </li>
        ))}
        {domains.length === 0 ? (
          <li className="text-slate-600">No standout improvement signals in this sample.</li>
        ) : null}
      </ul>
    </section>
  );
}
