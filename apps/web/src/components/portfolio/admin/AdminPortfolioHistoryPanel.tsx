import type { PortfolioHistoryEvent } from "@/portfolio/portfolioHistoryModel";

export function AdminPortfolioHistoryPanel({
  events,
}: {
  events: PortfolioHistoryEvent[];
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Portfolio & governance memory</h2>
      <p className="mt-1 text-xs text-slate-600">
        Active conditions captured this refresh (derived — no external warehouse).
      </p>
      <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs">
        {events.map((e) => (
          <li key={e.id} className="rounded-lg border border-slate-100 bg-slate-50/80 p-2">
            <p className="font-medium text-slate-900">{e.headline}</p>
            <p className="text-slate-600">{e.detail}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
              {e.category.replace(/_/g, " ")}
            </p>
          </li>
        ))}
        {events.length === 0 ? <li className="text-slate-500">No memory events.</li> : null}
      </ul>
    </section>
  );
}
