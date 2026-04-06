import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  PUBLIC_PATH_PREFIXES,
  RATE_LIMIT_MAX_DEFAULT,
  RATE_LIMIT_MAX_MUTATION,
  RATE_LIMIT_MAX_PUBLIC,
  RATE_LIMIT_WINDOW_MS,
} from "./reliability.constants";
import { ReliabilityMetricsService } from "./reliability-metrics.service";
import {
  RATE_LIMIT_OVERRIDE_KEY,
  SKIP_RATE_LIMIT_KEY,
} from "./reliability.decorators";

type Bucket = {
  count: number;
  startedAt: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly reflector: Reflector,
    private readonly metrics: ReliabilityMetricsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skip) {
      this.metrics.increment("rateLimitSkipped");
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const ip = this.resolveClientKey(req);
    const method = String(req?.method ?? "").toUpperCase();
    const path = this.normalizePath(String(req?.originalUrl ?? req?.url ?? ""));

    if (this.shouldBypassForInternalTraffic(path, req)) {
      this.metrics.increment("rateLimitSkipped");
      return true;
    }

    this.evictExpiredBuckets();

    const override = this.reflector.getAllAndOverride<number>(
      RATE_LIMIT_OVERRIDE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const limit =
      typeof override === "number" && override > 0
        ? override
        : this.resolveLimit(method, path);

    const scope = `${ip}:${method}:${path}`;
    const now = Date.now();
    const bucket = this.buckets.get(scope) ?? { count: 0, startedAt: now };

    if (now - bucket.startedAt >= RATE_LIMIT_WINDOW_MS) {
      bucket.count = 0;
      bucket.startedAt = now;
    }

    bucket.count += 1;
    this.buckets.set(scope, bucket);

    if (bucket.count > limit) {
      this.metrics.increment("rateLimited");
      throw new HttpException("RATE_LIMIT", HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private resolveClientKey(req: any): string {
    const forwardedFor = req?.headers?.["x-forwarded-for"];
    if (typeof forwardedFor === "string" && forwardedFor.trim()) {
      return forwardedFor.split(",")[0].trim();
    }
    return String(req?.ip ?? "global");
  }

  private normalizePath(path: string): string {
    const queryIndex = path.indexOf("?");
    return queryIndex >= 0 ? path.slice(0, queryIndex) : path;
  }

  private resolveLimit(method: string, path: string): number {
    const isPublic = PUBLIC_PATH_PREFIXES.some((prefix) =>
      path.startsWith(prefix),
    );

    if (isPublic) {
      return RATE_LIMIT_MAX_PUBLIC;
    }

    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      return RATE_LIMIT_MAX_MUTATION;
    }

    return RATE_LIMIT_MAX_DEFAULT;
  }

  private shouldBypassForInternalTraffic(path: string, req: any): boolean {
    if (
      path.startsWith("/api/v1/stripe/webhook") ||
      path.startsWith("/api/v1/webhooks")
    ) {
      return true;
    }

    const role = String(req?.user?.role ?? "");
    if (role === "admin" || role === "system") {
      return true;
    }

    return false;
  }

  private evictExpiredBuckets(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.startedAt >= RATE_LIMIT_WINDOW_MS) {
        this.buckets.delete(key);
      }
    }
  }
}
