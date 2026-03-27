import { Request, Response, NextFunction } from "express";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 300);
const NODE_ENV = process.env.NODE_ENV ?? "development";
const RATE_LIMIT_BYPASS_LOCAL_PLAYWRIGHT =
  process.env.RATE_LIMIT_BYPASS_LOCAL_PLAYWRIGHT ?? "true";

function getClientKey(req: Request) {
  const forwardedFor = req.header("x-forwarded-for");
  if (forwardedFor && String(forwardedFor).trim()) {
    return String(forwardedFor).split(",")[0].trim();
  }
  return req.ip || "unknown";
}

const PLAYWRIGHT_ADMIN_SCENARIO_PATH = "/api/v1/dev/playwright/admin-scenario";

function isPlaywrightAdminScenarioGet(req: Request): boolean {
  if (req.method !== "GET") {
    return false;
  }
  const path = (req.originalUrl ?? req.url ?? "").split("?")[0] ?? "";
  const normalized = path.endsWith("/") ? path.slice(0, -1) : path;
  return (
    normalized === PLAYWRIGHT_ADMIN_SCENARIO_PATH ||
    normalized.endsWith("/dev/playwright/admin-scenario")
  );
}

function isLocalHostLike(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return (
    value.includes("localhost") ||
    value.includes("127.0.0.1") ||
    value.includes("::1")
  );
}

function looksLikeLocalPlaywrightTraffic(req: Request): boolean {
  if (NODE_ENV === "production") {
    return false;
  }

  if (RATE_LIMIT_BYPASS_LOCAL_PLAYWRIGHT.toLowerCase() === "false") {
    return false;
  }

  const host = String(req.header("host") ?? "");
  const origin = String(req.header("origin") ?? "");
  const referer = String(req.header("referer") ?? "");
  const isLocalRequest =
    isLocalHostLike(host) || isLocalHostLike(origin) || isLocalHostLike(referer);

  if (!isLocalRequest) {
    return false;
  }

  // In non-production, local app/server traffic is expected in dev + e2e loops.
  // Keep this bypass local-only and env-gated to avoid weakening deployed behavior.
  return true;
}

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (isPlaywrightAdminScenarioGet(req) || looksLikeLocalPlaywrightTraffic(req)) {
    return next();
  }

  const now = Date.now();
  const key = getClientKey(req);
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = {
      count: 0,
      resetAt: now + WINDOW_MS,
    };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  const remaining = Math.max(0, MAX_REQUESTS - bucket.count);
  res.setHeader("x-ratelimit-limit", String(MAX_REQUESTS));
  res.setHeader("x-ratelimit-remaining", String(remaining));
  res.setHeader("x-ratelimit-reset", String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > MAX_REQUESTS) {
    return res.status(429).json({
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests",
        details: null,
      },
    });
  }

  next();
}
