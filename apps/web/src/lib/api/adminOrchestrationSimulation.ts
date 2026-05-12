import { apiFetch } from "@/lib/api";

/** Mirrors API constants — deterministic simulation categories only. */
export const WORKFLOW_SIMULATION_SCENARIO_CATEGORY_WEB = {
  ORCHESTRATION_SAFETY_SNAPSHOT_V1: "orchestration_safety_snapshot_v1",
  ACTIVATION_FOCUS_V1: "activation_focus_v1",
} as const;

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export type WorkflowSimulationScenarioRow = {
  id: string;
  scenarioCategory: string;
  workflowExecutionId: string;
  activationId: string | null;
  simulationState: string;
  requestedByUserId: string | null;
  idempotencyKey: string | null;
  payloadJson: unknown;
  resultJson: unknown;
  createdAt: string;
};

export type OperationalSafetyEvaluationRow = {
  id: string;
  workflowExecutionId: string;
  simulationScenarioId: string | null;
  evaluationCategory: string;
  severity: string;
  explanation: string;
  payloadJson: unknown;
  createdAt: string;
};

/** Phase 21 — persists observations only; never executes workflows or bookings. */
export async function postOrchestrationSimulationRun(body: {
  workflowExecutionId: string;
  scenarioCategory: string;
  activationId?: string | null;
  idempotencyKey?: string | null;
}): Promise<{
  ok?: boolean;
  replay?: boolean;
  scenarioId?: string;
  simulationState?: string;
  resultJson?: unknown;
}> {
  const res = await apiFetch("/admin/orchestration-simulation/run", {
    method: "POST",
    json: body,
  });
  const parsed = (await readJson(res)) as {
    ok?: boolean;
    replay?: boolean;
    scenarioId?: string;
    simulationState?: string;
    resultJson?: unknown;
  } | null;
  if (!res.ok || !parsed?.ok) {
    throw new Error(`Orchestration simulation failed (${res.status})`);
  }
  return parsed;
}

export async function fetchOrchestrationSimulationScenarios(params: {
  workflowExecutionId: string;
  take?: number;
}): Promise<{ items: WorkflowSimulationScenarioRow[] }> {
  const q = new URLSearchParams({
    workflowExecutionId: params.workflowExecutionId,
    take: String(params.take ?? 30),
  });
  const res = await apiFetch(`/admin/orchestration-simulation/scenarios?${q.toString()}`);
  const body = (await readJson(res)) as {
    ok?: boolean;
    items?: WorkflowSimulationScenarioRow[];
  } | null;
  if (!res.ok || !body?.ok || !Array.isArray(body.items)) {
    throw new Error(`Simulation scenarios failed (${res.status})`);
  }
  return { items: body.items };
}

export async function fetchOperationalSafetyEvaluations(params: {
  workflowExecutionId: string;
  take?: number;
}): Promise<{ items: OperationalSafetyEvaluationRow[] }> {
  const q = new URLSearchParams({
    workflowExecutionId: params.workflowExecutionId,
    take: String(params.take ?? 50),
  });
  const res = await apiFetch(
    `/admin/orchestration-simulation/safety-evaluations?${q.toString()}`,
  );
  const body = (await readJson(res)) as {
    ok?: boolean;
    items?: OperationalSafetyEvaluationRow[];
  } | null;
  if (!res.ok || !body?.ok || !Array.isArray(body.items)) {
    throw new Error(`Safety evaluations failed (${res.status})`);
  }
  return { items: body.items };
}
