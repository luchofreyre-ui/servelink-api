import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";

export type RequestWithId = Request & { requestId?: string };

export function requestIdMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction,
) {
  const headerValue = req.header("x-request-id");
  const requestId =
    headerValue && String(headerValue).trim()
      ? String(headerValue).trim()
      : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  next();
}
