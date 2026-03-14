import { NextFunction, Request, Response } from "express";

import { httpRequestDurationSeconds } from "../metrics.registry";

type RequestWithId = Request & { requestId?: string };

export function requestLoggingMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction,
) {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationNs = process.hrtime.bigint() - startedAt;
    const durationSeconds = Number(durationNs) / 1_000_000_000;

    httpRequestDurationSeconds.observe(
      {
        method: req.method,
        route: req.route?.path
          ? String(req.route.path)
          : req.baseUrl
            ? `${req.baseUrl}${req.path}`
            : req.path || req.originalUrl || "unknown",
        status_code: String(res.statusCode),
      },
      durationSeconds,
    );

    console.log(
      JSON.stringify({
        level: "info",
        msg: "request_completed",
        requestId: req.requestId ?? null,
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: Math.round(durationSeconds * 1000),
      }),
    );
  });

  next();
}
