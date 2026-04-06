import { Controller, Headers, Post, Req } from "@nestjs/common";
import { BookingEventType } from "@prisma/client";
import type { Request } from "express";

import {
  stripeWebhookEventsTotal,
  stripeWebhookFailuresTotal,
} from "../../metrics.registry";
import { PrismaService } from "../../prisma";
import { fail, ok } from "../../utils/http";
import { StripePaymentService } from "../bookings/stripe/stripe-payment.service";
import { StripeWebhookHandlerService } from "./stripe.webhook.handler.service";

@Controller("/api/v1/stripe")
export class StripeWebhookController {
  constructor(
    private readonly db: PrismaService,
    private readonly webhookHandler: StripeWebhookHandlerService,
    private readonly bookingStripePayment: StripePaymentService,
  ) {}

  @Post("webhook")
  async handle(@Req() req: Request, @Headers("stripe-signature") sig?: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      stripeWebhookFailuresTotal.inc({ reason: "not_configured" });
      stripeWebhookEventsTotal.inc({ type: "unknown", outcome: "rejected" });
      return fail("STRIPE_NOT_CONFIGURED", "Stripe webhook is not configured");
    }
    if (!sig) {
      stripeWebhookFailuresTotal.inc({ reason: "missing_signature" });
      stripeWebhookEventsTotal.inc({ type: "unknown", outcome: "rejected" });
      return fail("INVALID_REQUEST", "Missing Stripe signature");
    }

    const raw =
      Buffer.isBuffer(req.body)
        ? (req.body as Buffer)
        : process.env.NODE_ENV === "test"
          ? Buffer.from(JSON.stringify(req.body ?? {}))
          : (req.body as Buffer);

    const ingress = await this.bookingStripePayment.processBookingStripeWebhookIngress(
      raw,
      sig,
    );

    if (!ingress.ok) {
      return ingress.response;
    }

    // Stripe typings for webhook handlers expect concrete event shapes; runtime matches.
    const event: any = ingress.event;
    const type = String(event?.type ?? "");

    stripeWebhookEventsTotal.inc({ type: type || "unknown", outcome: "received" });
    if (ingress.duplicate) {
      stripeWebhookEventsTotal.inc({ type: type || "unknown", outcome: "duplicate" });
      return ok({ duplicate: true, type });
    }
    if (ingress.applyFailed) {
      stripeWebhookEventsTotal.inc({
        type: type || "unknown",
        outcome: "reconciliation_failed",
      });
      return ok({
        processed: false,
        bookingReconciliationFailed: true,
        type,
      });
    }

    // Helper: idempotent NOTE append
    const emitNote = async (args: { bookingId: string; idempotencyKey: string; note: any }) => {
      try {
        await this.db.bookingEvent.create({
          data: {
            bookingId: args.bookingId,
            type: BookingEventType.NOTE,
            idempotencyKey: args.idempotencyKey,
            note: JSON.stringify(args.note),
          },
        });
      } catch (err: any) {
        if (err?.code === "P2002") return; // idempotent
        throw err;
      }
    };

    // ✅ Event 1: payment_intent.succeeded (note + SETTLEMENT ledger entry)
    if (type === "payment_intent.succeeded") {
      await this.webhookHandler.handlePaymentIntentSucceeded(event);
      stripeWebhookEventsTotal.inc({ type, outcome: "processed" });
      return ok({ processed: true });
    }

    // ✅ Event 2: charge.dispute.created (note + case status; no cash movement)
    if (type === "charge.dispute.created") {
      await this.webhookHandler.handleChargeDisputeCreated(event);
      stripeWebhookEventsTotal.inc({ type, outcome: "processed" });
      return ok({ processed: true });
    }

    // ✅ Event 2b: charge.dispute.funds_withdrawn (cash leaves Stripe)
    if (type === "charge.dispute.funds_withdrawn") {
      await this.webhookHandler.handleChargeDisputeFundsWithdrawn(event);
      stripeWebhookEventsTotal.inc({ type, outcome: "processed" });
      return ok({ processed: true });
    }

    // ✅ Event 2c: charge.dispute.funds_reinstated (cash returns to Stripe)
    if (type === "charge.dispute.funds_reinstated") {
      await this.webhookHandler.handleChargeDisputeFundsReinstated(event);
      stripeWebhookEventsTotal.inc({ type, outcome: "processed" });
      return ok({ processed: true });
    }

    // ✅ Event 3: charge.refund.updated (note + REFUND ledger entry)
    if (type === "charge.refund.updated") {
      await this.webhookHandler.handleChargeRefundUpdated(event);
      stripeWebhookEventsTotal.inc({ type, outcome: "processed" });
      return ok({ processed: true });
    }

    // ✅ Event: payment_intent.payment_failed
    if (type === "payment_intent.payment_failed") {
      const pi = event.data?.object as { id?: string; last_payment_error?: unknown } | undefined;
      const paymentIntentId = String(pi?.id ?? "");
      if (!paymentIntentId) {
        stripeWebhookEventsTotal.inc({ type, outcome: "processed" });
        return ok({ processed: true });
      }

      const pointer = await this.db.bookingStripePayment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      // Enrich receipt (even if orphan)
      await this.db.stripeWebhookReceipt.update({
        where: { stripeEventId: String(event.id) },
        data: { stripePaymentIntentId: paymentIntentId, bookingId: pointer?.bookingId ?? null },
      });

      if (!pointer) {
        await emitNote({
          bookingId: "UNKNOWN",
          idempotencyKey: `STRIPE_PI_FAILED_ORPHAN:${paymentIntentId}:${event.id}`,
          note: {
            type: "STRIPE_PI_FAILED_ORPHAN",
            paymentIntentId,
            stripeEventId: event.id,
            createdAt: new Date().toISOString(),
          },
        });
        stripeWebhookEventsTotal.inc({ type, outcome: "processed" });
        return ok({ processed: true });
      }

      await this.db.bookingStripePayment.update({
        where: { bookingId: pointer.bookingId },
        data: { status: "payment_failed" },
      });

      await emitNote({
        bookingId: pointer.bookingId,
        idempotencyKey: `STRIPE_PI_PAYMENT_FAILED:${pointer.bookingId}:${paymentIntentId}:${event.id}`,
        note: {
          type: "STRIPE_PI_PAYMENT_FAILED",
          bookingId: pointer.bookingId,
          paymentIntentId,
          stripeEventId: event.id,
          lastPaymentError: pi?.last_payment_error ?? null,
          createdAt: new Date().toISOString(),
        },
      });

      stripeWebhookEventsTotal.inc({ type, outcome: "processed" });
      return ok({ processed: true });
    }

    // ✅ Event: charge.dispute.closed (note + loss write-off if lost; cash movement handled by funds_* events)
    if (type === "charge.dispute.closed") {
      await this.webhookHandler.handleChargeDisputeClosed(event);
      stripeWebhookEventsTotal.inc({ type, outcome: "processed" });
      return ok({ processed: true });
    }

    // Ignore everything else for now (deterministic + safe)
    stripeWebhookEventsTotal.inc({ type: type || "unknown", outcome: "ignored" });
    return ok({ ignored: true, type });
  }
}
