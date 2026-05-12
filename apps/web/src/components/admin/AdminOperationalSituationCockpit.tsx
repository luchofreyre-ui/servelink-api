"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import {
  COMMAND_CENTER_UX,
  type CommandCenterZoneId,
} from "@/lib/operational/commandCenterVocabulary";
import {
  buildSituationPostureTiles,
  type SituationPostureTone,
} from "@/lib/operational/deriveOperationalSituationPosture";

const ZONE_LABELS: Record<CommandCenterZoneId, string> = {
  orchestration_posture: COMMAND_CENTER_UX.zoneOrchestrationPosture,
  governance_pressure: COMMAND_CENTER_UX.zoneGovernancePressure,
  approval_saturation: COMMAND_CENTER_UX.zoneApprovalSaturation,
  workflow_congestion: COMMAND_CENTER_UX.zoneWorkflowCongestion,
  balancing_intelligence: COMMAND_CENTER_UX.zoneBalancingIntelligence,
  delivery_reliability: COMMAND_CENTER_UX.zoneDeliveryReliability,
  operational_drift: COMMAND_CENTER_UX.zoneOperationalDrift,
  simulation_benchmark: COMMAND_CENTER_UX.zoneSimulationBenchmark,
  intervention_validity: COMMAND_CENTER_UX.zoneInterventionValidity,
};

function toneClasses(tone: SituationPostureTone): string {
  if (tone === "pressure") {
    return "border-rose-400/35 bg-rose-950/35 ring-1 ring-rose-400/15";
  }
  if (tone === "watch") {
    return "border-amber-400/30 bg-amber-950/25 ring-1 ring-amber-400/12";
  }
  return "border-emerald-400/20 bg-emerald-950/15 ring-1 ring-emerald-400/10";
}

function tonePill(tone: SituationPostureTone): string {
  if (tone === "pressure") return "bg-rose-500/25 text-rose-100";
  if (tone === "watch") return "bg-amber-500/20 text-amber-50";
  return "bg-emerald-500/15 text-emerald-50";
}

export type AdminOperationalSituationCockpitProps = {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading?: boolean;
  error?: string | null;
};

export function AdminOperationalSituationCockpit(
  props: AdminOperationalSituationCockpitProps,
) {
  const tiles = useMemo(() => {
    if (!props.dashboard) return [];
    return buildSituationPostureTiles(props.dashboard);
  }, [props.dashboard]);

  if (props.loading) {
    return (
      <section
        id="operational-situation-cockpit"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.situationCockpitTitle}
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
        id="operational-situation-cockpit"
        aria-label={COMMAND_CENTER_UX.situationCockpitTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm text-rose-100"
      >
        {props.error}
      </section>
    );
  }

  if (!props.dashboard || tiles.length === 0) {
    return null;
  }

  return (
    <section
      id="operational-situation-cockpit"
      aria-label={COMMAND_CENTER_UX.situationCockpitTitle}
      className="rounded-2xl border border-sky-400/20 bg-slate-950/65 p-5 text-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200/90">
            {COMMAND_CENTER_UX.situationCockpitTitle}
          </p>
          <p className="mt-1 max-w-4xl text-sm text-slate-400">
            {COMMAND_CENTER_UX.situationCockpitSubtitle}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {COMMAND_CENTER_UX.situationCockpitGovernanceNote}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <article
            key={t.id}
            className={`flex flex-col rounded-xl border p-4 transition hover:bg-white/[0.03] ${toneClasses(t.tone)}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tonePill(t.tone)}`}
              >
                {t.tone === "pressure"
                  ? COMMAND_CENTER_UX.postureTonePressureLabel
                  : t.tone === "watch"
                    ? COMMAND_CENTER_UX.postureToneWatchLabel
                    : COMMAND_CENTER_UX.postureToneSteadyLabel}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-slate-500">
                {COMMAND_CENTER_UX.situationCockpitZoneLabel}:{" "}
                {ZONE_LABELS[t.zone]}
              </span>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-slate-50">{t.title}</h3>
            <p className="mt-1 text-xs leading-snug text-slate-300">{t.headline}</p>
            <p className="mt-2 flex-1 text-[11px] leading-snug text-slate-500">
              {t.detail}
            </p>
            <Link
              href={t.anchorHref}
              className="mt-3 inline-flex text-xs font-medium text-sky-200 underline-offset-2 hover:underline"
            >
              {COMMAND_CENTER_UX.situationCockpitJumpLabel}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
