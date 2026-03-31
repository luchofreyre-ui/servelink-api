import { API_BASE_URL } from "@/lib/api";
import { getStoredAccessToken } from "@/lib/auth";

const FETCH_TIMEOUT_MS = 25_000;

/**
 * Authenticated admin GET using the browser-stored access token.
 * Intended for client-side callers (e.g. admin pages using useEffect).
 */
export async function apiGet<T>(path: string): Promise<T> {
  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    throw new Error("Not authenticated");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await response.text();
    const payload = JSON.parse(text) as T & { message?: string };
    if (!response.ok) {
      const msg =
        typeof (payload as { message?: unknown }).message === "string"
          ? String((payload as { message: string }).message)
          : `Request failed: ${response.status}`;
      throw new Error(msg);
    }
    return payload as T;
  } finally {
    clearTimeout(timeout);
  }
}
