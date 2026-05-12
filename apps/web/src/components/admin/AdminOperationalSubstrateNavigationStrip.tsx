"use client";

import Link from "next/link";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";

type Row = {
  subsystem: string;
  hash: string;
  source: string;
};

const SUBSTRATE_ROWS: Row[] = [
  {
    subsystem: "Situation landmark",
    hash: "operational-situation-landmark",
    source: "Static landmark · governance rail",
  },
  {
    subsystem: "Live operator presence",
    hash: "operational-realtime-presence-ribbon",
    source: "POST/GET /admin/operational-command-presence/*",
  },
  {
    subsystem: "Investigation continuity rail",
    hash: "operational-investigation-continuity-rail",
    source: "Static continuity anchors",
  },
  {
    subsystem: "Rapid investigation zones",
    hash: "operational-tactical-rapid-investigation-zones",
    source: "In-page hash shortcuts",
  },
  {
    subsystem: "Collaborative workspaces",
    hash: "operational-investigation-workspace-panel",
    source: "GET/PATCH /admin/operational-command-collaboration/workspaces*",
  },
  {
    subsystem: "Situation cockpit",
    hash: "operational-situation-cockpit",
    source: "GET /admin/operational-intelligence/dashboard",
  },
  {
    subsystem: "Unified operational reality synthesis",
    hash: "operational-unified-reality-synthesis",
    source: "Dashboard-derived deterministic pillars (same GET)",
  },
  {
    subsystem: "Operational science glance",
    hash: "operational-science-glance-strip",
    source: "Warehouse cohort / validity / experiment cardinalities",
  },
  {
    subsystem: "Pressure heat strip",
    hash: "operational-pressure-heat-strip",
    source: "Operational intelligence dashboard (live + persisted samples)",
  },
  {
    subsystem: "Attention routing board",
    hash: "operational-attention-routing",
    source: "Deterministic hints from dashboard",
  },
  {
    subsystem: "Escalation coordination",
    hash: "operational-escalation-coordination-rail",
    source: "Live.portfolio + escalationDensity",
  },
  {
    subsystem: "Incident command rail",
    hash: "operational-incident-command-rail",
    source: "Warehouse coordination incidents sample",
  },
  {
    subsystem: "Graph relationship rail",
    hash: "operational-graph-relationship-rail",
    source: "persistedOperationalEntityGraph summary",
  },
  {
    subsystem: "Graph explorer",
    hash: "operational-graph-native-explorer",
    source: "Warehouse entity graph nodes/edges",
  },
  {
    subsystem: "Graph topology view",
    hash: "operational-graph-topology-view",
    source: "Same graph archive · deterministic layout",
  },
  {
    subsystem: "Collaborative graph annotations",
    hash: "operational-graph-collaboration-annotations",
    source: "POST/GET /admin/operational-command-presence/graph-annotations",
  },
  {
    subsystem: "Tactical continuity",
    hash: "operational-tactical-continuity-strip",
    source: "Chronology + entity frames",
  },
  {
    subsystem: "Replay timeline",
    hash: "operational-replay-timeline-strip",
    source: "Multi-batch replay archives",
  },
  {
    subsystem: "Replay comparison explorer",
    hash: "operational-replay-comparison-explorer",
    source: "POST replay-compare + dashboard hydrate",
  },
  {
    subsystem: "Replay intelligence suite",
    hash: "operational-replay-intelligence-suite-strip",
    source: "Replay suite snapshots",
  },
  {
    subsystem: "Replay analysis / diffing",
    hash: "operational-replay-analysis-strip",
    source: "Warehouse replay diff payloads",
  },
  {
    subsystem: "Collaborative replay reviews",
    hash: "operational-collaborative-replay-review-panel",
    source: "GET/POST /admin/operational-command-collaboration/replay-review/*",
  },
  {
    subsystem: "Intervention × replay rail",
    hash: "operational-intervention-replay-coordination-rail",
    source: "Validity + cohort samples",
  },
  {
    subsystem: "Portfolio orchestration (workflows / timers / policy counts)",
    hash: "admin-portfolio-orchestration-strip",
    source: "GET /admin/portfolio-orchestration/summary",
  },
  {
    subsystem: "Approval queue & waits",
    hash: "admin-approval-queue-summary-strip",
    source: "GET /admin/workflow-approvals/queue-summary",
  },
  {
    subsystem: "Operational outbox (delivery)",
    hash: "operational-outbox-command-guidance",
    source: "GET /admin/operational-outbox?bookingId=… (booking detail)",
  },
  {
    subsystem: "Operational intelligence warehouse",
    hash: "operational-intelligence-coordinated-strip",
    source: "GET dashboard + Refresh warehouse snapshots POST",
  },
  {
    subsystem: "Secondary admin navigation",
    hash: "admin-command-secondary-navigation",
    source: "Static routes (encyclopedia, dispatch, deep clean, …)",
  },
];

/** Mega Phase G — full operational substrate exposure map (read surfaces only). */
export function AdminOperationalSubstrateNavigationStrip() {
  return (
    <section
      id="operational-substrate-navigation-strip"
      aria-label={COMMAND_CENTER_UX.substrateNavigationTitle}
      className="rounded-2xl border border-slate-500/25 bg-slate-950/70 px-4 py-4 text-slate-200 shadow-[0_10px_36px_rgba(0,0,0,0.25)]"
    >
      <div className="border-b border-white/10 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {COMMAND_CENTER_UX.substrateNavigationTitle}
        </p>
        <p className="mt-1 max-w-4xl text-xs text-slate-500">
          {COMMAND_CENTER_UX.substrateNavigationSubtitle}
        </p>
        <p className="mt-2 text-[11px] text-slate-600">
          {COMMAND_CENTER_UX.substrateNavigationGovernance}
        </p>
        <p className="mt-2 text-[11px] text-slate-500">
          {COMMAND_CENTER_UX.substrateNavigationWarehouseHint}{" "}
          <Link
            href="#operational-intelligence-coordinated-strip"
            className="font-medium text-teal-200 underline-offset-2 hover:underline"
          >
            Operational intelligence
          </Link>
          .
        </p>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-white/10 text-slate-500">
              <th className="py-2 pr-3 font-semibold">
                {COMMAND_CENTER_UX.substrateNavigationColSubsystem}
              </th>
              <th className="py-2 pr-3 font-semibold">
                {COMMAND_CENTER_UX.substrateNavigationColAnchor}
              </th>
              <th className="py-2 font-semibold">
                {COMMAND_CENTER_UX.substrateNavigationColSource}
              </th>
            </tr>
          </thead>
          <tbody>
            {SUBSTRATE_ROWS.map((row) => (
              <tr
                key={row.hash}
                className="border-b border-white/[0.06] text-slate-300 last:border-0"
              >
                <td className="py-2 pr-3 align-top text-slate-200">
                  {row.subsystem}
                </td>
                <td className="py-2 pr-3 align-top">
                  <Link
                    href={`#${row.hash}`}
                    className="font-medium text-teal-200 underline-offset-2 hover:underline"
                  >
                    #{row.hash}
                  </Link>
                </td>
                <td className="py-2 align-top text-slate-500">{row.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
