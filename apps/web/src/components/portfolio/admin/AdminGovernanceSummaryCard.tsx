import type { DecisionConsistencyFinding } from "@/standards/decisionConsistencyModel";

function findingToSeverity(
  f: DecisionConsistencyFinding,
): "low" | "medium" | "high" {
  if (f.consistencyState === "missing_owner_action") return "high";
  if (f.consistencyState === "under_responded") return "medium";
  return "low";
}

export function AdminGovernanceSummaryCard({
  findings,
}: {
  findings: DecisionConsistencyFinding[];
}) {
  const drift = findings.filter(
    (f) => f.consistencyState !== "aligned" && f.consistencyState !== "acceptable_variant",
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-white shadow-sm">
      <h2 className="text-sm font-semibold">Governance drift</h2>
      <p className="mt-1 text-xs text-white/75">
        Where intervention quality or ownership is drifting from portfolio discipline.
      </p>
      <ul className="mt-3 space-y-2 text-xs">
        {drift.slice(0, 6).map((f) => (
          <li key={`${f.bookingId}-${f.standardId}`} className="rounded-lg bg-white/10 p-2">
            <p className="font-medium">
              {f.standardTitle}{" "}
              <span className="text-white/60">
                ({findingToSeverity(f)}) · {f.bookingId}
              </span>
            </p>
            <p className="mt-1 text-white/80">{f.deviationReason}</p>
            <p className="mt-1 text-[11px] text-amber-200">Act: {f.suggestedCorrection}</p>
          </li>
        ))}
        {drift.length === 0 ? <li className="text-white/70">No drift highlights this refresh.</li> : null}
      </ul>
    </section>
  );
}
