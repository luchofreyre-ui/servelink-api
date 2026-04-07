import type { UserRole } from "@/lib/auth/authClient";
import {
  clearAuthSession,
  getAuthToken,
  getAuthUser,
  setAuthSession,
} from "@/lib/auth/authClient";
import { WEB_ENV } from "@/lib/env";

export type LoginResponse = {
  id: string;
  email: string;
  role: string;
  accessToken: string;
};

export interface LoginInput {
  email: string;
  password: string;
  expectedRole: UserRole;
}

export interface LoginResult {
  token: string;
  user: NonNullable<ReturnType<typeof getAuthUser>>;
}

export async function loginWithRole(
  email: string,
  password: string,
  expectedRole: string,
) {
  const response = await fetch(`${WEB_ENV.apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const payload = (await response.json().catch(() => null)) as LoginResponse | null;

  if (!response.ok || !payload) {
    throw new Error(
      payload && typeof payload === "object" ? JSON.stringify(payload) : "Login failed.",
    );
  }

  if (!payload.accessToken?.trim()) {
    throw new Error("Login succeeded but no access token was returned.");
  }

  if (!payload.role?.trim()) {
    throw new Error("Login succeeded but no user role was returned.");
  }

  if (payload.role !== expectedRole) {
    throw new Error(`This account is not allowed for ${expectedRole} access.`);
  }

  setAuthSession(payload.accessToken, {
    id: payload.id,
    email: payload.email,
    role: payload.role,
  });

  return payload;
}

/** Same contract as `loginWithRole`, shaped for `AuthLoginForm`. */
export async function loginWithApi(input: LoginInput): Promise<LoginResult> {
  const payload = await loginWithRole(
    input.email,
    input.password,
    input.expectedRole,
  );
  const user = getAuthUser();
  if (!user) {
    throw new Error("Login succeeded but session user was not stored.");
  }
  return { token: payload.accessToken, user };
}

export async function logoutWithApi() {
  const token = typeof window !== "undefined" ? getAuthToken() : null;

  try {
    await fetch(`${WEB_ENV.apiBaseUrl}/auth/logout`, {
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
