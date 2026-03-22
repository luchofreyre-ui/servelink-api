/**
 * Read-only booking endpoints that currently live outside admin scope (/api/v1/bookings).
 * Use for: getBooking, dispatch-timeline, dispatch-explainer, dispatch-operator-notes.
 * Admin mutations use adminApiClient with path bookings/:id/dispatch/...
 */
import type { ApiError } from "./adminApiClient";

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  headers?: Record<string, string>;
  skip401Redirect?: boolean;
};

const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
};

export class AdminBookingReadClient {
  constructor(private readonly baseUrl: string) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = path.startsWith("/") ? `${this.baseUrl}${path}` : `${this.baseUrl}/${path}`;
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: { ...DEFAULT_HEADERS, ...(options.headers ?? {}) },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "include",
    });

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      try {
        const payload = await response.json();
        message = payload?.message ?? payload?.error?.message ?? message;
      } catch {
        // ignore
      }
      throw { status: response.status, message } as ApiError;
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body });
  }
}

export const adminBookingReadClient = new AdminBookingReadClient("/api/v1");
