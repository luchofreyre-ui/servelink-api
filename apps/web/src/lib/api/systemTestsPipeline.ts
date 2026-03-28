import { API_BASE_URL } from "@/lib/api";
import type {
  SystemTestsPipelineEnqueueResponse,
  SystemTestsPipelineJobsByRunResponse,
  SystemTestsPipelineJobsResponse,
} from "@/types/systemTestsPipeline";

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

export async function fetchSystemTestsPipelineJobs(
  accessToken: string,
  limit = 80,
): Promise<SystemTestsPipelineJobsResponse> {
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  return adminJson<SystemTestsPipelineJobsResponse>(
    accessToken,
    `/api/v1/admin/system-tests/pipeline/jobs?${qs.toString()}`,
  );
}

export async function fetchSystemTestsPipelineJobsForRun(
  accessToken: string,
  runId: string,
  limit = 50,
): Promise<SystemTestsPipelineJobsByRunResponse> {
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  return adminJson<SystemTestsPipelineJobsByRunResponse>(
    accessToken,
    `/api/v1/admin/system-tests/pipeline/jobs/run/${encodeURIComponent(runId)}?${qs.toString()}`,
  );
}

export async function postSystemTestsPipelineRetryJob(
  accessToken: string,
  pipelineJobId: string,
): Promise<SystemTestsPipelineEnqueueResponse> {
  return adminJson<SystemTestsPipelineEnqueueResponse>(
    accessToken,
    `/api/v1/admin/system-tests/pipeline/retry/${encodeURIComponent(pipelineJobId)}`,
    { method: "POST" },
  );
}

export async function postSystemTestsPipelineRequeueAnalysis(
  accessToken: string,
  runId: string,
  body?: { force?: boolean; skipChildAutomation?: boolean },
): Promise<SystemTestsPipelineEnqueueResponse> {
  return adminJson<SystemTestsPipelineEnqueueResponse>(
    accessToken,
    `/api/v1/admin/system-tests/pipeline/requeue-analysis/${encodeURIComponent(runId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    },
  );
}
