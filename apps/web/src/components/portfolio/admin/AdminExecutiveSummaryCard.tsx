import type { PortfolioOperationalSnapshot } from "@/portfolio/portfolioOperationalSelectors";

function tightenCue(posture: PortfolioOperationalSnapshot["managementPosture"]): string {
  if (posture === "tighten") {
    return "Clear SLA misses and no-acceptance paths before the next dispatch window.";
  }
  if (posture === "watch") {
    return "Review flagged bookings and confirm assignment quality before scaling volume.";
  }
  return "Maintain current governance cadence; keep monitoring normalized dispatch signals.";
}

export function AdminExecutiveSummaryCard({
  snapshot,
}: {
  snapshot: PortfolioOperationalSnapshot;
}) {
  const h = snapshot.healthModel;
  const risk = h.domains[h.highestRiskDomain];
  const lift = h.domains[h.mostImprovedDomain];
  const cohortProblems = snapshot.cohortModel.segments
    .filter((s) => s.count > 0 && s.id !== "stable_operators")
    .slice(0, 3);

  return (
    <section className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Executive operating summary</h2>
      <p className="mt-2 text-xs text-slate-700">{h.portfolioHeadline}</p>
      <div className="mt-3 grid gap-2 text-xs text-slate-800 md:grid-cols-2">
        <div className="rounded-lg bg-white p-3 ring-1 ring-indigo-100">
          <p className="font-medium text-indigo-900">Biggest risk bucket</p>
          <p className="mt-1">{risk.label}</p>
          <p className="mt-1 text-slate-600">{risk.topDegraders[0]}</p>
        </div>
        <div className="rounded-lg bg-white p-3 ring-1 ring-indigo-100">
          <p className="font-medium text-indigo-900">Brightest signal</p>
          <p className="mt-1">{lift.label}</p>
          <p className="mt-1 text-slate-600">{lift.topImprovers[0]}</p>
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-white p-3 text-xs ring-1 ring-indigo-100">
        <p className="font-medium text-slate-900">Top FO cohort pressures</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-700">
          {cohortProblems.map((c) => (
            <li key={c.id}>
              {c.label} ({c.count}) — {c.dominantRisk}
            </li>
          ))}
          {cohortProblems.length === 0 ? <li>No elevated cohorts in this sample.</li> : null}
        </ul>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-900">
        Posture: <span className="uppercase tracking-wide">{snapshot.managementPosture}</span> —{" "}
        {tightenCue(snapshot.managementPosture)}
      </p>
    </section>
  );
}
