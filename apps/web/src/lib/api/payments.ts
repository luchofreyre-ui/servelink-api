import { API_BASE_URL, apiFetch } from "@/lib/api";
import { getStoredAccessToken } from "@/lib/auth";
import type {
  AdminBookingOperationalDetail,
  AdminPrismaOpsAnomalyItem,
  BookingStatusResponse,
  ConfirmPaymentResponse,
  CreatePaymentIntentResponse,
} from "@/types/payments";
import type { StripePublicConfigResponse } from "@/types/stripe";

function readApiErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const err = (payload as { error?: { message?: string; code?: string } }).error;
    if (err && typeof err.message === "string" && err.message.trim()) {
      return err.message;
    }
    const msg = (payload as { message?: string }).message;
    if (typeof msg === "string" && msg.trim()) {
      return msg;
    }
  }
  return fallback;
}

/** Optional Bearer for client-only calls (e.g. Stripe public config). */
export function buildAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return {};
  }
  const token = getStoredAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getStripePublicConfig(): Promise<StripePublicConfigResponse> {
  const response = await fetch(`${API_BASE_URL}/payments/config`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });
  return parseJson<StripePublicConfigResponse>(response);
}

async function authFetch(
  token: string,
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<Response> {
  const { json, headers, ...rest } = init;
  return fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: rest.cache ?? "no-store",
  });
}

async function parseJson<T>(response: Response): Promise<T> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const text =
      typeof payload === "string"
        ? payload
        : readApiErrorMessage(payload, `Request failed with status ${response.status}`);
    throw new Error(text);
  }

  return payload as T;
}

export function toNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function normalizeBookingStatusPayload(raw: Record<string, unknown>): BookingStatusResponse {
  return {
    id: String(raw.id ?? ""),
    status: String(raw.status ?? ""),
    scheduledStart:
      raw.scheduledStart != null ? String(raw.scheduledStart) : null,
    startedAt: raw.startedAt != null ? String(raw.startedAt) : null,
    completedAt: raw.completedAt != null ? String(raw.completedAt) : null,
    quotedSubtotal: toNumberOrNull(raw.quotedSubtotal),
    quotedMargin: toNumberOrNull(raw.quotedMargin),
    quotedTotal: toNumberOrNull(raw.quotedTotal),
    paymentStatus: (raw.paymentStatus != null ? String(raw.paymentStatus) : null) as
      | BookingStatusResponse["paymentStatus"]
      | null,
    paymentIntentId: raw.paymentIntentId != null ? String(raw.paymentIntentId) : null,
  };
}

export function normalizeOperationalDetailPayload(
  raw: Record<string, unknown>,
): AdminBookingOperationalDetail {
  const payments = Array.isArray(raw.payments) ? raw.payments : [];
  const trustEvents = Array.isArray(raw.trustEvents) ? raw.trustEvents : [];
  const opsAnomalies = Array.isArray(raw.opsAnomalies) ? raw.opsAnomalies : [];

  return {
    ...normalizeBookingStatusPayload(raw),
    payments: payments.map((p) => {
      const row = p as Record<string, unknown>;
      return {
        id: String(row.id ?? ""),
        amount: toNumberOrNull(row.amount) ?? 0,
        status: String(row.status ?? ""),
        createdAt: String(row.createdAt ?? ""),
        externalRef:
          row.externalRef != null ? String(row.externalRef) : null,
      };
    }),
    trustEvents: trustEvents.map((t) => {
      const row = t as Record<string, unknown>;
      return {
        id: String(row.id ?? ""),
        type: String(row.type ?? ""),
        createdAt: String(row.createdAt ?? ""),
        payload:
          row.payload && typeof row.payload === "object"
            ? (row.payload as Record<string, unknown>)
            : null,
      };
    }),
    opsAnomalies: opsAnomalies.map((a) => {
      const row = a as Record<string, unknown>;
      return {
        id: String(row.id ?? ""),
        type: String(row.type ?? ""),
        status: String(row.status ?? ""),
        title: String(row.title ?? ""),
        detail: row.detail != null ? String(row.detail) : null,
        createdAt: String(row.createdAt ?? ""),
        resolvedAt: row.resolvedAt != null ? String(row.resolvedAt) : null,
      };
    }),
  };
}

export async function getBookingStatus(
  bookingId: string,
  token: string,
): Promise<BookingStatusResponse> {
  const response = await authFetch(token, `/bookings/${bookingId}/status`, {
    method: "GET",
  });
  const payload = await parseJson<Record<string, unknown>>(response);
  return normalizeBookingStatusPayload(payload);
}

export async function createBookingPaymentIntent(
  bookingId: string,
  token: string,
): Promise<CreatePaymentIntentResponse> {
  const response = await authFetch(
    token,
    `/payments/bookings/${bookingId}/intent`,
    { method: "POST", json: {} },
  );
  return parseJson<CreatePaymentIntentResponse>(response);
}

export async function confirmBookingPayment(
  token: string,
  input: { bookingId: string; paymentIntentId: string },
): Promise<ConfirmPaymentResponse> {
  const response = await authFetch(
    token,
    `/payments/bookings/${input.bookingId}/confirm`,
    {
      method: "POST",
      json: { paymentIntentId: input.paymentIntentId },
    },
  );
  return parseJson<ConfirmPaymentResponse>(response);
}

export async function failBookingPayment(
  token: string,
  input: { bookingId: string; detail: string },
) {
  const response = await authFetch(
    token,
    `/payments/bookings/${input.bookingId}/fail`,
    {
      method: "POST",
      json: { detail: input.detail },
    },
  );
  return parseJson<{ id: string; status: string }>(response);
}

export async function getAdminBookingOperationalDetail(
  bookingId: string,
  token: string,
): Promise<AdminBookingOperationalDetail> {
  const response = await authFetch(
    token,
    `/admin/bookings/${bookingId}/operational-detail`,
    { method: "GET" },
  );
  const payload = await parseJson<Record<string, unknown>>(response);
  return normalizeOperationalDetailPayload(payload);
}

/**
 * Open Prisma `OpsAnomaly` rows (payment failures, mismatches, etc.).
 * API route: GET /admin/anomalies
 * (Distinct from fingerprinted queue at /admin/ops/anomalies.)
 */
export async function getAdminOpenPrismaOpsAnomalies(): Promise<
  AdminPrismaOpsAnomalyItem[]
> {
  const response = await apiFetch(`/admin/anomalies`, {
    method: "GET",
  });
  const payload = await parseJson<unknown>(response);
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload as AdminPrismaOpsAnomalyItem[];
}

/** Alias for admin dashboards / MEGA DROP naming. */
export const getAdminOpenOpsAnomalies = getAdminOpenPrismaOpsAnomalies;

export async function acknowledgeAdminPrismaOpsAnomaly(id: string, token: string) {
  const response = await authFetch(token, `/admin/anomalies/${id}/ack`, {
    method: "PATCH",
  });
  return parseJson<{ id: string; status: string }>(response);
}

export async function resolveAdminPrismaOpsAnomaly(id: string, token: string) {
  const response = await authFetch(token, `/admin/anomalies/${id}/resolve`, {
    method: "PATCH",
  });
  return parseJson<{ id: string; status: string }>(response);
}
