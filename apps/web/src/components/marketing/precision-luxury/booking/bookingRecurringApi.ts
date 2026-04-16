import { apiFetch } from "@/lib/api";
import type { BookingFlowState, RecurringCadence } from "./bookingFlowTypes";
import { buildSubmitBookingDirectionPayload } from "./bookingIntakePayload";
import type { BookingDirectionOutboundPayload } from "./bookingDirectionIntakeApi";
import { buildEstimateFactorsPayload } from "./bookingEstimateFactors";

/**
 * Canonical list of recurring HTTP routes implemented in the API layer
 * (`RecurringController`, `RecurringOpsController`). Paths are relative to
 * the versioned API base (`WEB_ENV.apiBaseUrl` → `/api/v1`).
 *
 * This is the operator-facing manifest when no separate manifest endpoint exists.
 */
export const RECURRING_API_DOCUMENTED_ROUTES = [
  {
    method: "GET" as const,
    path: "/recurring",
    controller: "RecurringController",
    notes: "Root probe; JWT with admin or customer role.",
  },
  {
    method: "GET" as const,
    path: "/recurring/debug/routes",
    controller: "RecurringController",
    notes: "Debug reachability; JWT with admin or customer role.",
  },
  {
    method: "POST" as const,
    path: "/recurring/plans",
    controller: "RecurringController",
    notes: "Create recurring plan (customer JWT).",
  },
  {
    method: "GET" as const,
    path: "/recurring/plans/me",
    controller: "RecurringController",
    notes: "List plans for authenticated customer.",
  },
  {
    method: "POST" as const,
    path: "/recurring/plans/:planId/next-occurrence/skip",
    controller: "RecurringController",
    notes: "Skip next occurrence for plan owner.",
  },
  {
    method: "GET" as const,
    path: "/recurring/plans/:planId/next-occurrence",
    controller: "RecurringController",
  },
  {
    method: "PATCH" as const,
    path: "/recurring/plans/:planId/next-occurrence",
    controller: "RecurringController",
  },
  {
    method: "GET" as const,
    path: "/recurring/plans/:planId",
    controller: "RecurringController",
  },
  {
    method: "PATCH" as const,
    path: "/recurring/plans/:planId",
    controller: "RecurringController",
  },
  {
    method: "GET" as const,
    path: "/recurring/ops/summary",
    controller: "RecurringOpsController",
    notes: "Admin reliability guard; admin JWT.",
  },
  {
    method: "GET" as const,
    path: "/recurring/ops/exhausted",
    controller: "RecurringOpsController",
    notes: "Admin reliability guard; optional `limit` query.",
  },
] as const;

export type RecurringHttpProbeResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

async function readJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/** `GET /api/v1/recurring` — root probe (admin or customer JWT). */
export async function getRecurringRoot(): Promise<RecurringHttpProbeResult> {
  const response = await apiFetch("/recurring", {
    method: "GET",
    credentials: "include",
  });
  return {
    ok: response.ok,
    status: response.status,
    data: await readJsonBody(response),
  };
}

/** `GET /api/v1/recurring/debug/routes` — debug route listing (admin or customer JWT). */
export async function getRecurringDebugRoutes(): Promise<RecurringHttpProbeResult> {
  const response = await apiFetch("/recurring/debug/routes", {
    method: "GET",
    credentials: "include",
  });
  return {
    ok: response.ok,
    status: response.status,
    data: await readJsonBody(response),
  };
}

export type RecurringManifest = {
  documentedRoutes: typeof RECURRING_API_DOCUMENTED_ROUTES;
  /** Present when `includeLiveProbes` is true; reflects the current session JWT. */
  liveProbes?: {
    root: RecurringHttpProbeResult;
    debugRoutes: RecurringHttpProbeResult;
  };
};

/**
 * Single recurring contract object for the web layer: static route truth plus
 * optional live probes for root and debug endpoints only.
 */
export async function getRecurringManifest(options?: {
  includeLiveProbes?: boolean;
}): Promise<RecurringManifest> {
  if (!options?.includeLiveProbes) {
    return { documentedRoutes: RECURRING_API_DOCUMENTED_ROUTES };
  }
  const [root, debugRoutes] = await Promise.all([
    getRecurringRoot(),
    getRecurringDebugRoutes(),
  ]);
  return {
    documentedRoutes: RECURRING_API_DOCUMENTED_ROUTES,
    liveProbes: { root, debugRoutes },
  };
}

