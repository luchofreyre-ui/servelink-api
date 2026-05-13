import { apiFetch } from "../api";
import { readApiJson } from "../api-response";
import type {
  EstimateGovernanceSummary,
  RecurringEconomicsSummary,
} from "../bookings/bookingApiTypes";

export type { EstimateGovernanceSummary, RecurringEconomicsSummary };

/** Server-side ops reads: no caching (RSC + authenticated drilldowns). */
const OPS_FETCH_INIT = {
  cache: "no-store" as const,
  next: { revalidate: 0 },
};

const isStrictOpsSsr =
  process.env.NODE_ENV !== "production" ||
  process.env.PLAYWRIGHT === "true";

async function readOpsEndpointJson<T>(path: string): Promise<T> {
  try {
    return await readApiJson<T>(
      await apiFetch(path, OPS_FETCH_INIT),
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(`GET ${path} failed: ${message}`);
  }
}

export type OpsSummaryResponse = {
  ok: true;
  cron?: {
    reconciliation?: OpsCronHealthSnapshot;
    remainingBalanceAuth?: OpsCronHealthSnapshot;
    operationalAnalyticsWarehouseRefresh?: OpsCronHealthSnapshot;
  };
  cronLedger?: OpsCronLedgerSummary;
  payment?: OpsPaymentSummary;
  slotHolds?: {
    active?: number;
    expired?: number;
    consumed?: number;
  };
  summary: {
    hotspots?: string[];
    cron?: {
      reconciliation?: OpsCronHealthSnapshot;
      remainingBalanceAuth?: OpsCronHealthSnapshot;
      operationalAnalyticsWarehouseRefresh?: OpsCronHealthSnapshot;
    };
    cronLedger?: OpsCronLedgerSummary;
    payment?: OpsPaymentSummary;
    slotHolds?: {
      active?: number;
      expired?: number;
      consumed?: number;
    };
    bookings?: {
      invalidAssignmentState?: number;
      dispatchLocked?: number;
      reviewRequired?: number;
    };
    dispatch?: {
      deferredDecisions?: number;
    };
  };
};

export type OpsPaymentSummary = {
  bookingStates?: {
    available?: boolean;
    pendingPayment?: number;
    authorized?: number;
    depositSucceeded?: number;
    completedMissingPaymentAlignment?: number;
    depositStateMismatch?: number;
  };
  anomalies?: {
    available?: boolean;
    openPaymentAnomalies?: number;
    openOpsPaymentAnomalies?: number;
    recentPaymentAnomaliesLast24h?: number;
    recentPaymentAnomaliesLast7d?: number;
    [key: string]: unknown;
  };
  staleBuckets?: {
    available?: boolean;
    "0-30m"?: number;
    "30m-2h"?: number;
    "2h-24h"?: number;
    "1-7d"?: number;
    "7-30d"?: number;
    ">30d"?: number;
  };
  flags?: {
    hasRecentPaymentFailures?: boolean;
    hasStalePendingPayments?: boolean;
    hasDepositStateMismatch?: boolean;
  };
};

export type OpsCronLedgerSummary = {
  available?: boolean;
  reason?: string;
  jobs?: Record<
    string,
    {
      lastStatus?: string | null;
      lastStartedAt?: string | null;
      lastFinishedAt?: string | null;
      lastDurationMs?: number | null;
      lastErrorMessage?: string | null;
      recentFailures24h?: number;
      recentRuns24h?: number;
    }
  >;
};

export type OpsCronHealthSnapshot = {
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  stale: boolean;
};

/**
 * Drilldown rows include server-computed eligibility (see `dispatch-ops-eligibility.ts`).
 * The web UI must not infer these from partial booking state.
 */
export type OpsDrilldownItemEligibility = {
  canReleaseDispatchLock?: boolean;
  releaseDispatchLockDisabledReason?: string | null;
  canClearReviewRequired?: boolean;
  clearReviewRequiredDisabledReason?: string | null;
  canTriggerRedispatch?: boolean;
  triggerRedispatchDisabledReason?: string | null;
  canAssignExceptionToMe?: boolean;
  assignExceptionToMeDisabledReason?: string | null;
  canResolveException?: boolean;
  resolveExceptionDisabledReason?: string | null;
  governanceSummary?: EstimateGovernanceSummary | null;
  recurringEconomicsSummary?: RecurringEconomicsSummary | null;
};

export type OpsItemsResponse = {
  ok: true;
  items: Array<Record<string, unknown> & Partial<OpsDrilldownItemEligibility>>;
};

export type FoSupplyOpsCategory =
  | "ready"
  | "blocked_configuration"
  | "inactive_or_restricted";

export type FoSupplyReadinessItem = {
  franchiseOwnerId: string;
  displayName: string;
  email: string;
  status: string;
  safetyHold: boolean;
  opsCategory: FoSupplyOpsCategory;
  supply: { ok: boolean; reasons: string[] };
  eligibility: { canAcceptBooking: boolean; reasons: string[] };
  configSummary: {
    hasCoordinates: boolean;
    homeLat: number | null;
    homeLng: number | null;
    maxTravelMinutes: number | null;
    scheduleRowCount: number;
    matchableServiceTypes: string[];
    maxDailyLaborMinutes: number | null;
    maxLaborMinutes: number | null;
    maxSquareFootage: number | null;
  };
};

export type FoSupplyReadinessResponse = {
  ok: true;
  items: FoSupplyReadinessItem[];
};

export type RecurringOpsSummary = {
  pendingGenerationCount: number;
  processingCount: number;
  failedRetryableCount: number;
  exhaustedCount: number;
  reconciliationDriftCount: number;
  canceledPlanWithBookedNextCount: number;
};

export type RecurringOpsExhaustedItem = {
  occurrenceId: string;
  planId: string;
  customerId: string;
  customerEmail: string;
  processingAttempts: number;
  status: string;
  reconciliationState: string | null;
  bookingId: string | null;
  bookingFingerprint: string | null;
  generationError: string | null;
  updatedAt: string;
};

export type RecurringOpsPageData = {
  summary: RecurringOpsSummary | null;
  exhausted: RecurringOpsExhaustedItem[];
  unavailableReason: string | null;
};

export type AdminRecurringPlan = {
  id: string;
  bookingId: string;
  customerId: string;
  franchiseOwnerId: string | null;
  cadence: "weekly" | "biweekly" | "monthly";
  status: "active" | "paused" | "cancelled";
  pricePerVisitCents: number;
  estimatedMinutes: number;
  discountPercent: number;
  startAt: string;
  nextRunAt: string;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: string;
    status: string;
    createdAt: string;
    customer?: {
      id: string;
      name?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  } | null;
};

export type AdminRecurringPlanOutcome = {
  id: string;
  bookingId: string;
  converted: boolean;
  cadence?: "weekly" | "biweekly" | "monthly" | null;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: string;
    status: string;
    createdAt: string;
    customer?: {
      id: string;
      name?: string | null;
      email?: string | null;
    } | null;
  } | null;
};

