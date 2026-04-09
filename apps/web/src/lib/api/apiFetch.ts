import { WEB_ENV, normalizeApiOrigin } from "@/lib/env";
import {
  getStoredAccessToken,
  SERVELINK_ACCESS_TOKEN_COOKIE,
} from "@/lib/auth";

export const API_BASE_URL = WEB_ENV.apiBaseUrl;

/**
 * `NEXT_PUBLIC_*` is inlined at build time; Playwright (and other runtimes) need a
 * server-only override so RSC `fetch` hits the live API without rebuilding the web app.
 */
function serverApiBaseUrl(): string {
  const s = process.env.SERVELINK_INTERNAL_API_BASE_URL?.trim();
  if (s) {
    return `${normalizeApiOrigin(s)}/api/v1`;
  }
  return API_BASE_URL;
}

type RequestInitWithJson = RequestInit & {
  json?: unknown;
  next?: { revalidate?: number };
};

/** Same shape as browser `document.cookie` parsing for `servelink_access_token`. */
function tokenFromRawCookieHeader(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const prefix = `${SERVELINK_ACCESS_TOKEN_COOKIE}=`;
  for (const part of cookieHeader.split("; ")) {
    if (part.startsWith(prefix)) {
      const raw = part.slice(prefix.length);
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return null;
}

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

  if (typeof window === "undefined") {
    try {
      const { cookies, headers: nextHeaders } = await import("next/headers");
      const headerList = await nextHeaders();
      const jar = await cookies();

      let cookieHeader = headerList.get("cookie");
      if (!cookieHeader) {
        const pairs = jar.getAll();
        if (pairs.length) {
          cookieHeader = pairs.map(({ name, value }) => `${name}=${value}`).join("; ");
        }
      }
      if (cookieHeader) {
        mergedHeaders["Cookie"] = cookieHeader;
      }

      const incomingAuth = headerList.get("authorization");
      if (incomingAuth) {
        mergedHeaders["Authorization"] = incomingAuth;
      }

      let token = jar.get(SERVELINK_ACCESS_TOKEN_COOKIE)?.value?.trim();
      if (!token) {
        token = tokenFromRawCookieHeader(cookieHeader)?.trim() ?? "";
      }
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

  const base =
    typeof window === "undefined" ? serverApiBaseUrl() : API_BASE_URL;

  const response = await fetch(`${base}${path}`, {
    ...rest,
    headers: mergedHeaders,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: rest.cache ?? "no-store",
  });

  return response;
}
