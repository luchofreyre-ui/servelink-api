import type { AdminBookingDispatchCandidate } from "@/operations/adminBookingDispatch/adminBookingDispatchDetailModel";

function formatPercent(value?: number): string {
  if (value === undefined) return "—";
  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(normalized)}%`;
}

function formatDistance(value?: number): string {
  if (value === undefined) return "—";
  return `${value.toFixed(1)} mi`;
}

export default function AdminBookingCandidateRankingCard({
  candidates,
}: {
  candidates: AdminBookingDispatchCandidate[];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Candidate Ranking
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Assignment quality by operator
          </h2>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {candidates.length} candidate{candidates.length === 1 ? "" : "s"}
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-sm text-slate-600">
          No candidate ranking data is available for this booking. Governance should treat this as an escalation path, not a routine approval.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {candidates.map((candidate) => (
            <div
              key={candidate.foId}
              className={`rounded-2xl border p-5 ${
                candidate.recommended
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-slate-200 bg-slate-50/60"
              }`}
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      Rank #{candidate.rank}
                    </span>
                    <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      Score {Math.round(candidate.score)} · {candidate.scoreLabel}
                    </span>
                    {candidate.recommended ? (
                      <span className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                        Recommended
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{candidate.label}</h3>
                    <p className="mt-1 text-sm text-slate-600">{candidate.foId}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Acceptance</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {formatPercent(candidate.acceptanceRate)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Completion</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {formatPercent(candidate.completionRate)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cancellation</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {formatPercent(candidate.cancellationRate)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Distance</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {formatDistance(candidate.distanceMiles)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid min-w-[280px] gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current Load</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {candidate.currentLoad ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Economics Fit</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {candidate.economicsFit ?? "Not scored"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Proof Fit</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {candidate.proofFit ?? "Needs review"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Strengths
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {candidate.strengths.length > 0 ? (
                      candidate.strengths.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                        >
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">No standout strengths surfaced.</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Degraders
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {candidate.degraders.length > 0 ? (
                      candidate.degraders.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                        >
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">No major degraders surfaced.</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Risk Flags
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {candidate.riskFlags.length > 0 ? (
                      candidate.riskFlags.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
                        >
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">No acute candidate risk flags.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
