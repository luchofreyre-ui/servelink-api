"use client";

import type { SystemTestFailureGroup, SystemTestFailureHistoryProfile } from "@/types/systemTests";

type Props = {
  groups: SystemTestFailureGroup[];
  profiles: Record<string, SystemTestFailureHistoryProfile>;
  loading?: boolean;
};

function bandClass(band: SystemTestFailureHistoryProfile["rerunPriorityBand"]): string {
  switch (band) {
    case "high":
      return "bg-red-500/20 text-red-100 ring-red-500/40";
    case "medium":
      return "bg-amber-500/20 text-amber-100 ring-amber-500/35";
    default:
      return "bg-slate-500/20 text-slate-100 ring-slate-500/35";
  }
}

function sortGroups(groups: SystemTestFailureGroup[], profiles: Record<string, SystemTestFailureHistoryProfile>) {
  return [...groups].sort((a, b) => {
    const pa = profiles[a.key]?.rerunPriorityScore ?? 0;
    const pb = profiles[b.key]?.rerunPriorityScore ?? 0;
    if (pb !== pa) return pb - pa;
    if (b.occurrences !== a.occurrences) return b.occurrences - a.occurrences;
    const f = a.file.localeCompare(b.file);
    if (f !== 0) return f;
    return a.title.localeCompare(b.title);
  });
}

export function SystemTestsRerunPriorityPanel(props: Props) {
  const { groups, profiles, loading } = props;
  const sorted = sortGroups(groups, profiles);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Rerun priority</h2>
      <p className="text-xs text-white/45">Higher score = investigate or rerun first. Reasons are transparent.</p>
      {loading ? (
        <p className="text-sm text-white/55">Loading history for scoring…</p>
      ) : !sorted.length ? (
        <p className="text-sm text-white/55">No failing groups to prioritize.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((g) => {
            const p = profiles[g.key];
            const band = p?.rerunPriorityBand ?? "low";
            return (
              <div
                key={g.key}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{g.title}</p>
                    <p className="font-mono text-xs text-white/50">{g.file}</p>
                    {g.family ?
                      <p className="mt-1 text-xs text-cyan-200/85">
                        Root-cause family: {g.family.displayTitle} · {g.family.recurrenceLine}
                      </p>
                    : null}
                    {g.incident ?
                      <p className="mt-1 text-xs text-cyan-100/80">
                        Incident: {g.incident.displayTitle} · severity {g.incident.severity}
                        {g.family?.familyId && g.incident.leadFamilyId === g.family.familyId ?
                          <span className="text-amber-200/90"> · lead incident family</span>
                        : null}
                      </p>
                    : null}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${bandClass(band)}`}>
                      {band}
                    </span>
                    <span className="text-xs text-white/55">
                      score <span className="font-mono text-white">{p?.rerunPriorityScore ?? 0}</span>
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/55">
                  {p?.likelyFlaky ? (
                    <span className="rounded bg-fuchsia-500/15 px-1.5 py-0.5 text-fuchsia-100">likely flaky</span>
                  ) : null}
                  {p?.likelyRecurring ? (
                    <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-orange-100">recurring</span>
                  ) : null}
                  <span>
                    Seen in {p?.seenInPriorRuns ?? 0}/{p?.historyWindowSize ?? 0} prior runs
                  </span>
                  {p?.consecutiveStreak ? (
                    <span>Streak {p.consecutiveStreak}</span>
                  ) : null}
                </div>
                {p?.rerunPriorityReasons?.length ? (
                  <ul className="mt-2 list-inside list-disc text-xs text-white/60">
                    {p.rerunPriorityReasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