export type {
  RecurringExhaustedRow,
  RecurringOpsExhaustedResponse,
  RecurringOpsSummaryItem,
  RecurringOpsSummaryResponse,
} from "@/lib/api/recurringOps";

export {
  getRecurringOpsExhausted,
  getRecurringOpsSummary,
} from "@/lib/api/recurringOps";

export type CreateRecurringPlanRequest = {
  cadence: RecurringCadence;
  serviceType: string;
  preferredTimeWindow?: string;
  preferredFoId?: string;
  bookingNotes?: string;
  defaultAddonIds: string[];
  nextAnchorAt: string;
  estimateSnapshot: Record<string, unknown>;
  pricingSnapshot: Record<string, unknown>;
  intakeSnapshot: Record<string, unknown>;
  addressSnapshot: Record<string, unknown>;
};

export type RecurringPlanSchedulingInput = {
  nextAnchorAt: string;
  preferredTimeWindow: string;
  defaultAddonIds: string[];
  preferredFoId?: string;
  bookingNotes?: string;
};

export type CreateRecurringPlanResponse = {
  recurringPlan: Record<string, unknown>;
  firstOccurrence: Record<string, unknown>;
  firstOccurrenceGenerationResult: {
    occurrenceId: string;
    bookingId?: string;
    status: string;
    generationError?: string;
  };
};

export function buildCreateRecurringPlanRequest(
  state: BookingFlowState,
  extras: Pick<
    BookingDirectionOutboundPayload,
    "customerName" | "customerEmail" | "source" | "utm"
  >,
  cadence: RecurringCadence,
  scheduling: RecurringPlanSchedulingInput,
): CreateRecurringPlanRequest {
  const intakePayload = buildSubmitBookingDirectionPayload(state, extras);

  const estimateSnapshot =
    state.estimateSnapshot != null
      ? { ...state.estimateSnapshot }
      : (() => {
          throw new Error("Missing estimate snapshot; complete the review step first.");
        })();

  const pricingSnapshot = {
    priceCents: state.estimateSnapshot.priceCents,
    durationMinutes: state.estimateSnapshot.durationMinutes,
    confidence: state.estimateSnapshot.confidence,
    source: state.estimateSnapshot.source,
  };

  const intakeSnapshot: Record<string, unknown> = {
    ...intakePayload,
    estimateFactors: {
      ...buildEstimateFactorsPayload(state.estimateFactors),
      addonIds: [...scheduling.defaultAddonIds],
    },
  };

  const addressSnapshot: Record<string, unknown> = {
    homeSize: state.homeSize,
    bedrooms: state.bedrooms,
    bathrooms: state.bathrooms,
    pets: state.pets ?? "",
  };

  return {
    cadence,
    serviceType: state.serviceId,
    preferredTimeWindow: scheduling.preferredTimeWindow,
    preferredFoId: scheduling.preferredFoId,
    bookingNotes: scheduling.bookingNotes,
    defaultAddonIds: [...scheduling.defaultAddonIds],
    nextAnchorAt: scheduling.nextAnchorAt,
    estimateSnapshot: estimateSnapshot as unknown as Record<string, unknown>,
    pricingSnapshot,
    intakeSnapshot,
    addressSnapshot,
  };
}

