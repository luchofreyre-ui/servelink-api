import { apiFetch } from "@/lib/api";

/** Phase 21 — deterministic orchestration safety pressure (counts only). */
export type OrchestrationSafetyPortfolioCounts = {
  activationsRegistered: number;
  activationsApprovedForInvoke: number;
  activationsFailed: number;
  dryRunsFailedLast24h: number;
  safetyEvaluationsAttentionLast24h: number;
  simulationsCompletedLast24h: number;
  deliveryAttemptsLast24h: number | null;
  deliverySuccessesLast24h: number | null;
};

/** Mirrors API `AdminPortfolioOrchestrationSummary` — deterministic aggregates only. */
export type PortfolioOrchestrationSummary = {
  workflowsWaitingApproval: number;
  workflowsGovernanceBlocked: number;
  pendingApprovals: number;
  openEscalations: number;
  policyAttentionEvaluations: number;
  workflowsRunning: number;
  workflowsPendingState: number;
  waitingApprovalWorkflowsAged24hPlus: number;
  waitingApprovalWorkflowsAged72hPlus: number;
  oldestPendingApprovalRequestedAt: string | null;
  pendingApprovalsAged48hPlus: number;
  openEscalationsAged24hPlus: number;
  pendingWorkflowTimers: number;
  overdueWorkflowTimers: number;
  activeWorkflowWaits: number;
  bookingsWithRecurringPlan: number;
  orchestrationSafety: OrchestrationSafetyPortfolioCounts;
};

export type AdminPortfolioOrchestrationSummary = PortfolioOrchestrationSummary;

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

/** Deterministic portfolio orchestration counts — read-only; no ranking or automation. */
export async function fetchAdminPortfolioOrchestrationSummary(): Promise<AdminPortfolioOrchestrationSummary> {
  const res = await apiFetch("/admin/portfolio-orchestration/summary");
  const body = (await readJson(res)) as {
    ok?: boolean;
    summary?: AdminPortfolioOrchestrationSummary;
  } | null;
  if (!res.ok || !body?.ok || !body.summary) {
    throw new Error(`Portfolio orchestration summary failed (${res.status})`);
  }
  return body.summary;
}
