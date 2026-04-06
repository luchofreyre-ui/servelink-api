export const RELIABILITY_TIMEOUT_MS = 8000;
export const RELIABILITY_GET_RETRY_COUNT = 2;
export const RELIABILITY_GET_RETRY_DELAY_MS = 150;

export const IDEMPOTENCY_TTL_MS = 1000 * 60 * 30; // 30 min
export const IDEMPOTENCY_HEADER = "idempotency-key";

export const RATE_LIMIT_WINDOW_MS = 1000 * 60; // 1 min
export const RATE_LIMIT_MAX_DEFAULT = 300;
export const RATE_LIMIT_MAX_MUTATION = 80;
export const RATE_LIMIT_MAX_PUBLIC = 40;

export const PUBLIC_PATH_PREFIXES = [
  "/api/v1/bookings",
  "/api/v1/booking-direction-intake",
  "/api/v1/payments",
  "/api/v1/stripe",
  "/health",
];
