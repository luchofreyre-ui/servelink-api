import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { ReliabilityMetricsService } from "./reliability-metrics.service";
import { RequestContextService } from "./request-context.service";

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly metrics: ReliabilityMetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const requestId = this.requestContext.createRequestId(
      req?.headers?.["x-request-id"],
    );

    req.requestId = requestId;
    this.metrics.increment("requestIdsIssued");

    if (res?.setHeader) {
      res.setHeader("x-request-id", requestId);
    }

    return next.handle();
  }
}
