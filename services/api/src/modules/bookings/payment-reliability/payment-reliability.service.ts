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
}
