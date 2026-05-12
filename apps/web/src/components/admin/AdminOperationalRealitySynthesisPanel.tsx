"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import { buildOperationalRealitySynthesis } from "@/lib/operational/deriveOperationalRealitySynthesis";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";
import { UNIFIED_OPERATIONAL_COGNITION_GOVERNANCE_V1 } from "@/lib/operational/unifiedOperationalCognitionGovernanceV1";

export type AdminOperationalRealitySynthesisPanelProps = {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading?: boolean;
  error?: string | null;
};

/** Lane 1 — deterministic cross-domain synthesis (no new backend). */
export function AdminOperationalRealitySynthesisPanel(
  props: AdminOperationalRealitySynthesisPanelProps,
) {
  const model = useMemo(
    () => buildOperationalRealitySynthesis(props.dashboard),
    [props.dashboard],
  );

  if (props.loading) {
    return (
      <section
        id="operational-unified-reality-synthesis"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.realitySynthesisTitle}
        className="rounded-2xl border border-indigo-400/20 bg-indigo-950/14 p-5"
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
        id="operational-unified-reality-synthesis"
        aria-label={COMMAND_CENTER_UX.realitySynthesisTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/18 p-5 text-sm text-rose-100"
      >
        {props.error}
      </section>
    );
  }

  return (
    <section
      id="operational-unified-reality-synthesis"
      aria-label={COMMAND_CENTER_UX.realitySynthesisTitle}
      className="rounded-2xl border border-indigo-400/22 bg-gradient-to-br from-indigo-950/35 via-slate-950/70 to-slate-950/80 p-5 text-slate-200 shadow-[0_14px_44px_rgba(0,0,0,0.28)]"
    >
      <div className="border-b border-white/10 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-200/90">
          {COMMAND_CENTER_UX.realitySynthesisEyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-50">
          {COMMAND_CENTER_UX.realitySynthesisTitle}
        </h2>
        <p className="mt-2 max-w-4xl text-sm text-slate-400">
          {COMMAND_CENTER_UX.realitySynthesisSubtitle}
        </p>
        <p className="mt-2 text-[11px] text-slate-600">
          {COMMAND_CENTER_UX.realitySynthesisGovernanceNote}
        </p>
        <p className="mt-1 text-[10px] text-slate-700">
          {UNIFIED_OPERATIONAL_COGNITION_GOVERNANCE_V1.title}
        </p>
      </div>

      {model.hydrationNote ?
        <p className="mt-4 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-50">
          {model.hydrationNote}{" "}
          <Link
            href="#operational-intelligence-coordinated-strip"
            className="font-medium text-amber-100 underline-offset-2 hover:underline"
          >
            {COMMAND_CENTER_UX.warehouseIntelligenceJump}
          </Link>
        </p>
      : null}

      {!props.dashboard || model.pillars.length === 0 ?
        null
      : (
          <>
            <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {model.pillars.map((p) => (
                <article
                  key={p.id}
                  className="rounded-xl border border-white/10 bg-black/25 p-4 motion-safe:transition-colors motion-safe:duration-200 hover:border-indigo-400/20"
                >
                  <h3 className="text-sm font-semibold text-indigo-100/95">
                    {p.title}
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-[11px] leading-snug text-slate-400">
                    {p.lines.map((line) => (
                      <li key={line}>• {line}</li>
                    ))}
                  </ul>
                  <Link
                    href={p.anchorHref}
                    className="mt-3 inline-flex text-[11px] font-medium text-indigo-200 underline-offset-2 hover:underline"
                  >
                    {COMMAND_CENTER_UX.realitySynthesisJumpLabel}
                  </Link>
                </article>
              ))}
            </div>

            {model.tacticalWhyLines.length > 0 ?
              <div className="mt-6 rounded-xl border border-indigo-400/15 bg-indigo-950/20 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-200/85">
                  {COMMAND_CENTER_UX.realitySynthesisWhyLead}
                </p>
                <ul className="mt-2 space-y-2 text-xs leading-snug text-slate-300">
                  {model.tacticalWhyLines.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            : null}
          </>
        )}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4 text-[11px]">
        <Link
          href="#operational-situation-cockpit"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 hover:bg-white/10"
        >
          {COMMAND_CENTER_UX.realitySynthesisJumpCockpit}
        </Link>
        <Link
          href="#operational-substrate-navigation-strip"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 hover:bg-white/10"
        >
          {COMMAND_CENTER_UX.rapidZoneSubstrateMap}
        </Link>
        <Link
          href="#operational-intelligence-coordinated-strip"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 hover:bg-white/10"
        >
          {COMMAND_CENTER_UX.realitySynthesisJumpWarehouse}
        </Link>
      </div>
    </section>
  );
}
