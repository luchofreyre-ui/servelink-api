import { normalizeApiOrigin } from "@/lib/env";

export const PLAYWRIGHT_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:3000";

const DEFAULT_NEST_ORIGIN = "http://127.0.0.1:3001";

function toApiV1Base(url: string): string {
  return `${normalizeApiOrigin(url)}/api/v1`;
}

/**
 * Canonical Nest HTTP origin (no `/api/v1`). Use for `NEXT_PUBLIC_API_BASE_URL` when
 * building the web app for Playwright so browser `apiFetch` hits the same API as Node
 * scenario fetch (`PLAYWRIGHT_API_BASE_URL`).
 */
export const PLAYWRIGHT_NEST_API_ORIGIN =
  process.env.PLAYWRIGHT_NEST_API_ORIGIN?.replace(/\/$/, "") || DEFAULT_NEST_ORIGIN;

/**
 * NEXT_PUBLIC_API_BASE_URL is often the **browser** origin (Next dev / Playwright web
 * on :3000 or :3002). Node-side scenario fetch must hit the Nest API (:3001), not the
 * web server — otherwise `/dev/playwright/admin-scenario` 404/500s.
 */
function nextPublicLooksLikeWebOriginOnly(url: string): boolean {
  try {
    const u = new URL(url);
    const port =
      u.port ||
      (u.protocol === "https:" ? "443" : u.protocol === "http:" ? "80" : "");
    const n = port ? parseInt(String(port), 10) : 80;
    const webPortEnv = process.env.PLAYWRIGHT_WEB_PORT;
    if (webPortEnv && n === parseInt(webPortEnv, 10)) {
      return true;
    }
    // Common Next dev / Playwright `next start` ports (Nest API is typically 3001).
    return n === 3000 || n === 3002;
  } catch {
    return false;
  }
}

/**
 * Base URL for **Nest API** (`/api/v1`), used by Playwright fixtures (Node fetch).
 * Prefer `PLAYWRIGHT_API_BASE_URL`; do not follow `NEXT_PUBLIC_*` when it points at the web app.
 */
export const PLAYWRIGHT_API_BASE_URL = (() => {
  const explicit = process.env.PLAYWRIGHT_API_BASE_URL?.trim();
  if (explicit) {
    return toApiV1Base(explicit);
  }

  const fromNextPublic = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (fromNextPublic && !nextPublicLooksLikeWebOriginOnly(fromNextPublic)) {
    return toApiV1Base(fromNextPublic);
  }

  return toApiV1Base(PLAYWRIGHT_NEST_API_ORIGIN);
})();

export const PLAYWRIGHT_SCENARIO_URL = `${PLAYWRIGHT_API_BASE_URL}/dev/playwright/admin-scenario`;

export const PLAYWRIGHT_ADMIN_EMAIL =
  process.env.PLAYWRIGHT_ADMIN_EMAIL || "";

export const PLAYWRIGHT_ADMIN_PASSWORD =
  process.env.PLAYWRIGHT_ADMIN_PASSWORD || "";

export const PLAYWRIGHT_CUSTOMER_EMAIL =
  process.env.PLAYWRIGHT_CUSTOMER_EMAIL || "";

export const PLAYWRIGHT_CUSTOMER_PASSWORD =
  process.env.PLAYWRIGHT_CUSTOMER_PASSWORD || "";

export const PLAYWRIGHT_FO_EMAIL =
  process.env.PLAYWRIGHT_FO_EMAIL || "";

export const PLAYWRIGHT_FO_PASSWORD =
  process.env.PLAYWRIGHT_FO_PASSWORD || "";

export const PLAYWRIGHT_TARGET_FO_ID =
  process.env.TARGET_FO_ID || "";
