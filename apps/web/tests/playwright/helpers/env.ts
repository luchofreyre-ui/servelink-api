export const PLAYWRIGHT_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

/** Trailing slash so Playwright resolves relative paths like `auth/login` under `/api/v1/`. */
const rawPlaywrightApiBaseUrl =
  process.env.PLAYWRIGHT_API_BASE_URL || "http://localhost:3001/api/v1";
export const PLAYWRIGHT_API_BASE_URL = rawPlaywrightApiBaseUrl.endsWith("/")
  ? rawPlaywrightApiBaseUrl
  : `${rawPlaywrightApiBaseUrl}/`;

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

export const PLAYWRIGHT_SCENARIO_URL =
  `${PLAYWRIGHT_API_BASE_URL}dev/playwright/admin-scenario`;
