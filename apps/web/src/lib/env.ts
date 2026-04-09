/**
 * `NEXT_PUBLIC_API_BASE_URL` is the API **origin** only (scheme + host + optional port),
 * e.g. `http://localhost:3001` or `https://servelink-api-production.up.railway.app`.
 * Versioned routes live under `/api/v1`; callers use `WEB_ENV.apiBaseUrl` or `API_BASE_URL` from `@/lib/api`.
 */
export function normalizeApiOrigin(input: string): string {
  let s = input.trim();
  if (!s) {
    return "http://localhost:3001";
  }
  s = s.replace(/\/+$/, "");
  while (s.endsWith("/api/v1")) {
    s = s.slice(0, -"/api/v1".length).replace(/\/+$/, "");
  }
  return s || "http://localhost:3001";
}

const apiOrigin = normalizeApiOrigin(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001",
);

export const WEB_ENV = {
  /** HTTP origin only (no `/api/v1`). */
  apiOrigin,
  /** `${apiOrigin}/api/v1` — use for all versioned API paths (`/auth/login`, `/admin/...`, …). */
  apiBaseUrl: `${apiOrigin}/api/v1`,
  appEnv: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
  enableManualPaymentControls:
    process.env.NEXT_PUBLIC_ENABLE_MANUAL_PAYMENT_CONTROLS === "true",
  /** Opt-in only — default off for launch safety when env is unset. */
  enableBookingUiTelemetry:
    process.env.NEXT_PUBLIC_ENABLE_BOOKING_UI_TELEMETRY === "true",
} as const;
