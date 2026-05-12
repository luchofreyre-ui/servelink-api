"use client";

import Link from "next/link";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";

const STEPS = [
  {
    id: "continuity-substrate-map",
    label: COMMAND_CENTER_UX.investigationStepSubstrateMap,
    href: "#operational-substrate-navigation-strip",
  },
  {
    id: "continuity-unified-reality",
    label: COMMAND_CENTER_UX.investigationStepUnifiedReality,
    href: "#operational-unified-reality-synthesis",
  },
  {
    id: "continuity-attention",
    label: COMMAND_CENTER_UX.investigationStepAttention,
    href: "#operational-attention-routing",
  },
  {
    id: "continuity-pressure-heat",
    label: COMMAND_CENTER_UX.investigationStepPressureHeat,
    href: "#operational-pressure-heat-strip",
  },
  {
    id: "continuity-rapid-zones",
    label: COMMAND_CENTER_UX.investigationStepRapidZones,
    href: "#operational-tactical-rapid-investigation-zones",
  },
  {
    id: "continuity-workspaces",
    label: COMMAND_CENTER_UX.investigationStepWorkspace,
    href: "#operational-investigation-workspace-panel",
  },
  {
    id: "continuity-incidents",
    label: COMMAND_CENTER_UX.investigationStepIncidents,
    href: "#operational-incident-command-rail",
  },
  {
    id: "continuity-graph",
    label: COMMAND_CENTER_UX.investigationStepGraph,
    href: "#operational-graph-relationship-rail",
  },
  {
    id: "continuity-graph-explorer",
    label: COMMAND_CENTER_UX.investigationStepGraphExplorer,
    href: "#operational-graph-native-explorer",
  },
  {
    id: "continuity-graph-topology",
    label: COMMAND_CENTER_UX.investigationStepGraphTopology,
    href: "#operational-graph-topology-view",
  },
  {
    id: "continuity-tactical",
    label: COMMAND_CENTER_UX.investigationStepTacticalGraph,
    href: "#operational-tactical-continuity-strip",
  },
  {
    id: "continuity-replay",
    label: COMMAND_CENTER_UX.investigationStepReplay,
    href: "#operational-replay-timeline-strip",
  },
  {
    id: "continuity-suite",
    label: COMMAND_CENTER_UX.investigationStepReplaySuite,
    href: "#operational-replay-intelligence-suite-strip",
  },
  {
    id: "continuity-diff",
    label: COMMAND_CENTER_UX.investigationStepReplayDiff,
    href: "#operational-replay-analysis-strip",
  },
  {
    id: "continuity-replay-review",
    label: COMMAND_CENTER_UX.investigationStepReplayReview,
    href: "#operational-collaborative-replay-review-panel",
  },
  {
    id: "continuity-intervention-replay",
    label: COMMAND_CENTER_UX.investigationStepInterventionReplay,
    href: "#operational-intervention-replay-coordination-rail",
  },
  {
    id: "continuity-warehouse",
    label: COMMAND_CENTER_UX.investigationStepWarehouse,
    href: "#operational-intelligence-coordinated-strip",
  },
] as const;

export function AdminOperationalInvestigationContinuityStrip() {
  return (
    <nav
      id="operational-investigation-continuity-rail"
      aria-label={COMMAND_CENTER_UX.investigationContinuityTitle}
      className="rounded-2xl border border-white/10 bg-slate-900/55 px-4 py-3 text-slate-200 shadow-inner shadow-black/20"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {COMMAND_CENTER_UX.investigationContinuityTitle}
        </p>
        <p className="max-w-xl text-[11px] text-slate-500">
          {COMMAND_CENTER_UX.investigationContinuitySubtitle}
        </p>
      </div>
      <ol className="mt-3 flex max-w-full flex-wrap gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        {STEPS.map((step, i) => (
          <li key={step.id} className="flex items-center gap-2 text-xs">
            {i > 0 ?
              <span aria-hidden className="text-slate-600">
                →
              </span>
            : null}
            <Link
              href={step.href}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 font-medium text-slate-200 hover:border-sky-400/25 hover:bg-sky-500/10 hover:text-sky-50"
            >
              {step.label}
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-3 border-t border-white/5 pt-3 text-[10px] text-slate-500">
        {COMMAND_CENTER_UX.investigationContinuityGovernanceNote}
      </p>
    </nav>
  );
}
