import { WEB_ENV } from "@/lib/env";

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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(json ? { "Content-Type": "application/json" } : null),
      ...(headers || {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: rest.cache ?? "no-store",
  });

  return response;
}
