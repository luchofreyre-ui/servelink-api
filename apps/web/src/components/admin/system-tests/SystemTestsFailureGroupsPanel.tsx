"use client";

import { useMemo } from "react";
import type { SystemTestFailureGroup, SystemTestFailureHistoryProfile } from "@/types/systemTests";
import { SystemTestsFailureEvidenceBlock } from "./SystemTestsFailureEvidenceBlock";
import { SystemTestsFailureFamilyInline } from "./SystemTestsFailureFamilyInline";
import { SystemTestsIncidentInline } from "./SystemTestsIncidentInline";

type Props = {
  groups: SystemTestFailureGroup[];
  failureProfiles?: Record<string, SystemTestFailureHistoryProfile> | null;
  historyLoading?: boolean;
};

export function SystemTestsFailureGroupsPanel(props: Props) {
  const { groups, failureProfiles, historyLoading } = props;

  const familyCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of groups) {
      const id = g.family?.familyId;
      if (!id) continue;
      m.set(id, (m.get(id) ?? 0) + 1);
    }
    return m;
  }, [groups]);

  if (!groups.length) {
    return <p className="text-sm text-white/55">No failure groups for this run.</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const hp = failureProfiles?.[g.key];
        const famCount = g.family?.familyId ? (familyCounts.get(g.family.familyId) ?? 1) : 1;
        return (
          <div
            key={g.key}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
          >
            <p className="text-sm font-semibold text-white">{g.fingerprint || g.title}</p>
            <p className="mt-1 font-mono text-xs text-white/50">{g.file}</p>
            <div className="mt-2 grid gap-2 text-xs text-white/55 sm:grid-cols-2">
              <p>
                Project: <span className="text-white/80">{g.projectName ?? "unknown"}</span>
              </p>
              <p>
                Occurrences: <span className="text-white/80">{g.occurrences}</span>
              </p>
              <p>
                Final status: <span className="text-white/80">{g.finalStatus ?? "unknown"}</span>
              </p>
            </div>
            {historyLoading ? (
              <p className="mt-2 text-xs text-white/40">Loading history annotations…</p>
            ) : hp ? (
              <div className="mt-3 rounded-lg border border-white/10 bg-black/25 p-3 text-xs text-white/65">
                <p className="font-semibold uppercase tracking-wide text-white/45">History</p>
                <p className="mt-1">
                  Seen in {hp.seenInPriorRuns}/{hp.historyWindowSize} prior runs
                  {hp.lastSeenRunId ? (
                    <>
                      {" "}
                      · last prior{" "}
                      <span className="font-mono text-white/80">{hp.lastSeenRunId.slice(0, 8)}…</span>
                    </>
                  ) : null}
                </p>
                <p>
                  Consecutive streak {hp.consecutiveStreak} · Intermittent transitions {hp.intermittentCount}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {hp.likelyFlaky ? (
                    <span className="rounded bg-fuchsia-500/15 px-1.5 py-0.5 text-fuchsia-100">likely flaky</span>
                  ) : null}
                  {hp.likelyRecurring ? (
                    <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-orange-100">likely recurring</span>
                  ) : null}
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/80">
                    Rerun {hp.rerunPriorityBand} ({hp.rerunPriorityScore})
                  </span>
                </div>
              </div>
            ) : null}
            {g.family ?
              <div className="mt-3">
                <SystemTestsFailureFamilyInline
                  family={g.family}
                  siblingCountInRun={famCount > 1 ? famCount : undefined}
                />
              </div>
            : null}
            {g.incident ?
              <div className="mt-2">
                <SystemTestsIncidentInline
                  incident={g.incident}
                  isLeadFamily={
                    Boolean(g.family?.familyId && g.incident.leadFamilyId === g.family.familyId)
                  }
                />
              </div>
            : null}
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Message</p>
              <p className="mt-1 text-sm text-red-200/85">{g.shortMessage || "—"}</p>
              <SystemTestsFailureEvidenceBlock
                summary={g.evidenceSummary}
                diagnosticPreview={g.diagnosticPreview}
                richEvidence={g.richEvidence}
                artifactRefs={g.artifactRefs}
                debuggingHint={g.debuggingHint}
              />
              {g.fullMessage && g.fullMessage !== g.shortMessage ? (
                <pre className="mt-2 max-h-32 overflow-auto rounded-lg border border-white/10 bg-black/30 p-2 font-mono text-xs text-white/70 whitespace-pre-wrap">
                  {g.fullMessage}
                </pre>
              ) : null}
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Tests</p>
              <ul className="mt-1 list-inside list-disc text-sm text-white/80">
                {g.testTitles.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            {g.evidenceLines.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Evidence</p>
                <ul className="mt-1 list-inside list-disc font-mono text-xs text-white/65">
                  {g.evidenceLines.map((line, i) => (
                    <li key={`${line}-${i}`}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
