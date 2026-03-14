import { Counter, Gauge, Histogram, collectDefaultMetrics, register } from "prom-client";

let initialized = false;

export function ensureMetricsInitialized() {
  if (initialized) return;
  collectDefaultMetrics();
  initialized = true;
}

ensureMetricsInitialized();

export const httpRequestDurationSeconds = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

export const stripeWebhookEventsTotal = new Counter({
  name: "stripe_webhook_events_total",
  help: "Total Stripe webhook events received",
  labelNames: ["type", "outcome"] as const,
  registers: [register],
});

export const stripeWebhookFailuresTotal = new Counter({
  name: "stripe_webhook_failures_total",
  help: "Total Stripe webhook failures",
  labelNames: ["reason"] as const,
  registers: [register],
});

export const ledgerValidationViolationsTotal = new Counter({
  name: "ledger_validation_violations_total",
  help: "Total ledger validation violations by code and currency",
  labelNames: ["code", "currency"] as const,
  registers: [register],
});

export const opsAlertsOpenTotal = new Gauge({
  name: "ops_alerts_open_total",
  help: "Current number of open ops alerts",
  labelNames: ["mode"] as const,
  registers: [register],
});

export const opsAlertsResolvedTotal = new Gauge({
  name: "ops_alerts_resolved_total",
  help: "Current number of resolved ops alerts",
  labelNames: ["mode"] as const,
  registers: [register],
});

export const stripeReconcileMismatchesTotal = new Gauge({
  name: "stripe_reconcile_mismatches_total",
  help: "Current number of Stripe reconcile mismatches by currency",
  labelNames: ["currency"] as const,
  registers: [register],
});

export const dispatchRoundsTotal = new Counter({
  name: "dispatch_rounds_total",
  help: "Total dispatch rounds started",
  labelNames: ["outcome"] as const,
  registers: [register],
});

export const dispatchOffersCreatedTotal = new Counter({
  name: "dispatch_offers_created_total",
  help: "Total dispatch offers created",
  labelNames: ["round_size"] as const,
  registers: [register],
});

export const dispatchExhaustedTotal = new Counter({
  name: "dispatch_exhausted_total",
  help: "Total times dispatch exhausted the available ranked candidate pool",
  registers: [register],
});

export const dispatchAcceptTotal = new Counter({
  name: "dispatch_accept_total",
  help: "Total successful dispatch offer acceptances",
  registers: [register],
});

export const dispatchAcceptRaceLostTotal = new Counter({
  name: "dispatch_accept_race_lost_total",
  help: "Total accept attempts that lost the race (booking already claimed)",
  registers: [register],
});

export { register };
