"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchAdminWorkflowApprovalQueueSummary,
  type AdminWorkflowApprovalQueueSummary,
} from "@/lib/api/adminWorkflowApprovalQueue";
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

/** Global approval/timer/wait posture — read-only; no bulk actions. */
export function AdminApprovalQueueSummaryStrip() {
  const [summary, setSummary] = useState<AdminWorkflowApprovalQueueSummary | null>(
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
    void fetchAdminWorkflowApprovalQueueSummary()
      .then((s) => {
        if (!cancelled) {
          setSummary(s);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummary(null);
          setError("Approval queue summary unavailable.");
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
        id="admin-approval-queue-summary-strip"
        aria-busy="true"
        aria-label="Approval queue summary"
        className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-200"
      >
        <p className="text-xs text-slate-400">
          {COMMAND_CENTER_UX.approvalStripLoading}
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section
        id="admin-approval-queue-summary-strip"
        aria-label="Approval queue summary"
        className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-100"
      >
        <p>{error}</p>
        <p className="mt-2 text-[11px] text-amber-50/85">
          {COMMAND_CENTER_UX.approvalStripEmpty}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="#admin-portfolio-orchestration-strip"
            className="rounded-lg border border-amber-400/30 bg-amber-500/15 px-2 py-1 text-[11px] hover:bg-amber-500/25"
          >
            {COMMAND_CENTER_UX.approvalStripDrilldownPortfolio}
          </Link>
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
        id="admin-approval-queue-summary-strip"
        aria-label="Approval queue summary"
        className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs text-slate-400"
      >
        {COMMAND_CENTER_UX.approvalStripEmpty}
      </section>
    );
  }

  return (
    <section
      id="admin-approval-queue-summary-strip"
      aria-label="Approval queue summary"
      className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-200"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {ORCHESTRATION_UX.approvalQueueStripTitle}
      </p>
      <p className="mt-1 text-xs text-slate-500">{ORCHESTRATION_UX.approvalQueueStripSubtitle}</p>
      <p className="mt-2 text-[10px] text-slate-600">
        Read surface: GET /admin/workflow-approvals/queue-summary · posture only.
      </p>
      {summary.oldestPendingApproval ? (
        <p className="mt-2 font-mono text-[11px] text-slate-500">
          Oldest pending{" "}
          <span className="text-slate-300">{summary.oldestPendingApproval.approvalType}</span> ·
          requested{" "}
          <span className="text-slate-300">{summary.oldestPendingApproval.requestedAt}</span>
          {summary.oldestPendingApproval.expiresAt ? (
            <>
              {" "}
              · expires{" "}
              <span className="text-slate-300">{summary.oldestPendingApproval.expiresAt}</span>
            </>
          ) : null}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Pill label="Pending approvals" value={summary.pendingApprovals} tone="warn" />
        <Pill
          label="Pending approval 48h+"
          value={summary.pendingApprovalsAged48hPlus}
          tone="warn"
        />
        <Pill label="Open escalations" value={summary.openEscalations} tone="warn" />
        <Pill
          label="Escalations 24h+"
          value={summary.openEscalationsAged24hPlus}
          tone="warn"
        />
        <Pill
          label="Expiry ≤24h"
          value={summary.pendingApprovalsWithExpiryWithin24h}
          tone="warn"
        />
        <Pill label="Active waits" value={summary.activeWorkflowWaits} />
        <Pill label="Overdue timers" value={summary.overdueWorkflowTimers} tone="warn" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3 text-[11px]">
        <Link
          href="#admin-portfolio-orchestration-strip"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 hover:bg-white/10"
        >
          {COMMAND_CENTER_UX.approvalStripDrilldownPortfolio}
        </Link>
        <Link
          href="/admin/exceptions"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 hover:bg-white/10"
        >
          {COMMAND_CENTER_UX.portfolioStripDrilldownExceptions}
        </Link>
        <Link
          href="#operational-substrate-navigation-strip"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 hover:bg-white/10"
        >
          {COMMAND_CENTER_UX.rapidZoneSubstrateMap}
        </Link>
      </div>
      <p className="mt-2 text-[10px] text-slate-600">
        {COMMAND_CENTER_UX.approvalStripDrilldownBooking}
      </p>
    </section>
  );
}
