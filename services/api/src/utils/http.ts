export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INVALID_REQUEST"
  | "NOT_FOUND"
  | "STRIPE_NOT_CONFIGURED"
  | "WEBHOOK_INVALID_SIGNATURE"
  | "INTERNAL_ERROR";

export function ok<T>(data: T) {
  return { ok: true as const, data };
}

export function fail(code: ApiErrorCode, message: string, details?: any) {
  return { ok: false as const, error: { code, message, details: details ?? null } };
}
