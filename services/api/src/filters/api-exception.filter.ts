import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";

import { fail, type ApiErrorCode } from "../utils/http";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { requestId?: string }>();

    // Default
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal error";
    let details: unknown = null;
    let code:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "INVALID_REQUEST"
      | "NOT_FOUND"
      | "PAYMENT_REQUIRED"
      | "STRIPE_NOT_CONFIGURED"
      | "WEBHOOK_INVALID_SIGNATURE"
      | "INTERNAL_ERROR" = "INTERNAL_ERROR";

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      // Mandatory debug visibility (terminal): 5xx and unexpected errors
      if (status >= 500) {
        // eslint-disable-next-line no-console
        console.error("GLOBAL ERROR:", exception?.stack ?? exception);
      }

      const r: any = exception.getResponse();
      const rawMessage =
        typeof r === "string"
          ? r
          : Array.isArray(r?.message)
            ? r.message.join(", ")
            : r?.message ?? exception.message;

      message = String(rawMessage ?? message);

      // Preserve structured public-booking deposit payloads for clients (402 + related).
      if (typeof r === "object" && r !== null && !Array.isArray(r)) {
        const kind = (r as { kind?: unknown }).kind;
        if (
          typeof kind === "string" &&
          kind.startsWith("public_booking_deposit")
        ) {
          const { statusCode: _sc, error: _err, ...rest } = r as Record<
            string,
            unknown
          >;
          details = rest;
          if (typeof (rest as { message?: unknown }).message === "string") {
            message = String((rest as { message: string }).message);
          }
        }
      }

      // Map by status first
      if (status === HttpStatus.UNAUTHORIZED) code = "UNAUTHENTICATED";
      else if (status === HttpStatus.FORBIDDEN) code = "FORBIDDEN";
      else if (status === HttpStatus.NOT_FOUND) code = "NOT_FOUND";
      else if (status === HttpStatus.PAYMENT_REQUIRED) code = "PAYMENT_REQUIRED";
      else if (status === HttpStatus.SERVICE_UNAVAILABLE) {
        const rc =
          typeof r === "object" && r !== null
            ? (r as { code?: unknown }).code
            : null;
        if (rc === "PUBLIC_BOOKING_STRIPE_NOT_CONFIGURED") {
          code = "STRIPE_NOT_CONFIGURED";
          const msg = (r as { message?: unknown }).message;
          message =
            typeof msg === "string" && msg.trim().length > 0
              ? msg.trim()
              : "Stripe is not configured for public booking deposits.";
          const { statusCode: _sc, error: _err, ...rest } = r as Record<
            string,
            unknown
          >;
          details = rest;
        } else code = "INTERNAL_ERROR";
      } else if (status >= 400 && status < 500) code = "INVALID_REQUEST";
      else code = "INTERNAL_ERROR";

      // If the message is one of our known codes, preserve it
      // (e.g., throw new ForbiddenException("STRIPE_NOT_CONFIGURED"))
      const known = new Set([
        "UNAUTHENTICATED",
        "FORBIDDEN",
        "INVALID_REQUEST",
        "NOT_FOUND",
        "PAYMENT_REQUIRED",
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
    } else {
      // Mandatory debug visibility (terminal): non-HTTP exceptions
      // eslint-disable-next-line no-console
      console.error("GLOBAL ERROR:", exception?.stack ?? exception);
    }

    // DEV visibility: log all 5xx errors (including HttpException wrappers)
    const shouldLog =
      !(exception instanceof HttpException) ||
      (exception instanceof HttpException && status >= 500);

    if (shouldLog) {
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          level: "error",
          msg: "request_failed",
          requestId: req?.requestId ?? null,
          method: req?.method ?? null,
          path: req?.originalUrl ?? req?.url ?? null,
          status,
          code,
          message,
          errorName: exception?.name ?? null,
          stack: exception?.stack ?? null,
        }),
      );
    }

    res
      .status(status)
      .json(fail(code as ApiErrorCode, message, details));
  }
}
