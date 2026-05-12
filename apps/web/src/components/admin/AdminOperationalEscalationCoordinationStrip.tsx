"use client";

import Link from "next/link";
import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";

export type AdminOperationalEscalationCoordinationStripProps = {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading?: boolean;
  error?: string | null;
};

export function AdminOperationalEscalationCoordinationStrip(
  props: AdminOperationalEscalationCoordinationStripProps,
) {
  const pf = props.dashboard?.live.portfolio;
  const esc = props.dashboard?.live.escalationDensity;

  if (props.loading) {
    return (
      <section
        id="operational-escalation-coordination-rail"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.escalationCoordinationTitle}
        className="rounded-2xl border border-slate-700/80 bg-slate-950/50 p-4"
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
        id="operational-escalation-coordination-rail"
        aria-label={COMMAND_CENTER_UX.escalationCoordinationTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-100"
      >
        {props.error}
      </section>
    );
  }

  if (!pf || !esc) return null;

  return (
    <section
      id="operational-escalation-coordination-rail"
      aria-label={COMMAND_CENTER_UX.escalationCoordinationTitle}
      className="rounded-2xl border border-amber-400/20 bg-amber-950/12 px-4 py-4 text-slate-200"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200/90">
            {COMMAND_CENTER_UX.escalationCoordinationTitle}
          </p>
          <p className="mt-1 max-w-3xl text-xs text-slate-400">
            {COMMAND_CENTER_UX.escalationCoordinationSubtitle}
          </p>
        </div>
        <Link
          href="#admin-approval-queue-summary-strip"
          className="shrink-0 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-50 hover:bg-amber-500/15"
        >
          {COMMAND_CENTER_UX.escalationCoordinationJumpApprovals}
        </Link>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        {COMMAND_CENTER_UX.escalationCoordinationGovernanceNote}
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300">
          Pending approvals{" "}
          <strong className="text-slate-100">{pf.pendingApprovals}</strong>
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300">
          Open escalations{" "}
          <strong className="text-slate-100">{esc.open}</strong>
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300">
          Escalations ÷ pending (approx){" "}
          <strong className="text-slate-100">
            {esc.openPerPendingApprovalApprox.toFixed(2)}
          </strong>
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300">
          Waiting approval workflows{" "}
          <strong className="text-slate-100">
            {pf.workflowsWaitingApproval}
          </strong>
        </span>
      </div>
    </section>
  );
}
