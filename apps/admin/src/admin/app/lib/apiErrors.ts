import type { ApiError } from "../api/adminApiClient";

/**
 * Error object may be ApiError (status, message) or Error.
 */
function getStatus(err: unknown): number | undefined {
  if (err && typeof err === "object" && "status" in err && typeof (err as ApiError).status === "number") {
    return (err as ApiError).status;
  }
  return undefined;
}

export function isNotFoundError(error: unknown): boolean {
  return getStatus(error) === 404;
}

export function isUnauthorizedError(error: unknown): boolean {
  return getStatus(error) === 401;
}

export function isServerError(error: unknown): boolean {
  const status = getStatus(error);
  return status != null && status >= 500;
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message?.toLowerCase().includes("fetch")) return true;
  if (error && typeof error === "object" && "message" in error) {
    const msg = String((error as { message: string }).message).toLowerCase();
    return msg.includes("network") || msg.includes("failed to fetch");
  }
  return false;
}

/**
 * 404 on a stubbed or not-yet-implemented route (e.g. supply).
 */
export function isRouteUnavailableError(error: unknown): boolean {
  return isNotFoundError(error);
}
