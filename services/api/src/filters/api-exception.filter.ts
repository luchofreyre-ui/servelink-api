import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";

import { fail } from "../utils/http";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    // Default
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal error";
    let code:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "INVALID_REQUEST"
      | "NOT_FOUND"
      | "STRIPE_NOT_CONFIGURED"
      | "WEBHOOK_INVALID_SIGNATURE"
      | "INTERNAL_ERROR" = "INTERNAL_ERROR";

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const r: any = exception.getResponse();
      const rawMessage =
        typeof r === "string"
          ? r
          : Array.isArray(r?.message)
            ? r.message.join(", ")
            : r?.message ?? exception.message;

      message = String(rawMessage ?? message);

      // Map by status first
      if (status === HttpStatus.UNAUTHORIZED) code = "UNAUTHENTICATED";
      else if (status === HttpStatus.FORBIDDEN) code = "FORBIDDEN";
      else if (status === HttpStatus.NOT_FOUND) code = "NOT_FOUND";
      else if (status >= 400 && status < 500) code = "INVALID_REQUEST";
      else code = "INTERNAL_ERROR";

      // If the message is one of our known codes, preserve it
      // (e.g., throw new ForbiddenException("STRIPE_NOT_CONFIGURED"))
      const known = new Set([
        "UNAUTHENTICATED",
        "FORBIDDEN",
        "INVALID_REQUEST",
        "NOT_FOUND",
        "STRIPE_NOT_CONFIGURED",
        "WEBHOOK_INVALID_SIGNATURE",
        "INTERNAL_ERROR",
      ]);
      if (known.has(message)) {
        code = message as any;
        // give it a nicer message for clients
        if (code === "STRIPE_NOT_CONFIGURED") message = "Stripe is not configured";
        else if (code === "WEBHOOK_INVALID_SIGNATURE") message = "Invalid Stripe webhook signature";
      }
    }

    // DEV visibility: log all 5xx errors (including HttpException wrappers)
    const shouldLog =
      !(exception instanceof HttpException) ||
      (exception instanceof HttpException && status >= 500);

    if (shouldLog) {
      // eslint-disable-next-line no-console
      console.error("[ApiExceptionFilter] 5xx exception:", {
        status,
        code,
        message,
        name: exception?.name,
        stack: exception?.stack,
        raw: exception,
      });
    }

    res.status(status).json(fail(code as any, message));
  }
}
