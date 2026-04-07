export const AUTH_TOKEN_STORAGE_KEY = "token";
export const AUTH_USER_STORAGE_KEY = "servelink_user";
export const SERVELINK_ACCESS_TOKEN_COOKIE = "servelink_access_token";

const SESSION_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function cookieSecureSuffix(): string {
  if (!isBrowser()) return "";
  return window.location.protocol === "https:" ? "; Secure" : "";
}

function writeSessionCookie(token: string) {
  if (!isBrowser()) return;
  const value = encodeURIComponent(token);
  document.cookie = `${SERVELINK_ACCESS_TOKEN_COOKIE}=${value}; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE_SEC}; SameSite=Lax${cookieSecureSuffix()}`;
}

function clearSessionCookie() {
  if (!isBrowser()) return;
  document.cookie = `${SERVELINK_ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${cookieSecureSuffix()}`;
}

export type StoredAuthUser = {
  id: string;
  email: string;
  role: string;
};

export function getStoredAccessToken(): string | null {
  if (!isBrowser()) return null;
  const value = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  return value?.trim() ? value.trim() : null;
}

export function setStoredAccessToken(token: string) {
  if (!isBrowser()) return;
  const trimmed = token.trim();
  if (!trimmed) return;
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, trimmed);
  writeSessionCookie(trimmed);
}

export function clearStoredAccessToken() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  clearSessionCookie();
}

export function getStoredAuthUser(): StoredAuthUser | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredAuthUser;
    if (!parsed?.id || !parsed?.email || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredAuthUser(user: StoredAuthUser) {
  if (!isBrowser()) return;
  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredAuthUser() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

export function clearStoredSession() {
  clearStoredAccessToken();
  clearStoredAuthUser();
}

export function clearSessionAccessToken() {
  clearStoredSession();
}
