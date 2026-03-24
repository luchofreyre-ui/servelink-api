import { WEB_ENV } from "@/lib/env";

export type AdminDispatchExceptionApiItem = {
  bookingId: string;
  bookingStatus: string | null;
  scheduledStart: string | null;
  estimatedDurationMin: number | null;
  latestDecisionStatus: string | null;
  latestTrigger: string | null;
  latestTriggerDetail: string | null;
  latestCreatedAt: string | null;
  totalDispatchPasses: number;
  selectedDecisionCount: number;
  noCandidatesCount: number;
  allExcludedCount: number;
  exceptionReasons: string[];
  latestSelectedFranchiseOwnerId: string | null;
  hasManualIntervention: boolean;
  latestManualActionAt: string | null;
  latestManualActionBy: string | null;
  severity: "high" | "medium" | "low";
  recommendedAction: string;
  availableActions: string[];
  priorityScore: number;
  priorityBucket: string;
  staleSince: string | null;
  requiresFollowUp: boolean;
  detailPath: string;
};

export type AdminDispatchExceptionsApiResponse = {
  items: AdminDispatchExceptionApiItem[];
  nextCursor: string | null;
  totalCount?: number;
};

function readApiErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const m = (payload as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return fallback;
}

export async function fetchAdminDispatchExceptionsPage(
  token: string,
  opts?: { limit?: number; cursor?: string | null },
): Promise<AdminDispatchExceptionsApiResponse> {
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 100);
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (opts?.cursor) qs.set("cursor", opts.cursor);

  const response = await fetch(
    `${WEB_ENV.apiBaseUrl}/api/v1/admin/dispatch/exceptions?${qs.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      readApiErrorMessage(payload, `Dispatch exceptions failed (${response.status})`),
    );
  }

  const obj = payload as AdminDispatchExceptionsApiResponse;
  return {
    items: Array.isArray(obj?.items) ? obj.items : [],
    nextCursor: obj?.nextCursor ?? null,
    totalCount: obj?.totalCount,
  };
}
