import { WEB_ENV } from "@/lib/env";
import {
  getStoredAccessToken,
  SERVELINK_ACCESS_TOKEN_COOKIE,
} from "@/lib/auth";

function normalizeBaseUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return WEB_ENV.apiBaseUrl;
  }

  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export const API_BASE_URL = normalizeBaseUrl(WEB_ENV.apiBaseUrl);

type RequestInitWithJson = RequestInit & {
  json?: unknown;
};

export async function apiFetch(path: string, init: RequestInitWithJson = {}) {
  const { json, headers, ...rest } = init;

  const mergedHeaders: Record<string, string> = {};
  if (json) mergedHeaders["Content-Type"] = "application/json";
  if (headers && typeof headers === "object") {
    const h = headers as Record<string, string | string[] | undefined>;
    for (const [key, value] of Object.entries(h)) {
      if (typeof value === "string" && value) mergedHeaders[key] = value;
    }
  }

  // Server Components: attach Bearer when an httpOnly/session cookie is present.
  // Login flows can set `servelink_access_token` to enable authenticated RSC fetches.
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const jar = await cookies();
      const token = jar.get(SERVELINK_ACCESS_TOKEN_COOKIE)?.value?.trim();
      if (
        token &&
        !mergedHeaders["Authorization"] &&
        !mergedHeaders["authorization"]
      ) {
        mergedHeaders["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      /* outside Next request context */
    }
  } else {
    const token = getStoredAccessToken();
    if (
      token &&
      !mergedHeaders["Authorization"] &&
      !mergedHeaders["authorization"]
    ) {
      mergedHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: mergedHeaders,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: rest.cache ?? "no-store",
  });

  return response;
}
