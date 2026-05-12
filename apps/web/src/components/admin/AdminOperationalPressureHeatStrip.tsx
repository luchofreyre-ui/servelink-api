"use client";

import { useMemo } from "react";
import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";

export type AdminOperationalPressureHeatStripProps = {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading?: boolean;
  error?: string | null;
};

type PressureRow = {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  tone: "slate" | "amber" | "rose";
  maxVal: number;
};

function clampPct(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  return Math.min(100, Math.max(0, raw));
}

export function AdminOperationalPressureHeatStrip(
  props: AdminOperationalPressureHeatStripProps,
) {
  const rows = useMemo(() => {
    const d = props.dashboard;
    if (!d) return [];

    const live = d.live;
    const bal = d.persistedBalancing;
    const driftRows = d.persistedVsLiveDrift ?? [];

    const approvalApprox =
      typeof live.escalationDensity.openPerPendingApprovalApprox === "number" &&
      Number.isFinite(live.escalationDensity.openPerPendingApprovalApprox) ?
        live.escalationDensity.openPerPendingApprovalApprox
      : 0;

    /** Disclosure approximation disclosed elsewhere — integer-scale band only for visualization. */
    const approvalBand = Math.min(
      100,
      Math.round(approvalApprox * 100),
    );

    const driftIntensity = driftRows.reduce((acc, r) => {
      const x =
        typeof r.delta === "number" && Number.isFinite(r.delta) ?
          Math.abs(r.delta)
        : 0;
      return acc + x;
    }, 0);

    const congestionCount = bal.congestionSnapshots?.length ?? 0;
    const balancingCount = bal.balancingSnapshots?.length ?? 0;

type PressureRowBase = Omit<PressureRow, "maxVal">;

    const base: PressureRowBase[] = [
      {
        id: "esc_open",
        label: COMMAND_CENTER_UX.pressureHeatEscalationsOpen,
        value: Math.max(0, Math.round(live.escalationDensity.open)),
        displayValue: String(Math.round(live.escalationDensity.open)),
        tone: live.escalationDensity.open > 0 ? "amber" : "slate",
      },
      {
        id: "approval_ratio_band",
        label: COMMAND_CENTER_UX.pressureHeatApprovalApproxBand,
        value: approvalBand,
        displayValue: `${approvalBand} (${COMMAND_CENTER_UX.pressureHeatApproxSuffix})`,
        tone: approvalBand > 25 ? "amber" : "slate",
      },
      {
        id: "pay_attn",
        label: COMMAND_CENTER_UX.pressureHeatPaymentAttention,
        value: Math.max(0, Math.round(live.paymentAttentionBookings)),
        displayValue: String(Math.round(live.paymentAttentionBookings)),
        tone: live.paymentAttentionBookings > 0 ? "rose" : "slate",
      },
      {
        id: "gov_block",
        label: COMMAND_CENTER_UX.pressureHeatGovernanceBlocked,
        value: Math.max(0, Math.round(live.governanceStepsBlocked7d)),
        displayValue: String(Math.round(live.governanceStepsBlocked7d)),
        tone: live.governanceStepsBlocked7d > 0 ? "amber" : "slate",
      },
      {
        id: "congestion_samples",
        label: COMMAND_CENTER_UX.pressureHeatCongestionSnapshots,
        value: congestionCount,
        displayValue: String(congestionCount),
        tone: congestionCount > 0 ? "amber" : "slate",
      },
      {
        id: "balancing_samples",
        label: COMMAND_CENTER_UX.pressureHeatBalancingSnapshots,
        value: balancingCount,
        displayValue: String(balancingCount),
        tone: "slate" as const,
      },
      {
        id: "drift_sum_abs",
        label: COMMAND_CENTER_UX.pressureHeatDriftSumAbs,
        value: Math.min(100, driftIntensity),
        displayValue: driftIntensity.toFixed(1),
        tone: driftIntensity > 0 ? "amber" : "slate",
      },
    ];

    const maxVal = Math.max(1, ...base.map((r) => r.value));

    return base.map((r) => ({
      ...r,
      maxVal,
    }));
  }, [props.dashboard]);

  if (props.loading) {
    return (
      <section
        id="operational-pressure-heat-strip"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.pressureHeatTitle}
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
        id="operational-pressure-heat-strip"
        aria-label={COMMAND_CENTER_UX.pressureHeatTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm text-rose-100"
      >
        {props.error}
      </section>
    );
  }

  const typedRows = rows;

  return (
    <section
      id="operational-pressure-heat-strip"
      aria-label={COMMAND_CENTER_UX.pressureHeatTitle}
      className="motion-safe:transition-shadow motion-safe:duration-300 rounded-2xl border border-orange-400/18 bg-orange-950/10 p-5 text-slate-200 shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
    >
      <div className="border-b border-white/10 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200/90">
          {COMMAND_CENTER_UX.pressureHeatTitle}
        </p>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          {COMMAND_CENTER_UX.pressureHeatSubtitle}
        </p>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {COMMAND_CENTER_UX.pressureHeatGovernanceNote}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {typedRows.map((r) => {
          const pct = clampPct((r.value / r.maxVal) * 100);
          const fill =
            r.tone === "rose" ? "rgba(251,113,133,0.55)"
            : r.tone === "amber" ? "rgba(251,191,36,0.5)"
            : "rgba(148,163,184,0.45)";
          return (
            <div
              key={r.id}
              className="rounded-xl border border-white/10 bg-slate-950/45 px-3 py-3 motion-safe:transition-colors motion-safe:duration-200"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {r.label}
                </p>
                <p className="shrink-0 font-mono text-xs font-semibold text-slate-200">
                  {r.displayValue}
                </p>
              </div>
              <div
                className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-900/80"
                role="presentation"
              >
                <div
                  className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
                  style={{
                    width: `${pct}%`,
                    background: fill,
                  }}
                />
              </div>
              <p className="mt-2 font-mono text-[10px] text-slate-600">
                {COMMAND_CENTER_UX.pressureHeatBarScaleHint}:{" "}
                {r.maxVal.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
