"use client";

import Link from "next/link";
import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";

function fmtWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function payloadRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  return payload as Record<string, unknown>;
}

function payloadField(
  payload: unknown,
  key: string,
): string | number | null {
  const rec = payloadRecord(payload);
  if (!rec) return null;
  const v = rec[key];
  return typeof v === "string" || typeof v === "number" ? v : null;
}

function rationalDensityLabel(payload: unknown): string {
  const rec = payloadRecord(payload);
  const raw = rec?.directedGraphDensityRational;
  if (!raw || typeof raw !== "object") return "—";
  const r = raw as Record<string, unknown>;
  const n = r.numerator;
  const d = r.denominator;
  if (typeof n !== "number" || typeof d !== "number") return "—";
  return `${n} / ${d}`;
}

export type AdminOperationalReplaySuiteStripProps = {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading?: boolean;
  error?: string | null;
};

export function AdminOperationalReplaySuiteStrip(
  props: AdminOperationalReplaySuiteStripProps,
) {
  const timeline = props.dashboard?.persistedOperationalReplayTimeline;
  const histories = timeline?.histories ?? [];

  const suiteCards = histories
    .filter((h) => h.replaySession?.topologySnapshot || h.replaySession?.interventionBridge)
    .slice(0, 8);

  if (props.loading) {
    return (
      <section
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.replaySuiteTitle}
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
        aria-label={COMMAND_CENTER_UX.replaySuiteTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm text-rose-100"
      >
        {props.error}
      </section>
    );
  }

  if (suiteCards.length === 0) {
    return (
      <section
        id="operational-replay-intelligence-suite-strip"
        aria-label={COMMAND_CENTER_UX.replaySuiteTitle}
        className="rounded-2xl border border-violet-400/15 bg-violet-950/15 p-5"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-200/90">
          {COMMAND_CENTER_UX.replaySuiteTitle}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          {COMMAND_CENTER_UX.replaySuiteEmpty}
        </p>
      </section>
    );
  }

  return (
    <section
      id="operational-replay-intelligence-suite-strip"
      aria-label={COMMAND_CENTER_UX.replaySuiteTitle}
      className="rounded-2xl border border-violet-400/15 bg-violet-950/15 p-5 shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
    >
      <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-200/90">
            {COMMAND_CENTER_UX.replaySuiteTitle}
          </p>
          <p className="mt-1 max-w-3xl text-sm text-slate-300">
            {COMMAND_CENTER_UX.replaySuiteSubtitle}
          </p>
        </div>
        <div className="shrink-0 text-right text-xs text-slate-500">
          Timeline anchor{" "}
          <span className="font-medium text-slate-300">
            {fmtWhen(timeline?.refreshedAt ?? null)}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {COMMAND_CENTER_UX.replaySuiteGovernanceNote}
      </p>

      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <span className="text-slate-500">{COMMAND_CENTER_UX.replaySuiteCrossLinks}:</span>
        <Link
          href="#operational-replay-timeline-strip"
          className="text-violet-200 underline-offset-2 hover:underline"
        >
          Replay timeline
        </Link>
        <Link
          href="#operational-replay-analysis-strip"
          className="text-violet-200 underline-offset-2 hover:underline"
        >
          Replay analysis diffs
        </Link>
      </div>

      <ul className="mt-4 space-y-3">
        {suiteCards.map((h) => {
          const rs = h.replaySession;
          if (!rs) return null;
          const topo = rs.topologySnapshot?.payloadJson ?? null;
          const bridge = rs.interventionBridge?.payloadJson ?? null;
          const batchIso =
            typeof payloadField(h.payloadJson, "batchCreatedAtIso") === "string" ?
              String(payloadField(h.payloadJson, "batchCreatedAtIso"))
            : null;

          return (
            <li
              key={`${h.id}-suite`}
              className="rounded-xl border border-white/10 bg-slate-900/45 p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-[11px] text-slate-500">
                  session {rs.id.slice(0, 12)}… · batch{" "}
                  {batchIso ?? "—"}
                </p>
                <span className="text-xs text-slate-500">
                  history {fmtWhen(h.createdAt)}
                </span>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-white/5 bg-slate-950/35 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {COMMAND_CENTER_UX.replaySuiteTopologyHeading}
                  </p>
                  {topo ?
                    <dl className="mt-2 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                      <div>
                        <dt className="text-slate-500">Nodes</dt>
                        <dd className="font-medium text-slate-200">
                          {payloadField(topo, "nodeTotal") ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Edges</dt>
                        <dd className="font-medium text-slate-200">
                          {payloadField(topo, "edgeTotal") ?? "—"}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-slate-500">
                          Directed density (rational)
                        </dt>
                        <dd className="font-mono text-[11px] text-slate-300">
                          {rationalDensityLabel(topo)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Incident ids</dt>
                        <dd className="font-medium text-slate-200">
                          {payloadField(topo, "incidentDigestCardinality") ??
                            "—"}
                        </dd>
                      </div>
                    </dl>
                  : <p className="mt-2 text-xs text-slate-500">—</p>}
                </div>

                <div className="rounded-lg border border-white/5 bg-slate-950/35 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {COMMAND_CENTER_UX.replaySuiteInterventionHeading}
                  </p>
                  {bridge ?
                    <dl className="mt-2 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                      <div>
                        <dt className="text-slate-500">
                          Validity observation nodes
                        </dt>
                        <dd className="font-medium text-slate-200">
                          {payloadField(
                            bridge,
                            "interventionValidityObservationNodeCardinality",
                          ) ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">
                          Assignments observed (summed)
                        </dt>
                        <dd className="font-medium text-slate-200">
                          {payloadField(
                            bridge,
                            "summedInterventionAssignmentsObserved",
                          ) ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">
                          Validity certs (summed)
                        </dt>
                        <dd className="font-medium text-slate-200">
                          {payloadField(
                            bridge,
                            "summedValidityCertificationsObserved",
                          ) ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">
                          Control cohort snapshots (summed)
                        </dt>
                        <dd className="font-medium text-slate-200">
                          {payloadField(
                            bridge,
                            "summedControlCohortSnapshotsObserved",
                          ) ?? "—"}
                        </dd>
                      </div>
                    </dl>
                  : <p className="mt-2 text-xs text-slate-500">—</p>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
