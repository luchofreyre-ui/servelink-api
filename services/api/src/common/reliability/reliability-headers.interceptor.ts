import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import {
  IDEMPOTENCY_HEADER,
  RELIABILITY_TIMEOUT_MS,
} from "./reliability.constants";
import {
  SKIP_IDEMPOTENCY_KEY,
  SKIP_RETRY_KEY,
  SKIP_TIMEOUT_KEY,
} from "./reliability.decorators";

@Injectable()
export class ReliabilityHeadersInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const skipTimeout = this.reflector.getAllAndOverride<boolean>(
      SKIP_TIMEOUT_KEY,
      [context.getHandler(), context.getClass()],
    );
    const skipRetry = this.reflector.getAllAndOverride<boolean>(SKIP_RETRY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const skipIdempotency = this.reflector.getAllAndOverride<boolean>(
      SKIP_IDEMPOTENCY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (res?.setHeader) {
      res.setHeader("x-reliability-timeout-ms", String(RELIABILITY_TIMEOUT_MS));
      res.setHeader("x-reliability-timeout-skipped", skipTimeout ? "true" : "false");
      res.setHeader("x-reliability-retry-skipped", skipRetry ? "true" : "false");
      res.setHeader(
        "x-reliability-idempotency-skipped",
        skipIdempotency ? "true" : "false",
      );

      const hasIdempotencyKey = Boolean(req?.headers?.[IDEMPOTENCY_HEADER]);
      res.setHeader(
        "x-reliability-idempotency-key-present",
        hasIdempotencyKey ? "true" : "false",
      );
    }

    return next.handle();
  }
}
