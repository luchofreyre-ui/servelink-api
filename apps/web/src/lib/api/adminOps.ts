import { apiFetch } from "../api";
import { readApiJson } from "../api-response";

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
  summary: {
    hotspots?: string[];
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
};

export type OpsItemsResponse = {
  ok: true;
  items: Array<Record<string, unknown> & Partial<OpsDrilldownItemEligibility>>;
};

export async function getOpsSummary() {
  return readOpsEndpointJson<OpsSummaryResponse>("/api/v1/system/ops/summary");
}

export async function getInvalidAssignmentState(limit = 50) {
  const path = `/api/v1/system/ops/bookings/invalid-assignment-state?limit=${limit}`;
  return readOpsEndpointJson<OpsItemsResponse>(path);
}

export async function getDispatchLocked(limit = 50) {
  const path = `/api/v1/system/ops/bookings/dispatch-locked?limit=${limit}`;
  return readOpsEndpointJson<OpsItemsResponse>(path);
}

export async function getReviewRequired(limit = 50) {
  const path = `/api/v1/system/ops/bookings/review-required?limit=${limit}`;
  return readOpsEndpointJson<OpsItemsResponse>(path);
}

export async function getDeferredDispatch(limit = 50) {
  const path = `/api/v1/system/ops/dispatch/deferred?limit=${limit}`;
  return readOpsEndpointJson<OpsItemsResponse>(path);
}

export async function getManualDispatch(limit = 50) {
  const path = `/api/v1/system/ops/dispatch/manual-actions?limit=${limit}`;
  return readOpsEndpointJson<OpsItemsResponse>(path);
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
  },
};

type OpsRequestKey =
  | "summary"
  | "dispatchLocked"
  | "reviewRequired"
  | "deferredDispatch"
  | "manualDispatch24h"
  | "invalidAssignment";

/**
 * Loads all ops drilldowns for the admin ops page.
 * In production only: on failure, returns empty shapes so the shell can render.
 * In development, test, or PLAYWRIGHT=true: rethrows so SSR/auth/API failures are visible.
 */
export async function loadAdminOpsPageData(limit = 25) {
  const opsRequests: Record<
    OpsRequestKey,
    () => Promise<OpsSummaryResponse | OpsItemsResponse>
  > = {
    summary: () => getOpsSummary(),
    dispatchLocked: () => getDispatchLocked(limit),
    reviewRequired: () => getReviewRequired(limit),
    deferredDispatch: () => getDeferredDispatch(limit),
    manualDispatch24h: () => getManualDispatch(limit),
    invalidAssignment: () => getInvalidAssignmentState(limit),
  };

  const entries = Object.entries(opsRequests) as Array<
    [OpsRequestKey, () => Promise<OpsSummaryResponse | OpsItemsResponse>]
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
    OpsSummaryResponse | OpsItemsResponse
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
  };
}
