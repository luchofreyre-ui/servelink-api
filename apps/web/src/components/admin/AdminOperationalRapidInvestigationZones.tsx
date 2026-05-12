"use client";

import Link from "next/link";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";

const ZONES = [
  {
    href: "#operational-substrate-navigation-strip",
    label: COMMAND_CENTER_UX.rapidZoneSubstrateMap,
  },
  {
    href: "#operational-unified-reality-synthesis",
    label: COMMAND_CENTER_UX.rapidZoneUnifiedReality,
  },
  {
    href: "#operational-pressure-heat-strip",
    label: COMMAND_CENTER_UX.rapidZonePressure,
  },
  {
    href: "#operational-attention-routing",
    label: COMMAND_CENTER_UX.rapidZoneAttention,
  },
  {
    href: "#operational-investigation-workspace-panel",
    label: COMMAND_CENTER_UX.rapidZoneWorkspace,
  },
  {
    href: "#operational-graph-topology-view",
    label: COMMAND_CENTER_UX.rapidZoneTopology,
  },
  {
    href: "#operational-replay-timeline-strip",
    label: COMMAND_CENTER_UX.rapidZoneReplay,
  },
  {
    href: "#operational-replay-analysis-strip",
    label: COMMAND_CENTER_UX.rapidZoneReplayDiff,
  },
  {
    href: "#operational-incident-command-rail",
    label: COMMAND_CENTER_UX.rapidZoneIncidents,
  },
] as const;

/** Compressed tactical anchor ribbon — deterministic hashes only; no urgency ranking. */
export function AdminOperationalRapidInvestigationZones() {
  return (
    <section
      id="operational-tactical-rapid-investigation-zones"
      aria-label={COMMAND_CENTER_UX.rapidZonesTitle}
      className="rounded-xl border border-cyan-400/15 bg-cyan-950/12 px-3 py-3 motion-safe:transition-shadow motion-safe:duration-300 md:px-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200/85">
          {COMMAND_CENTER_UX.rapidZonesTitle}
        </p>
        <p className="max-w-xl text-[10px] text-slate-500">
          {COMMAND_CENTER_UX.rapidZonesSubtitle}
        </p>
      </div>
      <ul className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        {ZONES.map((z) => (
          <li key={z.href} className="shrink-0">
            <Link
              href={z.href}
              className="inline-flex rounded-lg border border-white/10 bg-slate-950/55 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 motion-safe:transition-colors motion-safe:duration-200 hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-50"
            >
              {z.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
