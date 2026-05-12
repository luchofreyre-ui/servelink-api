import { apiFetch } from "@/lib/api";

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export type OrchestrationDryRunResponse = {
  ok?: boolean;
  replay?: boolean;
  dryRunId?: string;
  previewState?: string;
  resultJson?: unknown;
};

export type WorkflowRecommendationAcceptanceRow = {
  id: string;
  workflowExecutionId: string;
  recommendationKey: string;
  acceptanceState: string;
  acceptedByUserId: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
  revokedByUserId: string | null;
  workflowApprovalId: string | null;
  payloadJson: unknown;
  idempotencyKey: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Phase 19 — deterministic orchestration simulation (admin); does not mutate workflows or bookings. */
export async function postOrchestrationDryRun(body: {
  workflowExecutionId: string;
  previewCategory?: string;
  recommendationKey?: string | null;
  idempotencyKey?: string | null;
}): Promise<OrchestrationDryRunResponse> {
  const res = await apiFetch("/admin/orchestration-preview/dry-run", {
    method: "POST",
    json: body,
  });
  const parsed = (await readJson(res)) as OrchestrationDryRunResponse | null;
  if (!res.ok || !parsed?.ok) {
    throw new Error(`Orchestration dry-run failed (${res.status})`);
  }
  return parsed;
}

export async function fetchOrchestrationDryRunHistory(params: {
  workflowExecutionId: string;
  take?: number;
}): Promise<{ items: unknown[] }> {
  const q = new URLSearchParams({
    workflowExecutionId: params.workflowExecutionId,
    take: String(params.take ?? 15),
  });
  const res = await apiFetch(`/admin/orchestration-preview/dry-runs?${q.toString()}`);
  const body = (await readJson(res)) as {
    ok?: boolean;
    items?: unknown[];
  } | null;
  if (!res.ok || !body?.ok || !Array.isArray(body.items)) {
    throw new Error(`Dry-run history failed (${res.status})`);
  }
  return { items: body.items };
}

export async function postRecommendationAcceptance(body: {
  workflowExecutionId: string;
  recommendationKey: string;
  workflowApprovalId?: string | null;
  idempotencyKey?: string | null;
  note?: string | null;
}): Promise<{ replay?: boolean; acceptance?: { id: string } }> {
  const res = await apiFetch("/admin/orchestration-preview/recommendation-acceptance", {
    method: "POST",
    json: body,
  });
  const parsed = (await readJson(res)) as {
    ok?: boolean;
    replay?: boolean;
    acceptance?: { id: string };
  } | null;
  if (!res.ok || !parsed?.ok) {
    throw new Error(`Recommendation acceptance failed (${res.status})`);
  }
  return parsed;
}

export async function fetchRecommendationAcceptances(params: {
  workflowExecutionId: string;
  take?: number;
}): Promise<{ items: WorkflowRecommendationAcceptanceRow[] }> {
  const q = new URLSearchParams({
    workflowExecutionId: params.workflowExecutionId,
    take: String(params.take ?? 25),
  });
  const res = await apiFetch(
    `/admin/orchestration-preview/recommendation-acceptances?${q.toString()}`,
  );
  const body = (await readJson(res)) as {
    ok?: boolean;
    items?: WorkflowRecommendationAcceptanceRow[];
  } | null;
  if (!res.ok || !body?.ok || !Array.isArray(body.items)) {
    throw new Error(`Recommendation acceptances failed (${res.status})`);
  }
  return { items: body.items };
}

export async function postRevokeRecommendationAcceptance(body: {
  acceptanceId: string;
}): Promise<void> {
  const res = await apiFetch(
    "/admin/orchestration-preview/recommendation-acceptance/revoke",
    {
      method: "POST",
      json: body,
    },
  );
  const parsed = (await readJson(res)) as { ok?: boolean } | null;
  if (!res.ok || !parsed?.ok) {
    throw new Error(`Revoke acceptance failed (${res.status})`);
  }
}
