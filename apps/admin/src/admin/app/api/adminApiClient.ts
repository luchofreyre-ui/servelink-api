/**
 * Admin API client. Base URL is the backend admin prefix.
 * All feature modules use paths relative to this base (e.g. /dispatch-config/active, /activity).
 */
const LOGIN_URL = "https://nustandardcleaning.com/login";
const ADMIN_NEXT = "/admin";

export type ApiError = {
  status: number;
  message: string;
  /** Nest `BadRequestException` object payload (e.g. FO_ACTIVATION_BLOCKED). */
  code?: string;
  reasons?: string[];
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** When true, 401 will not trigger redirect (e.g. session check). */
  skip401Redirect?: boolean;
};

const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
};

export class AdminApiClient {
  constructor(private readonly baseUrl: string) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = path.startsWith("/") ? `${this.baseUrl}${path}` : `${this.baseUrl}/${path}`;
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        ...DEFAULT_HEADERS,
        ...(options.headers ?? {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "include",
    });

    if (response.status === 401 && typeof window !== "undefined" && !options.skip401Redirect) {
      const redirectUrl = `${LOGIN_URL}?next=${encodeURIComponent(ADMIN_NEXT)}`;
      window.location.href = redirectUrl;
      const error: ApiError = { status: 401, message: "Unauthorized" };
      throw error;
    }

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      let code: string | undefined;
      let reasons: string[] | undefined;
      try {
        const payload = (await response.json()) as Record<string, unknown>;
        const inner = payload?.message;
        if (typeof inner === "string") {
          message = inner;
        } else if (inner && typeof inner === "object") {
          const o = inner as Record<string, unknown>;
          if (typeof o.message === "string") {
            message = o.message;
          } else {
            message = JSON.stringify(inner);
          }
          if (typeof o.code === "string") code = o.code;
          if (Array.isArray(o.reasons)) {
            reasons = o.reasons.map((r) => String(r));
          }
        } else if (typeof payload?.error === "object" && payload.error) {
          const e = payload.error as Record<string, unknown>;
          if (typeof e.message === "string") message = e.message;
        }
        if (!code && typeof payload?.code === "string") code = payload.code;
        if (!reasons && Array.isArray(payload?.reasons)) {
          reasons = (payload.reasons as unknown[]).map((r) => String(r));
        }
      } catch {
        // ignore parse failure
      }
      const error: ApiError = { status: response.status, message, code, reasons };
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  get<T>(path: string, opts?: Pick<RequestOptions, "skip401Redirect">): Promise<T> {
    return this.request<T>(path, { method: "GET", ...opts });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body });
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "PATCH", body });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "PUT", body });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}

/** Base: /api/v1/admin. All admin feature paths are relative to this. */
export const adminApiClient = new AdminApiClient("/api/v1/admin");
