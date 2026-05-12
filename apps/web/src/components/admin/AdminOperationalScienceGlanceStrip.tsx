"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";

export type AdminOperationalScienceGlanceStripProps = {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading?: boolean;
  error?: string | null;
};

/** Lane 3 — readable operational science cardinalities (warehouse samples only). */
export function AdminOperationalScienceGlanceStrip(
  props: AdminOperationalScienceGlanceStripProps,
) {
  const stats = useMemo(() => {
    const d = props.dashboard;
    if (!d) return null;
    const sci = d.persistedOperationalScience;
    const val = d.persistedOperationalInterventionValidity;
    const exp = d.persistedOperationalExperimentation;
    const bal = d.persistedBalancing;
    const closed = d.persistedClosedLoopOperationalIntelligence;
    return {
      scienceRefreshed: sci.refreshedAt,
      cohorts: sci.cohortSnapshots.length,
      sandboxes: sci.interventionSandboxes.length,
      evaluations: sci.interventionEvaluations.length,
      validityRefreshed: val.refreshedAt,
      assignments: val.interventionAssignments.length,
      certifications: val.validityCertifications.length,
      controlCohorts: val.controlCohortSnapshots.length,
      experiments: exp.experimentSnapshots.length,
      benchmarks: exp.benchmarkScenarios.length,
      balancingSamples:
        bal.balancingSnapshots.length + bal.congestionSnapshots.length,
      outcomes: closed.workflowOutcomeSamples.length,
      driftRows: closed.operationalDriftSnapshots.length,
    };
  }, [props.dashboard]);

  if (props.loading) {
    return (
      <section
        id="operational-science-glance-strip"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.scienceGlanceTitle}
        className="rounded-2xl border border-slate-700/80 bg-slate-950/50 p-4"
      >
        <p className="text-xs text-slate-400">{COMMAND_CENTER_UX.coordinatedLoading}</p>
      </section>
    );
  }

  if (props.error) {
    return (
      <section
        id="operational-science-glance-strip"
        aria-label={COMMAND_CENTER_UX.scienceGlanceTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/18 p-4 text-xs text-rose-100"
      >
        {props.error}
      </section>
    );
  }

  if (!stats) return null;

  const quiet =
    stats.cohorts === 0 &&
    stats.assignments === 0 &&
    stats.experiments === 0 &&
    stats.balancingSamples === 0 &&
    stats.outcomes === 0;

  return (
    <section
      id="operational-science-glance-strip"
      aria-label={COMMAND_CENTER_UX.scienceGlanceTitle}
      className="rounded-2xl border border-emerald-400/18 bg-emerald-950/12 px-4 py-4 text-slate-200 shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200/90">
            {COMMAND_CENTER_UX.scienceGlanceTitle}
          </p>
          <p className="mt-1 max-w-4xl text-xs text-slate-400">
            {COMMAND_CENTER_UX.scienceGlanceSubtitle}
          </p>
        </div>
        <p className="text-right font-mono text-[10px] text-slate-500">
          Science batch{" "}
          <span className="text-slate-300">{stats.scienceRefreshed ?? "—"}</span>
          <br />
          Validity batch{" "}
          <span className="text-slate-300">{stats.validityRefreshed ?? "—"}</span>
        </p>
      </div>
      <p className="mt-3 text-[11px] text-slate-500">
        {COMMAND_CENTER_UX.scienceGlanceGovernanceNote}
      </p>

      {quiet ?
        <p className="mt-3 rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-400">
          {COMMAND_CENTER_UX.scienceGlanceQuietState}
        </p>
      : (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">
              {COMMAND_CENTER_UX.scienceGlanceCohortsLabel}
            </dt>
            <dd className="mt-1 font-mono text-lg text-emerald-100/90">
              {stats.cohorts}
            </dd>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">
              {COMMAND_CENTER_UX.scienceGlanceValidityLabel}
            </dt>
            <dd className="mt-1 font-mono text-lg text-emerald-100/90">
              {stats.assignments}/{stats.certifications}
            </dd>
            <p className="mt-1 text-[10px] text-slate-600">
              {COMMAND_CENTER_UX.scienceGlanceValidityHint}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">
              {COMMAND_CENTER_UX.scienceGlanceExperimentLabel}
            </dt>
            <dd className="mt-1 font-mono text-lg text-emerald-100/90">
              {stats.experiments}/{stats.benchmarks}
            </dd>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">
              {COMMAND_CENTER_UX.scienceGlanceBalancingOutcomeLabel}
            </dt>
            <dd className="mt-1 font-mono text-lg text-emerald-100/90">
              {stats.balancingSamples}/{stats.outcomes}
            </dd>
            <p className="mt-1 text-[10px] text-slate-600">
              {stats.driftRows}{" "}
              {COMMAND_CENTER_UX.scienceGlanceDriftSnapshotsNote}
            </p>
          </div>
        </dl>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
        <Link
          href="#operational-intelligence-coordinated-strip"
          className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-emerald-50 hover:bg-emerald-500/15"
        >
          {COMMAND_CENTER_UX.scienceGlanceJumpIntelligence}
        </Link>
        <Link
          href="#operational-intervention-replay-coordination-rail"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 hover:bg-white/10"
        >
          {COMMAND_CENTER_UX.scienceGlanceJumpIntervention}
        </Link>
        <Link
          href="#operational-replay-analysis-strip"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 hover:bg-white/10"
        >
          {COMMAND_CENTER_UX.scienceGlanceJumpReplayAnalysis}
        </Link>
      </div>
    </section>
  );
}
