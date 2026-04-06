import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from "@/lib/auth";

export type UserRole = "admin" | "fo" | "customer";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

const TOKEN_KEY = "servelink_token";
const USER_KEY = "servelink_user";

export function setAuthSession(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setStoredAccessToken(token);
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearStoredAccessToken();
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!getAuthToken()?.trim() || !!getStoredAccessToken()?.trim();
}

export function hasRole(role: UserRole): boolean {
  const user = getAuthUser();
  if (user?.role === role) return true;
  if (role === "admin" && getStoredAccessToken()?.trim()) {
    return true;
  }
  return false;
}