export async function createRecurringPlan(
  payload: CreateRecurringPlanRequest,
): Promise<CreateRecurringPlanResponse> {
  const response = await apiFetch("/recurring/plans", {
    method: "POST",
    json: payload,
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Failed to create recurring plan");
  }

  return response.json() as Promise<CreateRecurringPlanResponse>;
}

export async function listMyRecurringPlans(): Promise<{
  ok: boolean;
  items: unknown[];
}> {
  const response = await apiFetch("/recurring/plans/me", {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Failed to load recurring plans");
  }
  return response.json() as Promise<{ ok: boolean; items: unknown[] }>;
}

/** Alias aligned with customer recurring management naming. */
export async function getMyRecurringPlans(): Promise<{
  ok: boolean;
  items: unknown[];
}> {
  return listMyRecurringPlans();
}

export type PlanCancellationEffect =
  | "none"
  | "plan_only"
  | "plan_and_unbooked_occurrence"
  | "booking_linked_but_not_canceled"
  | "booking_canceled";

export type PlanReconciliation = {
  hasUpcomingBookedOccurrence: boolean;
  upcomingBookedOccurrenceId?: string;
  upcomingBookedOccurrenceStatus?: string;
  planCancellationEffect: PlanCancellationEffect;
};

export type RecurringPlanDetailResponse = {
  ok: true;
  item: {
    plan: Record<string, unknown>;
    nextOccurrence: Record<string, unknown> | null;
    recentOccurrences: Record<string, unknown>[];
    reconciliation: PlanReconciliation;
  };
};

export async function getRecurringPlan(
  planId: string,
): Promise<RecurringPlanDetailResponse> {
  const response = await apiFetch(
    `/recurring/plans/${encodeURIComponent(planId)}`,
    { method: "GET", credentials: "include" },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Failed to load recurring plan");
  }
  return response.json() as Promise<RecurringPlanDetailResponse>;
}

export type UpdateRecurringPlanPayload = {
  cadence?: "weekly" | "biweekly" | "monthly";
  action?: "pause" | "resume" | "cancel";
  preferredTimeWindow?: string;
  preferredFoId?: string;
  bookingNotes?: string;
};

export type NextOccurrenceDisposition =
  | "unchanged"
  | "canceled"
  | "skipped"
  | "booking_retained";

export type UpdateRecurringPlanResult = {
  ok: boolean;
  item: Record<string, unknown>;
  downstreamBookingEffect: "not_attempted" | "unsupported" | "applied";
  downstreamBookingEffectReason?: string;
  nextOccurrenceDisposition: NextOccurrenceDisposition;
};

export async function updateRecurringPlan(
  planId: string,
  payload: UpdateRecurringPlanPayload,
): Promise<UpdateRecurringPlanResult> {
  const response = await apiFetch(
    `/recurring/plans/${encodeURIComponent(planId)}`,
    {
      method: "PATCH",
      json: payload,
      credentials: "include",
    },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Failed to update recurring plan");
  }
  return response.json() as Promise<UpdateRecurringPlanResult>;
}

export async function skipNextRecurringOccurrence(planId: string): Promise<{
  ok: boolean;
  item: Record<string, unknown>;
  nextOccurrenceDisposition?: NextOccurrenceDisposition;
}> {
  const response = await apiFetch(
    `/recurring/plans/${encodeURIComponent(planId)}/next-occurrence/skip`,
    { method: "POST", credentials: "include" },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Failed to skip next visit");
  }
  return response.json() as Promise<{
    ok: boolean;
    item: Record<string, unknown>;
    nextOccurrenceDisposition?: NextOccurrenceDisposition;
  }>;
}

export type UpdateNextOccurrencePayload = {
  targetDate?: string;
  preferredTimeWindow?: string;
  preferredFoId?: string;
  overrideInstructions?: string;
  overrideAddonIds?: string[];
};

export async function getNextRecurringOccurrence(planId: string): Promise<{
  ok: boolean;
  item: Record<string, unknown> | null;
}> {
  const response = await apiFetch(
    `/recurring/plans/${encodeURIComponent(planId)}/next-occurrence`,
    { method: "GET", credentials: "include" },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Failed to load next occurrence");
  }
  return response.json() as Promise<{
    ok: boolean;
    item: Record<string, unknown> | null;
  }>;
}

export async function updateNextRecurringOccurrence(
  planId: string,
  payload: UpdateNextOccurrencePayload,
): Promise<{
  ok: boolean;
  item: Record<string, unknown>;
  bookingSync: string;
}> {
  const response = await apiFetch(
    `/recurring/plans/${encodeURIComponent(planId)}/next-occurrence`,
    {
      method: "PATCH",
      json: payload,
      credentials: "include",
    },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Failed to update next occurrence");
  }
  return response.json() as Promise<{
    ok: boolean;
    item: Record<string, unknown>;
    bookingSync: string;
  }>;
}
