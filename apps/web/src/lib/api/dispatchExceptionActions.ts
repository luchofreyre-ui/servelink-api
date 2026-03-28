import { API_BASE_URL } from "@/lib/api";
import type {
  DispatchExceptionActionDetail,
  ListDispatchExceptionActionsResponse,
} from "@/types/dispatchExceptionActions";

const BASE = "/api/v1/admin/dispatch/exception-actions";
const FETCH_TIMEOUT_MS = 25_000;

function buildListQuery(params?: {
  status?: string[];
  priority?: string[];
  ownerUserId?: string;
  search?: string;
  limit?: number;
  validationState?: string[];
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

async function adminRequest<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const initHeaders = init?.headers;
    const extra =
      initHeaders && typeof initHeaders === "object" && !Array.isArray(initHeaders)
        ? Object.fromEntries(new Headers(initHeaders as HeadersInit).entries())
        : {};

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...extra,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await response.text();
    let payload: T & { message?: string };
    try {
      payload = JSON.parse(text) as T & { message?: string };
    } catch {
      throw new Error(`Invalid JSON response (HTTP ${response.status})`);
    }

    if (!response.ok) {
      const msg =
        typeof payload.message === "string"
          ? payload.message
          : `Request failed: ${response.status}`;
      throw new Error(msg);
    }

    return payload as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchDispatchExceptionActions(
  accessToken: string,
  params?: Parameters<typeof buildListQuery>[0],
): Promise<ListDispatchExceptionActionsResponse> {
  return adminRequest<ListDispatchExceptionActionsResponse>(
    accessToken,
    `${BASE}${buildListQuery(params)}`,
  );
}

export async function fetchDispatchExceptionActionDetail(
  accessToken: string,
  dispatchExceptionKey: string,
): Promise<DispatchExceptionActionDetail> {
  return adminRequest<DispatchExceptionActionDetail>(
    accessToken,
    `${BASE}/${encodeURIComponent(dispatchExceptionKey)}`,
  );
}

export async function assignToMeDispatchExceptionAction(
  accessToken: string,
  dispatchExceptionKey: string,
): Promise<DispatchExceptionActionDetail> {
  return adminRequest<DispatchExceptionActionDetail>(
    accessToken,
    `${BASE}/${encodeURIComponent(dispatchExceptionKey)}/assign-to-me`,
    { method: "PATCH" },
  );
}

export async function updateDispatchExceptionOwner(
  accessToken: string,
  params: { dispatchExceptionKey: string; ownerUserId: string | null },
): Promise<DispatchExceptionActionDetail> {
  return adminRequest<DispatchExceptionActionDetail>(
    accessToken,
    `${BASE}/${encodeURIComponent(params.dispatchExceptionKey)}/owner`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerUserId: params.ownerUserId }),
    },
  );
}

export async function updateDispatchExceptionPriority(
  accessToken: string,
  params: {
    dispatchExceptionKey: string;
    priority: DispatchExceptionActionDetail["priority"];
  },
): Promise<DispatchExceptionActionDetail> {
  return adminRequest<DispatchExceptionActionDetail>(
    accessToken,
    `${BASE}/${encodeURIComponent(params.dispatchExceptionKey)}/priority`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: params.priority }),
    },
  );
}

export async function updateDispatchExceptionStatus(
  accessToken: string,
  params: {
    dispatchExceptionKey: string;
    status: DispatchExceptionActionDetail["status"];
  },
): Promise<DispatchExceptionActionDetail> {
  return adminRequest<DispatchExceptionActionDetail>(
    accessToken,
    `${BASE}/${encodeURIComponent(params.dispatchExceptionKey)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: params.status }),
    },
  );
}

export async function addDispatchExceptionNote(
  accessToken: string,
  params: { dispatchExceptionKey: string; text: string },
): Promise<DispatchExceptionActionDetail> {
  return adminRequest<DispatchExceptionActionDetail>(
    accessToken,
    `${BASE}/${encodeURIComponent(params.dispatchExceptionKey)}/notes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: params.text }),
    },
  );
}
