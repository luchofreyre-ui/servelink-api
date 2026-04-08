import { API_BASE_URL } from "@/lib/api";

export type AdminAnomalySlaState = "dueSoon" | "overdue" | "breached";

export type AdminAnomalyApiItem = {
  id: string;
  fingerprint?: string | null;
  anomalyType: string;
  severity?: string;
  status?: string;
  opsStatus?: string;
  occurrences?: number;
  firstSeenAt?: string;
  lastSeenAt?: string | null;
  createdAt?: string;
  slaDueAt?: string | null;
  slaBreachedAt?: string | null;
  assignedToAdminId?: string | null;
  bookingId?: string | null;
  foId?: string | null;
  bookingStatus?: string | null;
  reviewState?: string | null;
  bookingWorkflowState?: string | null;
  detailPath?: string | null;
  slaState?: AdminAnomalySlaState | null;
  payload?: unknown;
};

export type AdminAnomaliesListResponse = {
  anomalies: AdminAnomalyApiItem[];
  page?: {
    nextCursor?: string | null;
  };
};

const FETCH_TIMEOUT_MS = 20_000;

export async function fetchAdminAnomaliesPage(params: {
  token: string;
  limit?: number;
  cursor?: string | null;
  sinceHours?: number;
  mine?: boolean;
  unassigned?: boolean;
  sla?: AdminAnomalySlaState | "" | null;
}): Promise<AdminAnomaliesListResponse> {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit ?? 50));
  qs.set("sinceHours", String(params.sinceHours ?? 168));
  qs.set("includePayload", "0");
  qs.set("sortBy", "lastSeenAt");
  qs.set("sort", "desc");
  qs.set("_cb", String(Date.now()));
  if (params.cursor) qs.set("cursor", params.cursor);
  if (params.mine) qs.set("mine", "1");
  if (params.unassigned) qs.set("unassigned", "1");
  if (params.sla) qs.set("sla", params.sla);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/admin/ops/anomalies?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${params.token}` },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Anomalies request timed out.");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  const json = (await response.json()) as {
    ok?: boolean;
    data?: AdminAnomaliesListResponse;
    error?: { message?: string };
  };

  if (!response.ok || json.ok === false) {
    throw new Error(json.error?.message || "Failed to load anomalies.");
  }

  const data = json.data;
  if (!data) {
    return { anomalies: [], page: {} };
  }

  return {
    anomalies: Array.isArray(data.anomalies) ? data.anomalies : [],
    page: data.page,
  };
}
