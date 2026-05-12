"use client";

import Link from "next/link";
import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";

function humanizeToken(raw: string): string {
  return raw
    .replace(/_v\d+$/i, "")
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export type AdminOperationalInterventionReplayRailProps = {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading?: boolean;
  error?: string | null;
};

export function AdminOperationalInterventionReplayRail(
  props: AdminOperationalInterventionReplayRailProps,
) {
  const iv = props.dashboard?.persistedOperationalInterventionValidity;
  const science = props.dashboard?.persistedOperationalScience;

  if (props.loading) {
    return (
      <section
        id="operational-intervention-replay-coordination-rail"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.interventionReplayRailTitle}
        className="rounded-2xl border border-slate-700/80 bg-slate-950/50 p-5"
      >
        <p className="text-sm text-slate-400">
          {COMMAND_CENTER_UX.coordinatedLoading}
        </p>
      </section>
    );
  }

  if (props.error) {
    return (
      <section
        id="operational-intervention-replay-coordination-rail"
        aria-label={COMMAND_CENTER_UX.interventionReplayRailTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm text-rose-100"
      >
        {props.error}
      </section>
    );
  }

  const assignments = iv?.interventionAssignments ?? [];
  const cohorts = iv?.controlCohortSnapshots ?? [];
  const certs = iv?.validityCertifications ?? [];
  const cohortScience = science?.cohortSnapshots ?? [];

  const empty =
    assignments.length === 0 &&
    cohorts.length === 0 &&
    certs.length === 0 &&
    cohortScience.length === 0;

  if (empty) {
    return (
      <section
        id="operational-intervention-replay-coordination-rail"
        aria-label={COMMAND_CENTER_UX.interventionReplayRailTitle}
        className="rounded-2xl border border-lime-400/15 bg-lime-950/10 p-5"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-lime-200/90">
          {COMMAND_CENTER_UX.interventionReplayRailTitle}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Refresh analytics snapshots to hydrate intervention validity + operational science batches for replay-aware navigation.
        </p>
      </section>
    );
  }

  return (
    <section
      id="operational-intervention-replay-coordination-rail"
      aria-label={COMMAND_CENTER_UX.interventionReplayRailTitle}
      className="rounded-2xl border border-lime-400/18 bg-lime-950/10 p-5 text-slate-200 shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
    >
      <div className="border-b border-white/10 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-lime-200/90">
          {COMMAND_CENTER_UX.interventionReplayRailTitle}
        </p>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          {COMMAND_CENTER_UX.interventionReplayRailSubtitle}
        </p>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {COMMAND_CENTER_UX.interventionReplayRailGovernanceNote}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <Link
          href="#operational-replay-intelligence-suite-strip"
          className="rounded-lg border border-lime-400/25 bg-lime-500/10 px-3 py-1.5 font-medium text-lime-50 hover:bg-lime-500/15"
        >
          {COMMAND_CENTER_UX.interventionReplayRailReplayJump}
        </Link>
        <Link
          href="#operational-replay-comparison-explorer"
          className="rounded-lg border border-lime-400/25 bg-lime-500/10 px-3 py-1.5 font-medium text-lime-50 hover:bg-lime-500/15"
        >
          {COMMAND_CENTER_UX.interventionReplayRailCompareJump}
        </Link>
        <Link
          href="#operational-intelligence-coordinated-strip"
          className="rounded-lg border border-lime-400/25 bg-lime-500/10 px-3 py-1.5 font-medium text-lime-50 hover:bg-lime-500/15"
        >
          {COMMAND_CENTER_UX.interventionReplayRailWarehouseJump}
        </Link>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {COMMAND_CENTER_UX.interventionReplayRailAssignmentsHeading}
          </p>
          <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs text-slate-400">
            {assignments.slice(0, 8).map((a, i) => (
              <li key={`${a.workflowExecutionId}-${i}`}>
                <span className="font-medium text-slate-200">
                  {humanizeToken(a.assignmentCategory)}
                </span>
                <span className="ml-2 font-mono text-[10px] text-slate-600">
                  {a.workflowExecutionId.slice(0, 10)}… ·{" "}
                  {humanizeToken(a.cohortType)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {COMMAND_CENTER_UX.interventionReplayRailCohortHeading}
          </p>
          <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs text-slate-400">
            {cohorts.slice(0, 6).map((c, i) => (
              <li key={`${c.cohortCategory}-${i}`}>
                {humanizeToken(c.cohortCategory)}
              </li>
            ))}
            {cohortScience.slice(0, 4).map((c, i) => (
              <li key={`sci-${c.cohortCategory}-${i}`}>
                Science mirror · {humanizeToken(c.cohortCategory)}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {COMMAND_CENTER_UX.interventionReplayRailCertsHeading}
          </p>
          <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs text-slate-400">
            {certs.slice(0, 8).map((c, i) => (
              <li key={`${c.certificationCategory}-${i}`}>
                <span className="font-medium text-slate-200">
                  {humanizeToken(c.certificationCategory)}
                </span>
                <span className="ml-2 text-slate-600">
                  {humanizeToken(c.certificationState)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
