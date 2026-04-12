import { API_BASE_URL } from "@/lib/api";
import type {
  SystemTestsAutomationJobDetailResponse,
  SystemTestsAutomationJobsResponse,
  SystemTestsAutomationStatus,
  SystemTestsAutomationTriggerResponse,
} from "@/types/systemTestsAutomation";

const FETCH_TIMEOUT_MS = 25_000;

function parseJsonStrict(raw: string, status: number): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`Invalid JSON response (HTTP ${status})`);
  }
}

async function adminJson<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let response: Response;
  try {
    const initHeaders = init?.headers;
    const extra =
      initHeaders && typeof initHeaders === "object" && !Array.isArray(initHeaders)
        ? Object.fromEntries(new Headers(initHeaders as HeadersInit).entries())
        : {};

    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...extra,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  const payload = parseJsonStrict(text, response.status) as T & { message?: string };

  if (!response.ok) {
    const msg =
      typeof (payload as { message?: unknown }).message === "string"
        ? String((payload as { message: string }).message)
        : `Request failed: ${response.status}`;
    throw new Error(msg);
  }

  return payload as T;
}

export async function fetchSystemTestsAutomationStatus(
  accessToken: string,
): Promise<SystemTestsAutomationStatus> {
  return adminJson<SystemTestsAutomationStatus>(
    accessToken,
    "/admin/system-tests/automation/status",
  );
}

export async function fetchSystemTestsAutomationJob(
  accessToken: string,
  jobId: string,
): Promise<SystemTestsAutomationJobDetailResponse> {
  return adminJson<SystemTestsAutomationJobDetailResponse>(
    accessToken,
    `/admin/system-tests/automation/jobs/${encodeURIComponent(jobId)}`,
  );
}

export async function fetchSystemTestsAutomationJobs(
  accessToken: string,
  limit = 50,
): Promise<SystemTestsAutomationJobsResponse> {
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  return adminJson<SystemTestsAutomationJobsResponse>(
    accessToken,
    `/admin/system-tests/automation/jobs?${qs.toString()}`,
  );
}

export async function postSystemTestsRunDigest(
  accessToken: string,
): Promise<SystemTestsAutomationTriggerResponse> {
  return adminJson<SystemTestsAutomationTriggerResponse>(
    accessToken,
    "/admin/system-tests/automation/run-digest",
    { method: "POST" },
  );
}

export async function postSystemTestsEvaluateAlert(
  accessToken: string,
): Promise<SystemTestsAutomationTriggerResponse> {
  return adminJson<SystemTestsAutomationTriggerResponse>(
    accessToken,
    "/admin/system-tests/automation/evaluate-alert",
    { method: "POST" },
  );
}

export async function postSystemTestsGenerateTriage(
  accessToken: string,
): Promise<SystemTestsAutomationTriggerResponse> {
  return adminJson<SystemTestsAutomationTriggerResponse>(
    accessToken,
    "/admin/system-tests/automation/generate-triage",
    { method: "POST" },
  );
}

export async function postSystemTestsSendJob(
  accessToken: string,
  jobId: string,
): Promise<{ ok: boolean; status: string; error?: string }> {
  return adminJson<{ ok: boolean; status: string; error?: string }>(
    accessToken,
    `/admin/system-tests/automation/send-job/${encodeURIComponent(jobId)}`,
    { method: "POST" },
  );
}
