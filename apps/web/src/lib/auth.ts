export const AUTH_TOKEN_STORAGE_KEY = "token";

/** Must match `apiFetch` server-side cookie read in `lib/api.ts`. */
export const SERVELINK_ACCESS_TOKEN_COOKIE = "servelink_access_token";

const SESSION_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function cookieSecureSuffix(): string {
  if (!isBrowser()) return "";
  return window.location.protocol === "https:" ? "; Secure" : "";
}

/**
 * Mirrors the access token into a non-httpOnly cookie so Next.js RSC `apiFetch`
 * can attach `Authorization` on the server. XSS can read this token — prefer
 * httpOnly cookies + server session when you harden auth.
 */
function writeSessionCookie(token: string) {
  if (!isBrowser()) return;
  const value = encodeURIComponent(token);
  document.cookie = `${SERVELINK_ACCESS_TOKEN_COOKIE}=${value}; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE_SEC}; SameSite=Lax${cookieSecureSuffix()}`;
}

function eraseSessionCookie() {
  if (!isBrowser()) return;
  document.cookie = `${SERVELINK_ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${cookieSecureSuffix()}`;
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  return value && value.trim().length > 0 ? value : null;
}

/** Persists token for client API calls (localStorage) and RSC (cookie). */
export function setStoredAccessToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = token.trim();
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, trimmed);
  writeSessionCookie(trimmed);
}

/** Clears localStorage session mirror and `servelink_access_token` cookie. */
export function clearStoredAccessToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  eraseSessionCookie();
}

/** Alias for logout flows — same as `clearStoredAccessToken`. */
export function clearSessionAccessToken() {
  clearStoredAccessToken();
}