export async function getOpsSummary() {
  return readOpsEndpointJson<OpsSummaryResponse>("/system/ops/summary");
}

export async function getInvalidAssignmentState(limit = 50) {
  const path = `/system/ops/bookings/invalid-assignment-state?limit=${limit}`;
  return readOpsEndpointJson<OpsItemsResponse>(path);
}

export async function getDispatchLocked(limit = 50) {
  const path = `/system/ops/bookings/dispatch-locked?limit=${limit}`;
  return readOpsEndpointJson<OpsItemsResponse>(path);
}

export async function getReviewRequired(limit = 50) {
  const path = `/system/ops/bookings/review-required?limit=${limit}`;
  return readOpsEndpointJson<OpsItemsResponse>(path);
}

export async function getDeferredDispatch(limit = 50) {
  const path = `/system/ops/dispatch/deferred?limit=${limit}`;
  return readOpsEndpointJson<OpsItemsResponse>(path);
}

export async function getManualDispatch(limit = 50) {
  const path = `/system/ops/dispatch/manual-actions?limit=${limit}`;
  return readOpsEndpointJson<OpsItemsResponse>(path);
}

export async function getFoSupplyReadiness() {
  const path = `/system/ops/supply/franchise-owners`;
  return readOpsEndpointJson<FoSupplyReadinessResponse>(path);
}

export async function fetchAdminRecurringPlans(params?: {
  status?: "active" | "paused" | "cancelled";
  cadence?: "weekly" | "biweekly" | "monthly";
}): Promise<AdminRecurringPlan[]> {
  const search = new URLSearchParams();

  if (params?.status) search.set("status", params.status);
  if (params?.cadence) search.set("cadence", params.cadence);

  const query = search.toString();
  const path = `/recurring-plans/admin${query ? `?${query}` : ""}`;

  return readApiJson<AdminRecurringPlan[]>(await apiFetch(path, OPS_FETCH_INIT));
}

export async function fetchRecurringPlanOutcomes(params?: {
  converted?: boolean;
}): Promise<AdminRecurringPlanOutcome[]> {
  const search = new URLSearchParams();
  if (params?.converted !== undefined) {
    search.set("converted", String(params.converted));
  }

  const query = search.toString();
  const path = `/recurring-plans/admin/outcomes${query ? `?${query}` : ""}`;

  return readApiJson<AdminRecurringPlanOutcome[]>(
    await apiFetch(path, OPS_FETCH_INIT),
  );
}

export async function getRecurringOpsSummary() {
  const body = await readOpsEndpointJson<{
    ok: true;
    item: RecurringOpsSummary;
  }>("/recurring/ops/summary");
  return body.item;
}

export async function getExhaustedRecurringOccurrences(limit = 50) {
  const body = await readOpsEndpointJson<{
    ok: true;
    items: RecurringOpsExhaustedItem[];
  }>(`/recurring/ops/exhausted?limit=${limit}`);
  return body.items;
}

