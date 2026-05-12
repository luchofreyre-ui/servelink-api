"use client";

import { useMemo } from "react";
import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import { buildOperationalAttentionSignals } from "@/lib/operational/buildOperationalAttentionSignals";
import {
  COMMAND_CENTER_UX,
  COMMAND_CENTER_ZONE_ORDER,
  type CommandCenterZoneId,
} from "@/lib/operational/commandCenterVocabulary";

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

/**
 * Situation-first attention board — deterministic narratives only (Phase 29).
 */
export function AdminOperationalAttentionBoard(props: {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading: boolean;
  error: string | null;
}) {
  const signals = useMemo(() => {
    if (!props.dashboard) return [];
    return buildOperationalAttentionSignals(props.dashboard);
  }, [props.dashboard]);

  const grouped = useMemo(() => {
    const m = new Map<CommandCenterZoneId, typeof signals>();
    for (const z of COMMAND_CENTER_ZONE_ORDER) {
      m.set(z, []);
    }
    for (const s of signals) {
      const cur = m.get(s.zone) ?? [];
      cur.push(s);
      m.set(s.zone, cur);
    }
    return m;
  }, [signals]);

  if (props.loading) {
    return (
      <section
        id="operational-attention-routing"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.attentionBoardTitle}
        className="rounded-2xl border border-cyan-400/15 bg-cyan-950/25 px-4 py-4 text-sm text-slate-300"
      >
        {COMMAND_CENTER_UX.coordinatedLoading}
      </section>
    );
  }

  if (props.error) {
    return (
      <section
        id="operational-attention-routing"
        aria-label={COMMAND_CENTER_UX.attentionBoardTitle}
        className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-100"
      >
        {props.error}
      </section>
    );
  }

  if (!props.dashboard) return null;

  const hasAny = signals.length > 0;

  return (
    <section
      id="operational-attention-routing"
      aria-label={COMMAND_CENTER_UX.attentionBoardTitle}
      className="rounded-2xl border border-cyan-400/20 bg-slate-950/65 px-4 py-4 text-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.22)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200/90">
            {COMMAND_CENTER_UX.attentionBoardTitle}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {COMMAND_CENTER_UX.attentionBoardSubtitle}
          </p>
        </div>
      </div>

      {!hasAny ? (
        <p className="mt-4 text-xs text-slate-500">{COMMAND_CENTER_UX.emptyAttentionBoard}</p>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {COMMAND_CENTER_ZONE_ORDER.map((zone) => {
            const signals = grouped?.get(zone) ?? [];
            if (signals.length === 0) return null;
            return (
              <div
                key={zone}
                className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs"
              >
                <p className="font-semibold text-slate-300">{ZONE_LABELS[zone]}</p>
                <ul className="mt-2 space-y-2">
                  {signals.map((s) => (
                    <li
                      key={s.id}
                      className={`rounded-lg border px-2 py-2 leading-snug ${
                        s.severity === "attention"
                          ? "border-amber-400/25 bg-amber-500/10 text-amber-50"
                          : "border-white/10 bg-white/[0.04] text-slate-300"
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {s.severity === "attention"
                          ? COMMAND_CENTER_UX.severityAttentionLabel
                          : COMMAND_CENTER_UX.severityInfoLabel}
                      </span>
                      <span className="mt-1 block font-semibold text-slate-100">
                        {s.title}
                      </span>
                      <span className="mt-1 block text-[11px] opacity-95">{s.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
