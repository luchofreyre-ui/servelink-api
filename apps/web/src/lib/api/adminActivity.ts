import { API_BASE_URL } from "@/lib/api";

export type AdminActivityApiItem = {
  id: string;
  type: string;
  actorAdminUserId?: string | null;
  createdAt: string;
  bookingId?: string | null;
  dispatchConfigId?: string | null;
  title?: string;
  description?: string;
  summary?: string | null;
  metadata?: Record<string, unknown>;
  detailPath?: string | null;
  anomalyId?: string | null;
};

export type AdminActivityApiResponse = {
  items: AdminActivityApiItem[];
  nextCursor: string | null;
};

const FETCH_TIMEOUT_MS = 20_000;

export async function fetchAdminActivityPage(params: {
  token: string;
  limit?: number;
  cursor?: string | null;
}): Promise<AdminActivityApiResponse> {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit ?? 40));
  if (params.cursor) {
    qs.set("cursor", params.cursor);
  }
  // Defeat intermediary caches after command-center mutations / client navigations.
  qs.set("_cb", String(Date.now()));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/admin/activity?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${params.token}` },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Admin activity request timed out.");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  const payload = (await response.json()) as AdminActivityApiResponse & { message?: string };

  if (!response.ok) {
    throw new Error(payload?.message || "Failed to load admin activity.");
  }

  return {
    items: Array.isArray(payload.items) ? payload.items : [],
    nextCursor: payload.nextCursor ?? null,
  };
}
