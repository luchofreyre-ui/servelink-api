import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, retry, timer } from "rxjs";
import {
  RELIABILITY_GET_RETRY_COUNT,
  RELIABILITY_GET_RETRY_DELAY_MS,
} from "./reliability.constants";
import { ReliabilityMetricsService } from "./reliability-metrics.service";
import { SKIP_RETRY_KEY } from "./reliability.decorators";

@Injectable()
export class RetryInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly metrics: ReliabilityMetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RETRY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) {
      this.metrics.increment("retrySkipped");
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const method = String(req?.method ?? "").toUpperCase();

    if (method !== "GET") {
      return next.handle();
    }

    return next.handle().pipe(
      retry({
        count: RELIABILITY_GET_RETRY_COUNT,
        delay: (_err, retryCount) => {
          this.metrics.increment("retries");
          return timer(retryCount * RELIABILITY_GET_RETRY_DELAY_MS);
        },
      }),
    );
  }
}
