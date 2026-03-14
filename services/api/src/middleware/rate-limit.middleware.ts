import { Request, Response, NextFunction } from "express";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 300);

function getClientKey(req: Request) {
  const forwardedFor = req.header("x-forwarded-for");
  if (forwardedFor && String(forwardedFor).trim()) {
    return String(forwardedFor).split(",")[0].trim();
  }
  return req.ip || "unknown";
}

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
