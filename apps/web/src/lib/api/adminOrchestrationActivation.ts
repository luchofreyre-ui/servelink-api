import { apiFetch } from "@/lib/api";

export const GUIDED_ACTIVATION_CATEGORY_BOOKING_TRANSITION =
  "booking_transition_invoke_v1" as const;

export const GUIDED_ACTIVATION_RECOMMENDATION_KEY_APPROVED_INVOKE =
  "approved_invoke_pending" as const;

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export type WorkflowExecutionActivationRow = {
  id: string;
  workflowExecutionId: string;
  recommendationAcceptanceId: string;
  activationState: string;
  activationCategory: string;
  requestedByUserId: string | null;
  approvedByUserId: string | null;
  invokedAt: string | null;
  payloadJson: unknown;
  resultJson: unknown;
  idempotencyKey: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchOrchestrationActivations(params: {
  workflowExecutionId: string;
}): Promise<{ items: WorkflowExecutionActivationRow[] }> {
  const q = new URLSearchParams({ workflowExecutionId: params.workflowExecutionId });
  const res = await apiFetch(`/admin/orchestration-activation?${q.toString()}`);
  const body = (await readJson(res)) as {
    ok?: boolean;
    items?: WorkflowExecutionActivationRow[];
  } | null;
  if (!res.ok || !body?.ok || !Array.isArray(body.items)) {
    throw new Error(`Orchestration activations failed (${res.status})`);
  }
  return { items: body.items };
}

export async function postOrchestrationActivationRegister(body: {
  workflowExecutionId: string;
  recommendationAcceptanceId: string;
  activationCategory: string;
  dryRunExecutionId?: string | null;
  note?: string | null;
  idempotencyKey?: string | null;
}): Promise<{ replay?: boolean; activationId?: string }> {
  const res = await apiFetch("/admin/orchestration-activation/register", {
    method: "POST",
    json: body,
  });
  const parsed = (await readJson(res)) as {
    ok?: boolean;
    replay?: boolean;
    activationId?: string;
  } | null;
  if (!res.ok || !parsed?.ok) {
    throw new Error(`Activation register failed (${res.status})`);
  }
  return parsed;
}

export async function postOrchestrationActivationApprove(body: {
  activationId: string;
}): Promise<void> {
  const res = await apiFetch("/admin/orchestration-activation/approve", {
    method: "POST",
    json: body,
  });
  const parsed = (await readJson(res)) as { ok?: boolean } | null;
  if (!res.ok || !parsed?.ok) {
    throw new Error(`Activation approve failed (${res.status})`);
  }
}

export async function postOrchestrationActivationInvoke(body: {
  activationId: string;
}): Promise<{ replay?: boolean; outcome?: unknown }> {
  const res = await apiFetch("/admin/orchestration-activation/invoke", {
    method: "POST",
    json: body,
  });
  const parsed = (await readJson(res)) as {
    ok?: boolean;
    replay?: boolean;
    outcome?: unknown;
  } | null;
  if (!res.ok || !parsed?.ok) {
    throw new Error(`Activation invoke failed (${res.status})`);
  }
  return parsed;
}

export async function postOrchestrationActivationCancel(body: {
  activationId: string;
}): Promise<void> {
  const res = await apiFetch("/admin/orchestration-activation/cancel", {
    method: "POST",
    json: body,
  });
  const parsed = (await readJson(res)) as { ok?: boolean } | null;
  if (!res.ok || !parsed?.ok) {
    throw new Error(`Activation cancel failed (${res.status})`);
  }
}