export async function loadRecurringOpsPageData(
  limit = 50,
): Promise<RecurringOpsPageData> {
  const [summary, exhausted] = await Promise.allSettled([
    getRecurringOpsSummary(),
    getExhaustedRecurringOccurrences(limit),
  ]);

  const failures = [summary, exhausted]
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason)));

  if (failures.length > 0) {
    return {
      summary: summary.status === "fulfilled" ? summary.value : null,
      exhausted: exhausted.status === "fulfilled" ? exhausted.value : [],
      unavailableReason: failures.join(" | "),
    };
  }

  return {
    summary: summary.status === "fulfilled" ? summary.value : null,
    exhausted: exhausted.status === "fulfilled" ? exhausted.value : [],
    unavailableReason: null,
  };
}

const EMPTY_OPS_ITEMS: OpsItemsResponse = { ok: true, items: [] };

const EMPTY_OPS_SUMMARY: OpsSummaryResponse = {
  ok: true,
  summary: {
    hotspots: [],
    bookings: {
      invalidAssignmentState: 0,
      dispatchLocked: 0,
      reviewRequired: 0,
    },
    dispatch: {
      deferredDecisions: 0,
    },
    cron: {
      reconciliation: {
        lastRunAt: null,
        lastSuccessAt: null,
        lastFailureAt: null,
        stale: true,
      },
      remainingBalanceAuth: {
        lastRunAt: null,
        lastSuccessAt: null,
        lastFailureAt: null,
        stale: true,
      },
    },
    slotHolds: {
      active: 0,
      expired: 0,
      consumed: 0,
    },
  },
};

const EMPTY_FO_SUPPLY: FoSupplyReadinessResponse = { ok: true, items: [] };

type OpsRequestKey =
  | "summary"
  | "dispatchLocked"
  | "reviewRequired"
  | "deferredDispatch"
  | "manualDispatch24h"
  | "invalidAssignment"
  | "foSupply";

/**
 * Loads all ops drilldowns for the admin ops page.
 * In production only: on failure, returns empty shapes so the shell can render.
 * In development, test, or PLAYWRIGHT=true: rethrows so SSR/auth/API failures are visible.
 */
export async function loadAdminOpsPageData(limit = 25) {
  const opsRequests: Record<
    OpsRequestKey,
    () => Promise<
      OpsSummaryResponse | OpsItemsResponse | FoSupplyReadinessResponse
    >
  > = {
    summary: () => getOpsSummary(),
    dispatchLocked: () => getDispatchLocked(limit),
    reviewRequired: () => getReviewRequired(limit),
    deferredDispatch: () => getDeferredDispatch(limit),
    manualDispatch24h: () => getManualDispatch(limit),
    invalidAssignment: () => getInvalidAssignmentState(limit),
    foSupply: () => getFoSupplyReadiness(),
  };

  const entries = Object.entries(opsRequests) as Array<
    [
      OpsRequestKey,
      () => Promise<
        OpsSummaryResponse | OpsItemsResponse | FoSupplyReadinessResponse
      >,
    ]
  >;

  const settled = await Promise.allSettled(
    entries.map(async ([key, fn]) => {
      const value = await fn();
      return [key, value] as const;
    }),
  );

  const failures: { key: OpsRequestKey; message: string }[] = [];
  const fulfilled = new Map<
    OpsRequestKey,
    OpsSummaryResponse | OpsItemsResponse | FoSupplyReadinessResponse
  >();

  for (let i = 0; i < settled.length; i++) {
    const key = entries[i][0];
    const s = settled[i];
    if (s.status === "fulfilled") {
      const [, value] = s.value;
      fulfilled.set(key, value);
    } else {
      const reason = s.reason;
      const message =
        reason instanceof Error ? reason.message : String(reason);
      failures.push({ key, message });
    }
  }

  if (isStrictOpsSsr && failures.length > 0) {
    throw new Error(
      `Admin ops SSR fetch failed: ${failures
        .map((f) => `${f.key} -> ${f.message}`)
        .join(" | ")}`,
    );
  }

  return {
    summary: (fulfilled.get("summary") as OpsSummaryResponse | undefined) ??
      EMPTY_OPS_SUMMARY,
    invalid:
      (fulfilled.get("invalidAssignment") as OpsItemsResponse | undefined) ??
      EMPTY_OPS_ITEMS,
    locked:
      (fulfilled.get("dispatchLocked") as OpsItemsResponse | undefined) ??
      EMPTY_OPS_ITEMS,
    reviewRequired:
      (fulfilled.get("reviewRequired") as OpsItemsResponse | undefined) ??
      EMPTY_OPS_ITEMS,
    deferred:
      (fulfilled.get("deferredDispatch") as OpsItemsResponse | undefined) ??
      EMPTY_OPS_ITEMS,
    manual:
      (fulfilled.get("manualDispatch24h") as OpsItemsResponse | undefined) ??
      EMPTY_OPS_ITEMS,
    foSupply:
      (fulfilled.get("foSupply") as FoSupplyReadinessResponse | undefined) ??
      EMPTY_FO_SUPPLY,
  };
}
