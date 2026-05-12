/** Mirrors `/api/v1/bookings/:id/orchestration-surface` — read-only product orchestration digest. */

export type WorkflowOperationalDigestClient = {
  hasWorkflow: boolean;
  workflowExecutionId: string | null;
  workflowType: string | null;
  state: string | null;
  executionStage: string | null;
  executionMode: string | null;
  approvalState: string | null;
  updatedAt: string | null;
  waitingOnApproval: boolean;
  governanceBlocked: boolean;
  completedSuccessfully: boolean;
  headlineCustomer: string;
  headlineFo: string;
  headlineAdmin: string;
  stepsDigest: Array<{ stepType: string; state: string; label: string }>;
  approvalsDigest: Array<{
    approvalType: string;
    state: string;
    headline: string;
  }>;
};

export type OperationalRecommendationClient = {
  id: string;
  severity: "info" | "attention";
  title: string;
  detail: string;
};

/** Persisted deterministic policy snapshot row (observe/evaluate only). */
export type OperationalPolicyEvaluationSurfaceClient = {
  policyCategory: string;
  policyKey: string;
  evaluationResult: string;
  severity: string;
  explanation: string;
  createdAt: string;
};

/** Present when API supports Phase 17 timing substrate; clients coerce missing to empty surfaces. */
export type OperationalTimingSurfaceClient = {
  pendingTimers: Array<{
    timerType: string;
    timerState: string;
    wakeAt: string;
    triggeredAt: string | null;
    dedupeKey: string;
  }>;
  waitStates: Array<{
    waitCategory: string;
    waitState: string;
    waitingOn: string;
    expiresAt: string | null;
    resolvedAt: string | null;
  }>;
};

export type BookingOrchestrationSurfacePayload = {
  digest: WorkflowOperationalDigestClient;
  deterministicRecommendations: OperationalRecommendationClient[];
  /** Present when API supports Phase 15 policy snapshots; clients coerce missing to []. */
  policyEvaluations?: OperationalPolicyEvaluationSurfaceClient[];
  timingSurface?: OperationalTimingSurfaceClient;
};

export type OrchestrationDigestLike =
  | WorkflowOperationalDigestClient
  | Record<string, unknown>
  | null
  | undefined;

/** Snapshot rows embed `orchestrationDigest` — coerce safely for UI pills. */
export function coerceOrchestrationDigest(
  raw: unknown,
): WorkflowOperationalDigestClient | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.hasWorkflow !== "boolean") return null;
  return raw as WorkflowOperationalDigestClient;
}

/** Short queue-facing label — deterministic, not ranked by ML. */
export function orchestrationQueuePillLabel(
  d: WorkflowOperationalDigestClient | null,
): string | null {
  if (!d?.hasWorkflow) return null;
  if (d.waitingOnApproval) return "Coordination pause";
  if (d.governanceBlocked) return "Governance review";
  if (d.completedSuccessfully) return "Ops trail complete";
  return "Ops signals recorded";
}
