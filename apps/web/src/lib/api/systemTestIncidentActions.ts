import { API_BASE_URL } from "@/lib/api";
import type {
  ListSystemTestIncidentActionsResponse,
  SystemTestIncidentActionDetail,
  SystemTestIncidentActionPriority,
  SystemTestIncidentActionStatus,
  SystemTestIncidentStepExecutionStatus,
} from "@/types/systemTestIncidentActions";

const BASE = "/admin/system-tests/incident-actions";
const FETCH_TIMEOUT_MS = 25_000;

function parseJsonStrict(raw: string, status: number): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`Invalid JSON response (HTTP ${status})`);
  }
}

async function adminRequest<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
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

function buildListQuery(params?: {
  status?: string[];
  priority?: string[];
  ownerUserId?: string;
  search?: string;
  limit?: number;
  validationState?: ("pending" | "passed" | "failed")[];
  needsValidation?: boolean;
  slaStatus?: string[];
  escalationReady?: boolean;
  unassignedOnly?: boolean;
}): string {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.ownerUserId) q.set("ownerUserId", params.ownerUserId);
  if (params?.search) q.set("search", params.search);
  if (params?.needsValidation === true) q.set("needsValidation", "true");
  if (params?.escalationReady === true) q.set("escalationReady", "true");
  if (params?.unassignedOnly === true) q.set("unassignedOnly", "true");
  for (const s of params?.status ?? []) q.append("status", s);
  for (const p of params?.priority ?? []) q.append("priority", p);
  for (const v of params?.validationState ?? []) q.append("validationState", v);
  for (const s of params?.slaStatus ?? []) q.append("slaStatus", s);
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchSystemTestIncidentActions(
  accessToken: string,
  params?: {
    status?: string[];
    priority?: string[];
    ownerUserId?: string;
    search?: string;
    limit?: number;
    validationState?: ("pending" | "passed" | "failed")[];
    needsValidation?: boolean;
    slaStatus?: string[];
    escalationReady?: boolean;
    unassignedOnly?: boolean;
  },
): Promise<ListSystemTestIncidentActionsResponse> {
  return adminRequest<ListSystemTestIncidentActionsResponse>(
    accessToken,
    `${BASE}${buildListQuery(params)}`,
  );
}

export async function fetchSystemTestIncidentActionDetail(
  accessToken: string,
  incidentKey: string,
): Promise<SystemTestIncidentActionDetail> {
  return adminRequest<SystemTestIncidentActionDetail>(
    accessToken,
    `${BASE}/${encodeURIComponent(incidentKey)}`,
  );
}

export async function assignToMeSystemTestIncident(
  accessToken: string,
  incidentKey: string,
): Promise<SystemTestIncidentActionDetail> {
  return adminRequest<SystemTestIncidentActionDetail>(
    accessToken,
    `${BASE}/${encodeURIComponent(incidentKey)}/assign-to-me`,
    { method: "PATCH" },
  );
}

export async function updateSystemTestIncidentOwner(
  accessToken: string,
  params: { incidentKey: string; ownerUserId: string | null },
): Promise<SystemTestIncidentActionDetail> {
  return adminRequest<SystemTestIncidentActionDetail>(
    accessToken,
    `${BASE}/${encodeURIComponent(params.incidentKey)}/owner`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerUserId: params.ownerUserId }),
    },
  );
}

export async function updateSystemTestIncidentPriority(
  accessToken: string,
  params: { incidentKey: string; priority: SystemTestIncidentActionPriority },
): Promise<SystemTestIncidentActionDetail> {
  return adminRequest<SystemTestIncidentActionDetail>(
    accessToken,
    `${BASE}/${encodeURIComponent(params.incidentKey)}/priority`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: params.priority }),
    },
  );
}

export async function updateSystemTestIncidentStatus(
  accessToken: string,
  params: { incidentKey: string; status: SystemTestIncidentActionStatus },
): Promise<SystemTestIncidentActionDetail> {
  return adminRequest<SystemTestIncidentActionDetail>(
    accessToken,
    `${BASE}/${encodeURIComponent(params.incidentKey)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: params.status }),
    },
  );
}

export async function addSystemTestIncidentNote(
  accessToken: string,
  params: { incidentKey: string; text: string },
): Promise<SystemTestIncidentActionDetail> {
  return adminRequest<SystemTestIncidentActionDetail>(
    accessToken,
    `${BASE}/${encodeURIComponent(params.incidentKey)}/notes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: params.text }),
    },
  );
}

export async function updateSystemTestIncidentStep(
  accessToken: string,
  params: {
    incidentKey: string;
    stepIndex: number;
    status: SystemTestIncidentStepExecutionStatus;
    notes?: string;
  },
): Promise<SystemTestIncidentActionDetail> {
  const body: Record<string, unknown> = {
    stepIndex: params.stepIndex,
    status: params.status,
  };
  if (params.notes !== undefined) body.notes = params.notes;
  return adminRequest<SystemTestIncidentActionDetail>(
    accessToken,
    `${BASE}/${encodeURIComponent(params.incidentKey)}/steps`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}
