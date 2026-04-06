import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import {
  IDEMPOTENCY_HEADER,
  IDEMPOTENCY_TTL_MS,
} from "./reliability.constants";
import { ReliabilityMetricsService } from "./reliability-metrics.service";
import { SKIP_IDEMPOTENCY_KEY } from "./reliability.decorators";

type IdempotencyEntry = {
  value: unknown;
  expiresAt: number;
};

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly store = new Map<string, IdempotencyEntry>();

  constructor(
    private readonly reflector: Reflector,
    private readonly metrics: ReliabilityMetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    this.evictExpiredEntries();

    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_IDEMPOTENCY_KEY,
      [context.getHandler(), context.getClass()],
    );

    const req = context.switchToHttp().getRequest();
    const path = String(req?.originalUrl ?? req?.url ?? "");

    if (skip || this.shouldBypass(path)) {
      this.metrics.increment("idempotencySkipped");
      return next.handle();
    }

    const method = String(req?.method ?? "").toUpperCase();
    if (!["POST", "PUT", "PATCH"].includes(method)) {
      return next.handle();
    }

    const rawKey = req?.headers?.[IDEMPOTENCY_HEADER];
    const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;

    if (!key || typeof key !== "string" || key.trim().length === 0) {
      return next.handle();
    }

    const normalizedPath = this.normalizePath(path);
    const scopedKey = `${method}:${normalizedPath}:${key}`;
    const existing = this.store.get(scopedKey);

    if (existing && existing.expiresAt > Date.now()) {
      this.metrics.increment("idempotencyHits");
      return new Observable((subscriber) => {
        subscriber.next(existing.value);
        subscriber.complete();
      });
    }

    return next.handle().pipe(
      tap((value) => {
        this.store.set(scopedKey, {
          value,
          expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
        });
        this.metrics.increment("idempotencyStores");
      }),
    );
  }

  private shouldBypass(path: string): boolean {
    const normalized = this.normalizePath(path);
    return (
      normalized.startsWith("/api/v1/stripe/webhook") ||
      normalized.startsWith("/api/v1/webhooks") ||
      normalized === "/health" ||
      normalized.startsWith("/api/v1/system/")
    );
  }

  private normalizePath(path: string): string {
    const queryIndex = path.indexOf("?");
    return queryIndex >= 0 ? path.slice(0, queryIndex) : path;
  }

  private evictExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
        this.metrics.increment("idempotencyExpired");
      }
    }
  }
}
