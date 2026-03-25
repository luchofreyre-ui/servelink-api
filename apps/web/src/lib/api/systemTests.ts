import { API_BASE_URL } from "@/lib/api";
import type {
  SystemTestRunDetailResponse,
  SystemTestRunsListResponse,
  SystemTestSummaryResponse,
} from "@/types/systemTests";

const FETCH_TIMEOUT_MS = 25_000;

async function adminJson<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers as Record<string, string>),
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(
      (payload as { message?: string }).message || `Request failed: ${response.status}`,
    );
  }
  return payload as T;
}

export async function fetchAdminSystemTestsSummary(
  token: string,
): Promise<SystemTestSummaryResponse> {
  return adminJson<SystemTestSummaryResponse>(token, "/api/v1/admin/system-tests/summary");
}

export async function fetchAdminSystemTestRuns(
  token: string,
  query?: { page?: number; limit?: number },
): Promise<SystemTestRunsListResponse> {
  const qs = new URLSearchParams();
  qs.set("page", String(query?.page ?? 1));
  qs.set("limit", String(query?.limit ?? 20));
  return adminJson<SystemTestRunsListResponse>(
    token,
    `/api/v1/admin/system-tests/runs?${qs.toString()}`,
  );
}

export async function fetchAdminSystemTestRunDetail(
  token: string,
  runId: string,
): Promise<SystemTestRunDetailResponse> {
  return adminJson<SystemTestRunDetailResponse>(
    token,
    `/api/v1/admin/system-tests/runs/${encodeURIComponent(runId)}`,
  );
}
