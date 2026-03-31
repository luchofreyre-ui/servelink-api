"use client";

import Link from "next/link";
import type { SystemTestFailureGroup, SystemTestFailureHistoryProfile } from "@/types/systemTests";
import type {
  SystemTestFamilyLifecycle,
  SystemTestFamilyOperatorState,
  SystemTestResolutionPreview,
} from "@/types/systemTestResolution";
import { SystemTestsFailureEvidenceBlock } from "./SystemTestsFailureEvidenceBlock";
import { SystemTestsFailureFamilyInline } from "./SystemTestsFailureFamilyInline";
import { SystemTestsIncidentInline } from "./SystemTestsIncidentInline";
import { SystemTestsResolutionPreview } from "./SystemTestsResolutionPreview";
import { SystemTestsLifecycleBadge } from "./SystemTestsLifecycleBadge";

type Props = {
  runId: string;
  groups: SystemTestFailureGroup[];
  loading?: boolean;
  error?: string | null;
  failureProfiles?: Record<string, SystemTestFailureHistoryProfile> | null;
  historyLoading?: boolean;
  /** familyId → preview from dashboard summary fix opportunities (Phase 10C). */
  familyResolutionPreviewByFamilyId?: Record<string, SystemTestResolutionPreview> | null;
  familyOperatorStateByFamilyId?: Record<string, SystemTestFamilyOperatorState> | null;
  familyLifecycleByFamilyId?: Record<string, SystemTestFamilyLifecycle> | null;
  showDismissed?: boolean;
};

export function SystemTestsLatestFailuresPanel(props: Props) {
  const {
    runId,
    groups,
    loading,
    error,
    failureProfiles,
    historyLoading,
    familyResolutionPreviewByFamilyId,
    familyOperatorStateByFamilyId,
    familyLifecycleByFamilyId,
    showDismissed = false,
  } = props;

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Latest run failure digest</h2>
        <p className="text-sm text-white/55">Loading grouped failures…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Latest run failure digest</h2>
        <p className="text-sm text-amber-200/90">{error}</p>
      </section>
    );
  }

  if (!groups.length) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Latest run failure digest</h2>
        <p className="text-sm text-white/55">No failures in the latest run.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Latest run failure digest</h2>
      <div className="space-y-3">
        {groups.map((g) => {
          const hp = failureProfiles?.[g.key];
          const familyId = g.family?.familyId;
          const familyPreview =
            familyId && familyResolutionPreviewByFamilyId ?
              familyResolutionPreviewByFamilyId[familyId]
            : undefined;
          const familyOpState =
            familyId && familyOperatorStateByFamilyId ?
              familyOperatorStateByFamilyId[familyId]
            : undefined;
          const hideFamilyPreview =
            Boolean(familyId) &&
            !showDismissed &&
            familyOpState?.state === "dismissed";
          return (
            <div
              key={g.key}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-semibold text-white">{g.title}</p>
                  <p className="font-mono text-xs text-white/50">{g.file}</p>
                  <p className="text-xs text-white/45">
                    Project: <span className="text-white/70">{g.projectName ?? "unknown"}</span>
                    {" · "}
                    Occurrences: <span className="text-white/80">{g.occurrences}</span>
                    {g.finalStatus ? (
                      <>
                        {" · "}
                        Final: <span className="text-white/80">{g.finalStatus}</span>
                      </>
                    ) : null}
                  </p>
                  {historyLoading ? (
                    <p className="text-xs text-white/40">History…</p>
                  ) : hp ? (
                    <p className="text-xs text-white/50">
                      Seen in {hp.seenInPriorRuns}/{hp.historyWindowSize} prior runs
                      {hp.likelyFlaky ? (
                        <span className="ml-2 text-fuchsia-200/90">· likely flaky</span>
                      ) : null}
                      {hp.likelyRecurring ? (
                        <span className="ml-2 text-orange-200/90">· recurring</span>
                      ) : null}
                      <span className="ml-2 text-cyan-200/80">
                        · rerun {hp.rerunPriorityBand} ({hp.rerunPriorityScore})
                      </span>
                    </p>
                  ) : null}
                  {!hideFamilyPreview && familyPreview?.hasResolution ? (
                    <div className="mt-1.5 border-l border-white/10 pl-2" data-testid="system-tests-latest-failure-preview">
                      <SystemTestsResolutionPreview preview={familyPreview} compact />
                    </div>
                  ) : null}
                  <p className="text-sm text-red-200/85">{g.shortMessage || "—"}</p>
                  {g.family ?
                    <div className="mt-2 space-y-1">
                      <SystemTestsFailureFamilyInline family={g.family} />
                      {g.family.familyId &&
                      familyLifecycleByFamilyId?.[g.family.familyId] ?
                        <SystemTestsLifecycleBadge
                          state={
                            familyLifecycleByFamilyId[g.family.familyId]!.lifecycleState
                          }
                        />
                      : null}
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
                  <SystemTestsFailureEvidenceBlock
                    summary={g.evidenceSummary}
                    diagnosticPreview={g.diagnosticPreview}
                    richEvidence={g.richEvidence}
                    artifactRefs={g.artifactRefs}
                    debuggingHint={g.debuggingHint}
                  />
                </div>
                <Link
                  href={`/admin/system-tests/${runId}`}
                  className="shrink-0 text-sm font-medium text-sky-300 hover:text-sky-200"
                >
                  View run
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
