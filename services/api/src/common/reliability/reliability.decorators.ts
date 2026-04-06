import { SetMetadata } from "@nestjs/common";

export const SKIP_RATE_LIMIT_KEY = "reliability:skip-rate-limit";
export const SKIP_TIMEOUT_KEY = "reliability:skip-timeout";
export const SKIP_RETRY_KEY = "reliability:skip-retry";
export const SKIP_IDEMPOTENCY_KEY = "reliability:skip-idempotency";
export const RATE_LIMIT_OVERRIDE_KEY = "reliability:rate-limit-override";

export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_KEY, true);
export const SkipTimeout = () => SetMetadata(SKIP_TIMEOUT_KEY, true);
export const SkipRetry = () => SetMetadata(SKIP_RETRY_KEY, true);
export const SkipIdempotency = () => SetMetadata(SKIP_IDEMPOTENCY_KEY, true);
export const RateLimitOverride = (limit: number) =>
  SetMetadata(RATE_LIMIT_OVERRIDE_KEY, limit);
