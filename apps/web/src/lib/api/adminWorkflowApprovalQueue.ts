import { apiFetch } from "@/lib/api";

export type AdminWorkflowApprovalQueueSummary = {
  pendingApprovals: number;
  oldestPendingApproval: {
    id: string;
    approvalType: string;
    workflowExecutionId: string;
    requestedAt: string;
    expiresAt: string | null;
  } | null;
  pendingApprovalsAged48hPlus: number;
  openEscalations: number;
  openEscalationsAged24hPlus: number;
  pendingApprovalsWithExpiryWithin24h: number;
  activeWorkflowWaits: number;
  overdueWorkflowTimers: number;
};

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

/** Portfolio-wide approval/timer posture — read-only aggregates (Phase 18). */
export async function fetchAdminWorkflowApprovalQueueSummary(): Promise<AdminWorkflowApprovalQueueSummary> {
  const res = await apiFetch("/admin/workflow-approvals/queue-summary");
  const body = (await readJson(res)) as {
    ok?: boolean;
    summary?: AdminWorkflowApprovalQueueSummary;
  } | null;
  if (!res.ok || !body?.ok || !body.summary) {
    throw new Error(`Approval queue summary failed (${res.status})`);
  }
  return body.summary;
}
