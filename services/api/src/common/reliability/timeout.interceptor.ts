import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, catchError, timeout } from "rxjs";
import { RELIABILITY_TIMEOUT_MS } from "./reliability.constants";
import { ReliabilityMetricsService } from "./reliability-metrics.service";
import { SKIP_TIMEOUT_KEY } from "./reliability.decorators";

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly metrics: ReliabilityMetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TIMEOUT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) {
      this.metrics.increment("timeoutSkipped");
      return next.handle();
    }

    return next.handle().pipe(
      timeout(RELIABILITY_TIMEOUT_MS),
      catchError((err: Error) => {
        if (err?.name === "TimeoutError") {
          this.metrics.increment("timeouts");
          throw new RequestTimeoutException("REQUEST_TIMEOUT");
        }
        throw err;
      }),
    );
  }
}
