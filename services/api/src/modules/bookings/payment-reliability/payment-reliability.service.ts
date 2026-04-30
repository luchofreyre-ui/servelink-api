import { Injectable } from "@nestjs/common";
import {
  BookingEventType,
  BookingPaymentStatus,
  Prisma,
} from "@prisma/client";

import { PrismaService } from "../../../prisma";
import type {
  RecordPaymentAnomalyInput,
  RecordWebhookFailureInput,
} from "./payment-reliability.types";

const DUPLICATE_ANOMALY_KIND = "duplicate_stripe_webhook_event";
/** Legacy anomaly kind from removed compatibility webhook; DB rows may still exist — do not create new ones. */

export type PaymentOpsSummary = {
  openAnomalyCount: number;
  recentWebhookFailureCount: number;
  stuckPendingPaymentShortCount: number;
  stuckPendingPaymentLongCount: number;
  duplicateWebhookRecentCount: number;
  paidMissingStripeIdsCount: number;
  stripeIdsButUnpaidCount: number;
  webhookReceiptsMissingBookingEventCount: number;
};

const PUBLIC_BOOKING_LIFECYCLE_ANOMALY_KINDS = [
  "public_booking_hold_failed",
  "public_booking_deposit_failed",
  "public_booking_confirm_failed",
] as const;

const PUBLIC_BOOKING_LIFECYCLE_FAILURE_CODES = [
  "PUBLIC_BOOKING_INVALID_SLOT_ID",
  "PUBLIC_BOOKING_SLOT_NOT_AVAILABLE",
  "PUBLIC_BOOKING_SLOT_IN_PAST",
  "PUBLIC_BOOKING_HOLD_EXPIRED",
  "PUBLIC_BOOKING_HOLD_NOT_FOUND",
  "PUBLIC_BOOKING_DEPOSIT_UNRESOLVED",
  "UNKNOWN",
] as const;

type PublicBookingLifecycleFailureCode =
  (typeof PUBLIC_BOOKING_LIFECYCLE_FAILURE_CODES)[number];

type PublicBookingLifecycleAlert = {
  code:
    | "PUBLIC_BOOKING_HOLD_FAILURE_RATE_HIGH"
    | "PUBLIC_BOOKING_CONFIRM_FAILURE_RATE_HIGH"
    | "PUBLIC_BOOKING_UNKNOWN_FAILURE_PRESENT";
  severity: "warning";
  message: string;
  value: number;
  threshold: number;
};

type EstimateLearningWinner =
  | "legacy_v1"
  | "estimate_v2"
  | "tie"
  | "insufficient_data";

