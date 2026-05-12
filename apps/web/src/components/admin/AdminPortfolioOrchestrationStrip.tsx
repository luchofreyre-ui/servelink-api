"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchAdminPortfolioOrchestrationSummary,
  type AdminPortfolioOrchestrationSummary,
} from "@/lib/api/adminPortfolioOrchestration";
import { ORCHESTRATION_UX } from "@/lib/operational/orchestrationVocabulary";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";
import { getStoredAccessToken } from "@/lib/auth";

function Pill(props: { label: string; value: number; tone?: "neutral" | "warn" }) {
  const tone =
    props.tone === "warn" && props.value > 0
      ? "border-amber-400/35 bg-amber-500/15 text-amber-50"
      : "border-white/10 bg-white/5 text-slate-200";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${tone}`}
    >
      <span className="font-medium text-slate-400">{props.label}</span>
      <span className="font-semibold tabular-nums">{props.value}</span>
    </span>
  );
}

const stripClass =
  "rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-200";

/**
 * Portfolio-level workflow / approval / policy signals for admin ops — counts only.
 */
export function AdminPortfolioOrchestrationStrip() {
  const [summary, setSummary] = useState<AdminPortfolioOrchestrationSummary | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getStoredAccessToken()?.trim()) {
      setSummary(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchAdminPortfolioOrchestrationSummary()
      .then((s) => {
        if (!cancelled) {
          setSummary(s);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummary(null);
          setError("Portfolio orchestration summary unavailable.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section
        id="admin-portfolio-orchestration-strip"
        aria-busy="true"
        aria-label="Portfolio orchestration summary"
        className={stripClass}
      >
        <p className="text-xs text-slate-400">
          {COMMAND_CENTER_UX.portfolioStripLoading}
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section
        id="admin-portfolio-orchestration-strip"
        aria-label="Portfolio orchestration summary"
        className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-100"
      >
        <p>{error}</p>
        <p className="mt-2 text-[11px] text-amber-50/80">
          {COMMAND_CENTER_UX.portfolioStripEmpty}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="#operational-intelligence-coordinated-strip"
            className="rounded-lg border border-amber-400/30 bg-amber-500/15 px-2 py-1 text-[11px] hover:bg-amber-500/25"
          >
            {COMMAND_CENTER_UX.warehouseIntelligenceJump}
          </Link>
        </div>
      </section>
    );
  }

  if (!summary) {
    return (
      <section
        id="admin-portfolio-orchestration-strip"
        aria-label="Portfolio orchestration summary"
        className={stripClass}
      >
        <p className="text-xs text-slate-400">
          {COMMAND_CENTER_UX.portfolioStripEmpty}
        </p>
      </section>
    );
  }

  return (
    <section
      id="admin-portfolio-orchestration-strip"
      aria-label="Portfolio orchestration summary"
      className={stripClass}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {ORCHESTRATION_UX.portfolioStripTitle}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {ORCHESTRATION_UX.portfolioStripSubtitle}
      </p>
      <p className="mt-2 text-[10px] text-slate-600">
        Read surface: GET /api/v1/admin/portfolio-orchestration/summary · counts only;
        no autonomous execution.
      </p>
      {summary.oldestPendingApprovalRequestedAt ? (
        <p className="mt-2 font-mono text-[11px] text-slate-500">
          Oldest pending approval requested at{" "}
          <span className="text-slate-300">{summary.oldestPendingApprovalRequestedAt}</span>
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Pill label="Waiting approval" value={summary.workflowsWaitingApproval} tone="warn" />
        <Pill label="Governance blocked" value={summary.workflowsGovernanceBlocked} tone="warn" />
        <Pill label="Pending approvals" value={summary.pendingApprovals} tone="warn" />
        <Pill label="Open escalations" value={summary.openEscalations} tone="warn" />
        <Pill
          label="Policy attention"
          value={summary.policyAttentionEvaluations}
          tone="warn"
        />
        <Pill label="Running workflows" value={summary.workflowsRunning} />
        <Pill label="Pending workflows" value={summary.workflowsPendingState} />
        <Pill
          label="Wait approval 24h+"
          value={summary.waitingApprovalWorkflowsAged24hPlus}
          tone="warn"
        />
        <Pill
          label="Wait approval 72h+"
          value={summary.waitingApprovalWorkflowsAged72hPlus}
          tone="warn"
        />
        <Pill
          label="Pending approval 48h+"
          value={summary.pendingApprovalsAged48hPlus}
          tone="warn"
        />
        <Pill
          label="Escalations 24h+"
          value={summary.openEscalationsAged24hPlus}
          tone="warn"
        />
        <Pill label="Pending timers" value={summary.pendingWorkflowTimers} />
        <Pill label="Overdue timers" value={summary.overdueWorkflowTimers} tone="warn" />
        <Pill label="Active waits" value={summary.activeWorkflowWaits} />
        <Pill label="Recurring bookings" value={summary.bookingsWithRecurringPlan} />
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Orchestration safety pressure (24h where noted)
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {ORCHESTRATION_UX.orchestrationSafetyPortfolioSubtitle}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Pill
          label="Activations registered"
          value={summary.orchestrationSafety.activationsRegistered}
        />
        <Pill
          label="Approved for invoke"
          value={summary.orchestrationSafety.activationsApprovedForInvoke}
          tone="warn"
        />
        <Pill
          label="Activations failed"
          value={summary.orchestrationSafety.activationsFailed}
          tone="warn"
        />
        <Pill
          label="Dry-runs failed (24h)"
          value={summary.orchestrationSafety.dryRunsFailedLast24h}
          tone="warn"
        />
        <Pill
          label="Safety eval attention (24h)"
          value={summary.orchestrationSafety.safetyEvaluationsAttentionLast24h}
          tone="warn"
        />
        <Pill
          label="Simulations completed (24h)"
          value={summary.orchestrationSafety.simulationsCompletedLast24h}
        />
        {summary.orchestrationSafety.deliveryAttemptsLast24h != null &&
        summary.orchestrationSafety.deliverySuccessesLast24h != null ? (
          <>
            <Pill
              label="Delivery attempts (24h)"
              value={summary.orchestrationSafety.deliveryAttemptsLast24h}
            />
            <Pill
              label="Delivery successes (24h)"
              value={summary.orchestrationSafety.deliverySuccessesLast24h}
            />
          </>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3 text-[11px]">
        <Link
          href="/admin/exceptions"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 hover:bg-white/10"
        >
          {COMMAND_CENTER_UX.portfolioStripDrilldownExceptions}
        </Link>
        <Link
          href="#admin-approval-queue-summary-strip"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 hover:bg-white/10"
        >
          {COMMAND_CENTER_UX.portfolioStripDrilldownApprovals}
        </Link>
        <Link
          href="#operational-outbox-command-guidance"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 hover:bg-white/10"
        >
          {COMMAND_CENTER_UX.outboxGuidanceShortJump}
        </Link>
        <Link
          href="#operational-substrate-navigation-strip"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 hover:bg-white/10"
        >
          {COMMAND_CENTER_UX.rapidZoneSubstrateMap}
        </Link>
      </div>
    </section>
  );
}
