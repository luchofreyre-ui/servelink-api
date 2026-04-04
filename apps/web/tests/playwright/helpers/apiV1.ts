import { PLAYWRIGHT_API_BASE_URL } from "./env";

/** Resolves a path under `/api/v1/` using the same base as auth + encyclopedia APIs. */
export function apiV1Url(path: string): string {
  const base = PLAYWRIGHT_API_BASE_URL.endsWith("/")
    ? PLAYWRIGHT_API_BASE_URL
    : `${PLAYWRIGHT_API_BASE_URL}/`;
  const p = path.replace(/^\//, "");
  return new URL(p, base).toString();
}