type EstimateLearningEventPayload = {
  bookingId: string | null;
  actualMinutes: number | null;
  winner: EstimateLearningWinner;
  legacyV1VarianceMinutes: number | null;
  estimateV2VarianceMinutes: number | null;
  legacyV1AbsVarianceMinutes: number | null;
  estimateV2AbsVarianceMinutes: number | null;
  riskLevel: string | null;
  computedAt: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeEstimateLearningWinner(raw: unknown): EstimateLearningWinner {
  const winner = stringValue(raw);
  if (
    winner === "legacy_v1" ||
    winner === "estimate_v2" ||
    winner === "tie" ||
    winner === "insufficient_data"
  ) {
    return winner;
  }
  return "insufficient_data";
}

function parseEstimateLearningPayload(event: {
  bookingId: string;
  payload: Prisma.JsonValue;
  createdAt: Date;
}): EstimateLearningEventPayload | null {
  const payload = asRecord(event.payload);
  if (payload.kind !== "estimate_learning_result") return null;
  const legacyV1 = asRecord(payload.legacyV1);
  const estimateV2 = asRecord(payload.estimateV2);
  const computedAt =
    stringValue(payload.computedAt) ?? event.createdAt.toISOString();
  return {
    bookingId: stringValue(payload.bookingId) ?? event.bookingId,
    actualMinutes: numberValue(payload.actualMinutes),
    winner: normalizeEstimateLearningWinner(payload.winner),
    legacyV1VarianceMinutes: numberValue(legacyV1.varianceMinutes),
    estimateV2VarianceMinutes: numberValue(estimateV2.varianceMinutes),
    legacyV1AbsVarianceMinutes:
      numberValue(legacyV1.varianceMinutes) == null
        ? null
        : Math.abs(numberValue(legacyV1.varianceMinutes)!),
    estimateV2AbsVarianceMinutes:
      numberValue(estimateV2.varianceMinutes) == null
        ? null
        : Math.abs(numberValue(estimateV2.varianceMinutes)!),
    riskLevel: stringValue(payload.riskLevel),
    computedAt,
  };
}

function normalizePublicBookingLifecycleCode(
  raw: unknown,
): PublicBookingLifecycleFailureCode {
  const code = stringValue(raw);
  if (
    code &&
    PUBLIC_BOOKING_LIFECYCLE_FAILURE_CODES.includes(
      code as PublicBookingLifecycleFailureCode,
    ) &&
    code !== "UNKNOWN"
  ) {
    return code as PublicBookingLifecycleFailureCode;
  }
  return "UNKNOWN";
}

@Injectable()
export class PaymentReliabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAnomaly(input: RecordPaymentAnomalyInput) {
    return this.prisma.paymentAnomaly.create({
      data: {
        bookingId: input.bookingId ?? undefined,
        stripeEventId: input.stripeEventId ?? undefined,
        kind: input.kind,
        severity: input.severity ?? "warning",
        status: input.status ?? "open",
        message: input.message,
        details:
          input.details === undefined || input.details === null
            ? Prisma.JsonNull
            : (input.details as Prisma.InputJsonValue),
      },
    });
  }

  async recordWebhookFailure(input: RecordWebhookFailureInput) {
    return this.prisma.paymentWebhookFailure.create({
      data: {
        stripeEventId: input.stripeEventId ?? undefined,
        eventType: input.eventType ?? undefined,
        endpointPath: input.endpointPath,
        failureKind: input.failureKind,
        message: input.message,
        payload:
          input.payload === undefined || input.payload === null
            ? Prisma.JsonNull
            : (input.payload as Prisma.InputJsonValue),
      },
    });
  }

  async resolveAnomaliesForBooking(bookingId: string) {
    const now = new Date();
    return this.prisma.paymentAnomaly.updateMany({
      where: { bookingId, status: "open" },
      data: { status: "resolved", resolvedAt: now },
    });
  }

  async getOpenAnomalies(args?: { take?: number; bookingId?: string }) {
    const take = Math.min(args?.take ?? 50, 200);
    return this.prisma.paymentAnomaly.findMany({
      where: {
        status: "open",
        ...(args?.bookingId ? { bookingId: args.bookingId } : {}),
      },
      orderBy: { detectedAt: "desc" },
      take,
    });
  }

  async getPaymentOpsSummary(): Promise<PaymentOpsSummary> {
    const now = new Date();
    const ms30 = 30 * 60 * 1000;
    const ms24h = 24 * 60 * 60 * 1000;
    const t30 = new Date(now.getTime() - ms30);
    const t24h = new Date(now.getTime() - ms24h);
    const t7d = new Date(now.getTime() - 7 * ms24h);

    const [
      openAnomalyCount,
      recentWebhookFailureCount,
      duplicateWebhookRecentCount,
      stuckShort,
      stuckLong,
      paidMissingStripeIds,
      stripeIdsButUnpaid,
    ] = await Promise.all([
      this.prisma.paymentAnomaly.count({ where: { status: "open" } }),
      this.prisma.paymentWebhookFailure.count({
        where: {
          createdAt: { gte: t24h },
        },
      }),
      this.prisma.paymentAnomaly.count({
        where: {
          kind: DUPLICATE_ANOMALY_KIND,
          detectedAt: { gte: t7d },
        },
      }),
      this.prisma.booking.count({
        where: {
          paymentStatus: {
            in: [
              BookingPaymentStatus.checkout_created,
              BookingPaymentStatus.payment_pending,
            ],
          },
          updatedAt: { lt: t30 },
        },
      }),
      this.prisma.booking.count({
        where: {
          paymentStatus: {
            in: [
              BookingPaymentStatus.checkout_created,
              BookingPaymentStatus.payment_pending,
            ],
          },
          updatedAt: { lt: t24h },
        },
      }),
      this.prisma.booking.count({
        where: {
          paymentStatus: BookingPaymentStatus.paid,
          stripePaymentIntentId: null,
        },
      }),
      this.prisma.booking.count({
        where: {
          paymentStatus: {
            in: [
              BookingPaymentStatus.unpaid,
              BookingPaymentStatus.checkout_created,
              BookingPaymentStatus.payment_pending,
            ],
          },
          AND: [
            { stripePaymentIntentId: { not: null } },
            { stripeCheckoutSessionId: { not: null } },
          ],
        },
      }),
    ]);

    const webhookReceiptsMissingBookingEventCount =
      await this.countReceiptsMissingPaymentEvent();

    return {
      openAnomalyCount,
      recentWebhookFailureCount,
      stuckPendingPaymentShortCount: stuckShort,
      stuckPendingPaymentLongCount: stuckLong,
      duplicateWebhookRecentCount,
      paidMissingStripeIdsCount: paidMissingStripeIds,
      stripeIdsButUnpaidCount: stripeIdsButUnpaid,
      webhookReceiptsMissingBookingEventCount,
    };
  }

  /**
   * Receipts for booking-affecting Stripe events that resolved a booking but have no
   * PAYMENT_STATUS_CHANGED row referencing the same stripeEventId in payload.
   */
  private async countReceiptsMissingPaymentEvent(): Promise<number> {
    const types = [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "payment_intent.succeeded",
    ];
    const receipts = await this.prisma.stripeWebhookReceipt.findMany({
      where: {
        type: { in: types },
        bookingResolvedId: { not: null },
      },
      select: {
        id: true,
        stripeEventId: true,
        bookingResolvedId: true,
      },
      take: 500,
    });
    if (receipts.length === 0) return 0;

    const bookingIds = [
      ...new Set(
        receipts
          .map((r) => r.bookingResolvedId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (bookingIds.length === 0) return 0;

    const events = await this.prisma.bookingEvent.findMany({
      where: {
        bookingId: { in: bookingIds },
        type: BookingEventType.PAYMENT_STATUS_CHANGED,
      },
      select: {
        bookingId: true,
        payload: true,
      },
    });

    const keys = new Set<string>();
    for (const ev of events) {
      const p = ev.payload as Record<string, unknown> | null;
      const se = p?.stripeEventId;
      if (typeof se === "string" && se) {
        keys.add(`${ev.bookingId}:${se}`);
      }
    }

    let missing = 0;
    for (const r of receipts) {
      if (!r.bookingResolvedId || !r.stripeEventId) continue;
      if (!keys.has(`${r.bookingResolvedId}:${r.stripeEventId}`)) {
        missing += 1;
      }
    }
    return missing;
  }

  async recordDuplicateStripeEvent(stripeEventId: string, eventType: string) {
    return this.recordAnomaly({
      stripeEventId,
      kind: DUPLICATE_ANOMALY_KIND,
      severity: "info",
      message: `Duplicate Stripe event id received (${eventType}); processing skipped (idempotent).`,
      details: { eventType },
    });
  }

  async getPublicBookingLifecycleSummary() {
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const failures = await this.prisma.paymentAnomaly.findMany({
      where: {
        kind: { in: [...PUBLIC_BOOKING_LIFECYCLE_ANOMALY_KINDS] },
        detectedAt: { gte: since },
      },
      orderBy: { detectedAt: "desc" },
      take: 200,
    });

    const failureBreakdown = Object.fromEntries(
      PUBLIC_BOOKING_LIFECYCLE_FAILURE_CODES.map((code) => [code, 0]),
    ) as Record<PublicBookingLifecycleFailureCode, number>;
    let holdFailed = 0;
    let depositFailed = 0;
    let confirmFailed = 0;

    const recentFailures = failures.slice(0, 25).map((failure) => {
      const details = asRecord(failure.details);
      const code = normalizePublicBookingLifecycleCode(details.code);
      failureBreakdown[code] += 1;
      if (failure.kind === "public_booking_hold_failed") holdFailed += 1;
      if (failure.kind === "public_booking_deposit_failed") depositFailed += 1;
      if (failure.kind === "public_booking_confirm_failed") confirmFailed += 1;
      return {
        kind: failure.kind,
        bookingId: failure.bookingId ?? stringValue(details.bookingId),
        holdId: stringValue(details.holdId),
        code,
        stage: stringValue(details.stage) ?? "unknown",
        createdAt: failure.detectedAt.toISOString(),
      };
    });

    for (const failure of failures.slice(25)) {
      const details = asRecord(failure.details);
      const code = normalizePublicBookingLifecycleCode(details.code);
      failureBreakdown[code] += 1;
      if (failure.kind === "public_booking_hold_failed") holdFailed += 1;
      if (failure.kind === "public_booking_deposit_failed") depositFailed += 1;
      if (failure.kind === "public_booking_confirm_failed") confirmFailed += 1;
    }

    const totals = {
      availabilityResults: 0,
      holdAttempts: holdFailed,
      holdSucceeded: 0,
      holdFailed,
      depositPrepareResults: depositFailed,
      confirmAttempts: confirmFailed,
      confirmSucceeded: 0,
      confirmFailed,
    };
    const holdFailureRate =
      totals.holdAttempts > 0 ? totals.holdFailed / totals.holdAttempts : 0;
    const confirmFailureRate =
      totals.confirmAttempts > 0
        ? totals.confirmFailed / totals.confirmAttempts
        : 0;

    const alerts: PublicBookingLifecycleAlert[] = [];
    if (holdFailureRate > 0.15) {
      alerts.push({
        code: "PUBLIC_BOOKING_HOLD_FAILURE_RATE_HIGH",
        severity: "warning",
        message: "Public booking hold failure rate is above 15% over 24h.",
        value: holdFailureRate,
        threshold: 0.15,
      });
    }
    if (confirmFailureRate > 0.05) {
      alerts.push({
        code: "PUBLIC_BOOKING_CONFIRM_FAILURE_RATE_HIGH",
        severity: "warning",
        message: "Public booking confirm failure rate is above 5% over 24h.",
        value: confirmFailureRate,
        threshold: 0.05,
      });
    }
    if (failureBreakdown.UNKNOWN > 0) {
      alerts.push({
        code: "PUBLIC_BOOKING_UNKNOWN_FAILURE_PRESENT",
        severity: "warning",
        message: "Unknown public booking lifecycle failures were observed over 24h.",
        value: failureBreakdown.UNKNOWN,
        threshold: 0,
      });
    }

    return {
      window: "24h",
      totals,
      rates: {
        holdFailureRate,
        confirmFailureRate,
      },
      failureBreakdown,
      recentFailures,
      observabilityCoverage: {
        successCountsPersisted: false,
        failureCountsPersisted: true,
      },
      alerts,
    };
  }

  async getEstimateLearningSummary() {
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const rows = await this.prisma.bookingEvent.findMany({
      where: {
        type: BookingEventType.NOTE,
        idempotencyKey: { startsWith: "estimate-learning-result:" },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        bookingId: true,
        payload: true,
        createdAt: true,
      },
    });
    const results = rows
      .map(parseEstimateLearningPayload)
      .filter((r): r is EstimateLearningEventPayload => r != null);

    const totals = {
      completedWithActuals: results.filter((r) => r.actualMinutes != null).length,
      legacyV1Wins: results.filter((r) => r.winner === "legacy_v1").length,
      estimateV2Wins: results.filter((r) => r.winner === "estimate_v2").length,
      ties: results.filter((r) => r.winner === "tie").length,
      insufficientData: results.filter((r) => r.winner === "insufficient_data")
        .length,
    };

    const average = (values: Array<number | null>): number => {
      const xs = values.filter((v): v is number => v != null);
      if (xs.length === 0) return 0;
      return xs.reduce((sum, v) => sum + v, 0) / xs.length;
    };

    const riskGroups = new Map<string, EstimateLearningEventPayload[]>();
    for (const result of results) {
      const key = result.riskLevel ?? "unknown";
      riskGroups.set(key, [...(riskGroups.get(key) ?? []), result]);
    }

    return {
      window: "24h",
      totals,
      averages: {
        legacyV1AbsVarianceMinutes: average(
          results.map((r) => r.legacyV1AbsVarianceMinutes),
        ),
        estimateV2AbsVarianceMinutes: average(
          results.map((r) => r.estimateV2AbsVarianceMinutes),
        ),
        legacyV1BiasMinutes: average(
          results.map((r) => r.legacyV1VarianceMinutes),
        ),
        estimateV2BiasMinutes: average(
          results.map((r) => r.estimateV2VarianceMinutes),
        ),
      },
      byRiskLevel: [...riskGroups.entries()].map(([riskLevel, group]) => ({
        riskLevel,
        count: group.length,
        legacyV1Wins: group.filter((r) => r.winner === "legacy_v1").length,
        estimateV2Wins: group.filter((r) => r.winner === "estimate_v2").length,
        legacyV1AbsVarianceMinutes: average(
          group.map((r) => r.legacyV1AbsVarianceMinutes),
        ),
        estimateV2AbsVarianceMinutes: average(
          group.map((r) => r.estimateV2AbsVarianceMinutes),
        ),
      })),
      recentResults: results.slice(0, 25).map((r) => ({
        bookingId: r.bookingId,
        actualMinutes: r.actualMinutes,
        winner: r.winner,
        legacyV1VarianceMinutes: r.legacyV1VarianceMinutes,
        estimateV2VarianceMinutes: r.estimateV2VarianceMinutes,
        riskLevel: r.riskLevel,
        computedAt: r.computedAt,
      })),
      observabilityCoverage: {
        learningResultsPersisted: true,
        requiresActualMinutes: true,
        autoTuningEnabled: false,
      },
    };
  }
}
