import type { AuthUser, UserRole } from "./authClient";
import { clearAuthSession, setAuthSession } from "./authClient";

export interface LoginInput {
  email: string;
  password: string;
  expectedRole: UserRole;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:3001/api/v1"
  );
}

function normalizeRole(value: unknown): UserRole | null {
  if (value === "admin" || value === "fo" || value === "customer") {
    return value;
  }
  return null;
}

function coerceUser(payload: any, expectedRole: UserRole): AuthUser {
  const id =
    String(
      payload?.id ??
        payload?.userId ??
        payload?.sub ??
        payload?.uuid ??
        payload?.profile?.id ??
        "",
    ) || crypto.randomUUID();

  const email = String(
    payload?.email ??
      payload?.username ??
      payload?.user?.email ??
      payload?.profile?.email ??
      "",
  ).trim();

  const role =
    normalizeRole(payload?.role) ??
    normalizeRole(payload?.user?.role) ??
    normalizeRole(payload?.profile?.role) ??
    expectedRole;

  if (!email) {
    throw new Error("Login response did not include a usable email.");
  }

  return {
    id,
    email,
    role,
  };
}

function coerceToken(payload: any): string {
  const token = String(
    payload?.token ??
      payload?.accessToken ??
      payload?.access_token ??
      payload?.jwt ??
      payload?.data?.token ??
      "",
  ).trim();

  if (!token) {
    throw new Error("Login response did not include an auth token.");
  }

  return token;
}

function extractPayload(raw: any) {
  if (raw?.data && typeof raw.data === "object") return raw.data;
  return raw;
}

export async function loginWithApi(input: LoginInput): Promise<LoginResult> {
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      role: input.expectedRole,
    }),
  });

  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      raw?.error?.message ||
      raw?.message ||
      `Login failed with status ${response.status}.`;
    throw new Error(String(message));
  }

  const payload = extractPayload(raw);
  const token = coerceToken(payload);
  const user = coerceUser(payload?.user ?? payload, input.expectedRole);

  if (user.role !== input.expectedRole) {
    throw new Error(
      `Authenticated as role "${user.role}" but expected "${input.expectedRole}".`,
    );
  }

  setAuthSession(token, user);
  return { token, user };
}

export async function logoutWithApi() {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("servelink_token")
      : null;

  try {
    await fetch(`${getApiBaseUrl()}/auth/logout`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    // Intentionally swallow logout network failures. Local session is still cleared.
  } finally {
    clearAuthSession();
  }
}
