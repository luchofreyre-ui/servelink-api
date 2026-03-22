import type { AdminBookingDispatchGovernance } from "@/operations/adminBookingDispatch/adminBookingDispatchDetailModel";

function stateClasses(state: AdminBookingDispatchGovernance["consistencyState"]): string {
  if (state === "aligned") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (state === "watch") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-rose-200 bg-rose-50 text-rose-900";
}

export default function AdminBookingGovernanceCard({
  governance,
}: {
  governance: AdminBookingDispatchGovernance;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Governance
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Standards and consistency support
          </h2>
        </div>
        <div
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${stateClasses(governance.consistencyState)}`}
        >
          {governance.consistencyState === "aligned"
            ? "Aligned"
            : governance.consistencyState === "watch"
              ? "Watch"
              : "Drift"}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-700">{governance.consistencyHeadline}</p>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Standard
          </p>
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            <div>
              <p className="font-medium text-slate-900">
                {governance.standardTitle ?? "No specific standard matched"}
              </p>
              <p className="mt-1">{governance.scenarioSignature ?? "Standard signature unavailable."}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Recommended path</p>
              <p className="mt-1">
                {governance.recommendedDecisionPath ??
                  "Use operator judgment with portfolio signals and economics."}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Control recommendation
          </p>
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            <div>
              <p className="font-medium text-slate-900">Next best action</p>
              <p className="mt-1">{governance.nextBestAction}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Owner recommendation</p>
              <p className="mt-1">{governance.ownerRecommendation}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Consistency reasons
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            {governance.consistencyReasons.map((reason, index) => (
              <li
                key={`${index}-${reason.slice(0, 24)}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
              >
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Risk flags
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {governance.riskFlags.length > 0 ? (
              governance.riskFlags.map((flag) => (
                <span
                  key={flag}
                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
                >
                  {flag}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">No active governance risk flags.</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
