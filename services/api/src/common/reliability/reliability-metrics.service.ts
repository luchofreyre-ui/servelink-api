import { Injectable } from "@nestjs/common";

type CounterKey =
  | "timeouts"
  | "retries"
  | "rateLimited"
  | "idempotencyHits"
  | "idempotencyStores"
  | "idempotencyExpired"
  | "requestIdsIssued"
  | "rateLimitSkipped"
  | "timeoutSkipped"
  | "retrySkipped"
  | "idempotencySkipped";

@Injectable()
export class ReliabilityMetricsService {
  private readonly counters: Record<CounterKey, number> = {
    timeouts: 0,
    retries: 0,
    rateLimited: 0,
    idempotencyHits: 0,
    idempotencyStores: 0,
    idempotencyExpired: 0,
    requestIdsIssued: 0,
    rateLimitSkipped: 0,
    timeoutSkipped: 0,
    retrySkipped: 0,
    idempotencySkipped: 0,
  };

  increment(key: CounterKey, by = 1): void {
    this.counters[key] += by;
  }

  snapshot() {
    return {
      ...this.counters,
      ts: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
